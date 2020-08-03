import * as cinerinoapi from '@cinerino/sdk';
import * as factory from '@tokyotower/factory';
import * as moment from 'moment-timezone';

import { MongoRepository as PerformanceRepo } from '../repo/performance';
import { MongoRepository as TaskRepo } from '../repo/task';

import { credentials } from '../credentials';

const cinerinoAuthClient = new cinerinoapi.auth.ClientCredentials({
    domain: credentials.cinerino.authorizeServerDomain,
    clientId: credentials.cinerino.clientId,
    clientSecret: credentials.cinerino.clientSecret,
    scopes: [],
    state: ''
});

export type ISearchResult = factory.performance.IPerformanceWithAvailability[];

export type ISearchOperation<T> = (repos: {
    performance: PerformanceRepo;
}) => Promise<T>;

// 作成情報取得
const setting = {
    offerCodes: [
        '001',
        '002',
        '003',
        '004',
        '005',
        '006'
    ]
};

export function importFromCinerino(params: factory.chevre.event.IEvent<factory.chevre.eventType.ScreeningEvent>) {
    return async (repos: {
        performance: PerformanceRepo;
        task: TaskRepo;
    }) => {
        const event = params;

        const eventService = new cinerinoapi.service.Event({
            endpoint: credentials.cinerino.endpoint,
            auth: cinerinoAuthClient,
            project: { id: event.project.id }
        });

        // ひとつめのイベントのオファー検索
        const offers = await eventService.searchTicketOffers({
            event: { id: event.id },
            seller: {
                typeOf: <cinerinoapi.factory.organizationType>event.offers?.seller?.typeOf,
                id: <string>event.offers?.seller?.id
            },
            store: {
                id: credentials.cinerino.clientId
            }
        });

        const unitPriceOffers: cinerinoapi.factory.chevre.offer.IUnitPriceOffer[] = offers
            // 指定のオファーコードに限定する
            .filter((o) => setting.offerCodes.includes(o.identifier))
            .map((o) => {
                // tslint:disable-next-line:max-line-length
                const unitPriceSpec = <cinerinoapi.factory.chevre.priceSpecification.IPriceSpecification<cinerinoapi.factory.chevre.priceSpecificationType.UnitPriceSpecification>>
                    o.priceSpecification.priceComponent.find(
                        (p) => p.typeOf === cinerinoapi.factory.chevre.priceSpecificationType.UnitPriceSpecification
                    );

                return {
                    ...o,
                    priceSpecification: unitPriceSpec
                };
            });

        const tourNumber = event.additionalProperty?.find((p) => p.name === 'tourNumber')?.value;

        // パフォーマンス登録
        const performance: factory.performance.IPerformance = {
            id: event.id,
            doorTime: moment(event.doorTime)
                .toDate(),
            startDate: moment(event.startDate)
                .toDate(),
            endDate: moment(event.endDate)
                .toDate(),
            duration: <string>event.superEvent.duration,
            superEvent: event.superEvent,
            location: {
                id: event.location.branchCode,
                branchCode: event.location.branchCode,
                name: <any>event.location.name
            },
            additionalProperty: event.additionalProperty,
            ttts_extension: {
                tour_number: (typeof tourNumber === 'string') ? tourNumber : '',
                ev_service_status: factory.performance.EvServiceStatus.Normal,
                ev_service_update_user: '',
                online_sales_status: factory.performance.OnlineSalesStatus.Normal,
                online_sales_update_user: '',
                refund_status: factory.performance.RefundStatus.None,
                refund_update_user: '',
                refunded_count: 0
            },
            ticket_type_group: {
                id: <string>event.hasOfferCatalog?.id,
                ticket_types: unitPriceOffers,
                name: { ja: 'トップデッキツアー料金改定', en: 'Top Deck Tour' }
            }
        };

        await repos.performance.saveIfNotExists(performance);

        // 集計タスク作成
        const aggregateTask: factory.task.aggregateEventReservations.IAttributes = {
            name: <any>factory.taskName.AggregateEventReservations,
            project: { typeOf: cinerinoapi.factory.organizationType.Project, id: event.project.id },
            status: factory.taskStatus.Ready,
            runsAt: new Date(),
            remainingNumberOfTries: 3,
            numberOfTried: 0,
            executionResults: [],
            data: { id: performance.id }
        };
        await repos.task.save(<any>aggregateTask);
    };
}

/**
 * 検索する
 */
export function search(searchConditions: factory.performance.ISearchConditions): ISearchOperation<ISearchResult> {
    return async (repos: {
        performance: PerformanceRepo;
    }) => {
        const performances = await repos.performance.search(searchConditions);

        return performances.map(performance2result);
    };
}

function performance2result(
    performance: factory.performance.IPerformance & factory.performance.IPerformanceWithAggregation
): factory.performance.IPerformanceWithAvailability {
    const ticketTypes = (performance.ticket_type_group !== undefined) ? performance.ticket_type_group.ticket_types : [];
    const tourNumber = performance.additionalProperty?.find((p) => p.name === 'tourNumber')?.value;
    const attributes: any = {
        day: moment(performance.startDate)
            .tz('Asia/Tokyo')
            .format('YYYYMMDD'),
        open_time: moment(performance.doorTime)
            .tz('Asia/Tokyo')
            .format('HHmm'),
        start_time: moment(performance.startDate)
            .tz('Asia/Tokyo')
            .format('HHmm'),
        end_time: moment(performance.endDate)
            .tz('Asia/Tokyo')
            .format('HHmm'),
        seat_status: (typeof performance.remainingAttendeeCapacity === 'number')
            ? performance.remainingAttendeeCapacity
            : undefined,
        tour_number: tourNumber,
        wheelchair_available: (typeof performance.remainingAttendeeCapacityForWheelchair === 'number')
            ? performance.remainingAttendeeCapacityForWheelchair
            : undefined,
        ticket_types: ticketTypes.map((ticketType) => {
            const offerAggregation = (Array.isArray(performance.offers))
                ? performance.offers.find((o) => o.id === ticketType.id)
                : undefined;

            const unitPriceSpec = ticketType.priceSpecification;

            return {
                name: ticketType.name,
                id: ticketType.identifier, // POSに受け渡すのは券種IDでなく券種コードなので要注意
                // POSに対するAPI互換性維持のため、charge属性追加
                charge: (unitPriceSpec !== undefined) ? unitPriceSpec.price : undefined,
                available_num: (offerAggregation !== undefined) ? offerAggregation.remainingAttendeeCapacity : undefined
            };
        }),
        online_sales_status: (performance.ttts_extension !== undefined)
            ? performance.ttts_extension.online_sales_status : factory.performance.OnlineSalesStatus.Normal,
        refunded_count: (performance.ttts_extension !== undefined)
            ? performance.ttts_extension.refunded_count : undefined,
        refund_status: (performance.ttts_extension !== undefined)
            ? performance.ttts_extension.refund_status : undefined,
        ev_service_status: (performance.ttts_extension !== undefined)
            ? performance.ttts_extension.ev_service_status : undefined
    };

    return {
        ...performance,
        evServiceStatus: (performance.ttts_extension !== undefined)
            ? performance.ttts_extension.ev_service_status
            : factory.performance.EvServiceStatus.Normal,
        onlineSalesStatus: (performance.ttts_extension !== undefined)
            ? performance.ttts_extension.online_sales_status
            : factory.performance.OnlineSalesStatus.Normal,
        extension: performance.ttts_extension,
        ...{
            attributes: attributes, // attributes属性は、POSに対するAPI互換性維持のため
            tourNumber: tourNumber
        }
    };
}

/**
 * 注文返品時の情報連携
 */
export function onOrderReturned(params: cinerinoapi.factory.order.IOrder) {
    return async (repos: {
        performance: PerformanceRepo;
    }) => {
        const order = params;
        const event = (<cinerinoapi.factory.order.IReservation>order.acceptedOffers[0].itemOffered).reservationFor;

        // 販売者都合の手数料なし返品であれば、情報連携
        let cancellationFee = 0;
        if (order.returner !== undefined && order.returner !== null) {
            const returner = order.returner;
            if (Array.isArray(returner.identifier)) {
                const cancellationFeeProperty = returner.identifier.find((p: any) => p.name === 'cancellationFee');
                if (cancellationFeeProperty !== undefined) {
                    cancellationFee = Number(cancellationFeeProperty.value);
                }
            }
        }

        let reason: string = cinerinoapi.factory.transaction.returnOrder.Reason.Customer;
        if (order.returner !== undefined && order.returner !== null) {
            const returner = order.returner;
            if (Array.isArray(returner.identifier)) {
                const reasonProperty = returner.identifier.find((p: any) => p.name === 'reason');
                if (reasonProperty !== undefined) {
                    reason = reasonProperty.value;
                }
            }
        }

        if (reason === cinerinoapi.factory.transaction.returnOrder.Reason.Seller && cancellationFee === 0) {
            // パフォーマンスに返品済数を連携
            await repos.performance.updateOne(
                { _id: event.id },
                {
                    $inc: {
                        'ttts_extension.refunded_count': 1,
                        'ttts_extension.unrefunded_count': -1
                    },
                    'ttts_extension.refund_update_at': new Date()
                }
            );

            // すべて返金完了したら、返金ステータス変更
            await repos.performance.updateOne(
                {
                    _id: event.id,
                    'ttts_extension.unrefunded_count': 0
                },
                {
                    'ttts_extension.refund_status': factory.performance.RefundStatus.Compeleted,
                    'ttts_extension.refund_update_at': new Date()
                }
            );
        }
    };
}
