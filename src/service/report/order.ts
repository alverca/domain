/**
 * 売上レポートサービス
 */
import * as factory from '@alverca/factory';
import * as cinerinoapi from '@cinerino/sdk';
import * as moment from 'moment-timezone';
import * as util from 'util';

import { MongoRepository as ReportRepo } from '../../repo/report';

export import PriceSpecificationType = cinerinoapi.factory.chevre.priceSpecificationType;
export type ICompoundPriceSpecification = factory.chevre.compoundPriceSpecification.IPriceSpecification<PriceSpecificationType>;

/**
 * 注文アイテムから単価を取得する
 */
function getUnitPriceByAcceptedOffer(offer: cinerinoapi.factory.order.IAcceptedOffer<any>) {
    let unitPrice: number = 0;

    const priceSpecType = offer.priceSpecification?.typeOf;
    if (priceSpecType === PriceSpecificationType.CompoundPriceSpecification) {
        const priceSpecification = <ICompoundPriceSpecification>offer.priceSpecification;
        const unitPriceSpec = priceSpecification.priceComponent?.find((c) => c.typeOf === PriceSpecificationType.UnitPriceSpecification);
        if (typeof unitPriceSpec?.price === 'number') {
            unitPrice = unitPriceSpec.price;
        }
    }

    return unitPrice;
}

function getSortBy(order: cinerinoapi.factory.order.IOrder, reservation: cinerinoapi.factory.order.IReservation, status: string) {
    const seatNumber = reservation.reservedTicket.ticketedSeat?.seatNumber;

    return util.format(
        '%s:%s:%s:%s',
        `00000000000000000000${moment(reservation.reservationFor.startDate)
            .unix()}`
            // tslint:disable-next-line:no-magic-numbers
            .slice(-20),
        `00000000000000000000${order.confirmationNumber}`
            // tslint:disable-next-line:no-magic-numbers
            .slice(-20),
        status,
        (typeof seatNumber === 'string') ? seatNumber : reservation.id
    );
}

/**
 * 注文からレポートを作成する
 */
export function createOrderReport(params: {
    order: cinerinoapi.factory.order.IOrder;
}) {
    return async (repos: { report: ReportRepo }): Promise<void> => {
        let datas: factory.report.order.IReport[] = [];

        switch (params.order.orderStatus) {
            case cinerinoapi.factory.orderStatus.OrderProcessing:
                datas = params.order.acceptedOffers
                    .map((o, index) => {
                        const unitPrice = getUnitPriceByAcceptedOffer(o);

                        return reservation2report({
                            category: factory.report.order.ReportCategory.Reserved,
                            r: <cinerinoapi.factory.order.IReservation>o.itemOffered,
                            unitPrice: unitPrice,
                            order: params.order,
                            paymentSeatIndex: index,
                            salesDate: moment(params.order.orderDate)
                                .toDate()
                        });
                    });

                break;

            case cinerinoapi.factory.orderStatus.OrderDelivered:
                break;

            case cinerinoapi.factory.orderStatus.OrderReturned:
                datas = params.order.acceptedOffers
                    .map((o, index) => {
                        const unitPrice = getUnitPriceByAcceptedOffer(o);

                        return reservation2report({
                            category: factory.report.order.ReportCategory.Cancelled,
                            r: <cinerinoapi.factory.order.IReservation>o.itemOffered,
                            unitPrice: unitPrice,
                            order: params.order,
                            paymentSeatIndex: index,
                            salesDate: moment(<Date>params.order.dateReturned)
                                .toDate()
                        });
                    });
                break;

            default:
        }

        // 冪等性の確保!
        await Promise.all(datas.map(async (data) => {
            await repos.report.saveReport(data);
        }));
    };
}

/**
 * 返金された注文からレポートを作成する
 */
export function createRefundOrderReport(params: {
    order: cinerinoapi.factory.order.IOrder;
}) {
    return async (repos: { report: ReportRepo }): Promise<void> => {
        const datas: factory.report.order.IReport[] = [];
        if (params.order.acceptedOffers.length > 0) {
            const acceptedOffer = params.order.acceptedOffers[0];
            const r = <cinerinoapi.factory.order.IReservation>acceptedOffer.itemOffered;
            const unitPrice = getUnitPriceByAcceptedOffer(acceptedOffer);

            datas.push({
                ...reservation2report({
                    category: factory.report.order.ReportCategory.CancellationFee,
                    r: r,
                    unitPrice: unitPrice,
                    order: params.order,
                    // 返品手数料行にはpayment_seat_indexなし
                    paymentSeatIndex: undefined,
                    salesDate: moment(<Date>params.order.dateReturned)
                        .toDate()
                })
            });
        }

        // 冪等性の確保!
        await Promise.all(datas.map(async (data) => {
            await repos.report.saveReport(data);
        }));
    };
}

/**
 * 予約データをcsvデータ型に変換する
 */
// tslint:disable-next-line:cyclomatic-complexity max-func-body-length
function reservation2report(params: {
    category: factory.report.order.ReportCategory;
    r: factory.chevre.reservation.IReservation<factory.chevre.reservationType.EventReservation>;
    unitPrice: number;
    order: cinerinoapi.factory.order.IOrder;
    paymentSeatIndex?: number;
    salesDate: Date;
}): factory.report.order.IReport {
    const order = params.order;

    const age = (typeof order.customer.age === 'string') ? order.customer.age : '';

    let username = '';
    if (typeof order.customer.memberOf?.membershipNumber === 'string') {
        username = order.customer.memberOf.membershipNumber;
    }

    let paymentMethodName = '';
    // 決済方法区分がOthersの場合のみ、名称を取り込む
    if (Array.isArray(order.paymentMethods) && order.paymentMethods.length > 0) {
        if (order.paymentMethods[0].typeOf === 'Others') {
            paymentMethodName = order.paymentMethods[0].name;
        } else {
            paymentMethodName = order.paymentMethods[0].typeOf;
        }
    }

    const locale = (typeof order.customer.address === 'string') ? order.customer.address : '';
    const gender = (typeof order.customer.gender === 'string') ? order.customer.gender : '';
    const customerSegment = (locale !== '' ? locale : '__') + (age !== '' ? age : '__') + (gender !== '' ? gender : '_');

    let csvCode = params.r.reservedTicket.ticketType.additionalProperty?.find((p) => p.name === 'csvCode')?.value;
    if (typeof csvCode !== 'string') {
        csvCode = '';
    }

    const customerGroup: string = order2customerGroup(order);
    const seatNumber = params.r.reservedTicket.ticketedSeat?.seatNumber;

    let amount: number = Number(order.price);
    let sortBy: string;
    switch (params.category) {
        case factory.report.order.ReportCategory.CancellationFee:
            let cancellationFee = 0;
            const returnerIdentifier = params.order.returner?.identifier;
            if (Array.isArray(returnerIdentifier)) {
                const cancellationFeeValue = returnerIdentifier.find((p) => p.name === 'cancellationFee')?.value;
                if (cancellationFeeValue !== undefined) {
                    cancellationFee = Number(cancellationFeeValue);
                }
            }
            amount = cancellationFee;

            sortBy = getSortBy(params.order, params.r, '02');
            break;

        case factory.report.order.ReportCategory.Cancelled:
            sortBy = getSortBy(params.order, params.r, '01');
            break;

        case factory.report.order.ReportCategory.Reserved:
            sortBy = getSortBy(params.order, params.r, '00');
            break;

        default:
            throw new Error(`category ${params.category} not implemented`);
    }

    const customer: factory.report.order.ICustomer = {
        group: customerGroup2reportString({ group: customerGroup }),
        givenName: (typeof order.customer.givenName === 'string') ? order.customer.givenName : '',
        familyName: (typeof order.customer.familyName === 'string') ? order.customer.familyName : '',
        email: (typeof order.customer.email === 'string') ? order.customer.email : '',
        telephone: (typeof order.customer.telephone === 'string') ? order.customer.telephone : '',
        segment: customerSegment,
        username: username
    };

    const paymentMethod: string = paymentMethodName2reportString({ name: paymentMethodName });

    const mainEntity: factory.report.order.IMainEntity = {
        confirmationNumber: order.confirmationNumber,
        customer: customer,
        orderDate: moment(order.orderDate)
            .toDate(),
        orderNumber: order.orderNumber,
        paymentMethod: paymentMethod,
        price: order.price,
        typeOf: order.typeOf
    };

    const reservation: factory.report.order.IReservation = {
        id: params.r.id,
        reservationFor: {
            id: params.r.reservationFor.id,
            startDate: moment(params.r.reservationFor.startDate)
                .toDate()
        },
        reservedTicket: {
            ticketType: {
                csvCode,
                name: <any>params.r.reservedTicket.ticketType.name,
                ...(typeof params.unitPrice === 'number')
                    ? { priceSpecification: { price: params.unitPrice } }
                    : undefined
            },
            ticketedSeat: (typeof seatNumber === 'string') ? { seatNumber } : undefined
        }
    };

    return {
        amount: amount,
        category: params.category,
        dateRecorded: params.salesDate,
        mainEntity: mainEntity,
        project: { typeOf: order.project.typeOf, id: order.project.id },
        reservation: reservation,
        sortBy,
        ...(typeof params.paymentSeatIndex === 'number') ? { payment_seat_index: params.paymentSeatIndex } : undefined
    };
}

function order2customerGroup(params: cinerinoapi.factory.order.IOrder) {
    let customerGroup: string = 'Customer';
    if (Array.isArray(params.customer.identifier)) {
        const customerGroupValue = params.customer.identifier.find((i) => i.name === 'customerGroup')?.value;
        if (typeof customerGroupValue === 'string') {
            customerGroup = customerGroupValue;
        }
    }

    return customerGroup;
}

function paymentMethodName2reportString(params: { name: string }) {
    if (params.name === 'CreditCard') {
        return '0';
    }

    return params.name;
}

function customerGroup2reportString(params: { group: string }) {
    if (params.group === 'Customer') {
        return '01';
    } else if (params.group === 'Staff') {
        return '04';
    }

    return params.group;
}
