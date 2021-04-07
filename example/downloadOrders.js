
const alverca = require('../lib/index');
const fs = require('fs');
const mongoose = require('mongoose');
const json2csv = require('json2csv');

async function main() {
    await mongoose.connect(process.env.MONGOLAB_URI);

    const orderRepo = new alverca.repository.Order(mongoose.connection);

    const matchStages = [
        {
            $match: {
                'project.id': {
                    $in: ['cinerino']
                }
                // orderNumber: 'TTT3-0207796-8589840'
            }
        }
    ];
    const aggregate = orderRepo.orderModel.aggregate([
        { $unwind: '$actions' },
        { $unwind: '$acceptedOffers' },
        ...matchStages,
        {
            $project: {
                _id: 0,
                typeOf: '$actions.typeOf',
                startDate: '$actions.startDate',
                object: { $arrayElemAt: ['$actions.object', 0] },
                purpose: '$actions.purpose',
                order: {
                    acceptedOffers: '$acceptedOffers',
                    customer: '$customer',
                    orderNumber: '$orderNumber',
                    orderDate: '$orderDate'
                },
                // ...(req.query.$projection?.sectionCount === 1)
                //     ? {
                //         sectionCount: {
                //             $cond: {
                //                 if: { $isArray: '$containsPlace.containsPlace' },
                //                 then: { $size: '$containsPlace.containsPlace' },
                //                 else: 0
                //             }
                //         }
                //     }
                //     : undefined,
            }
        }
    ]);

    let actions = await aggregate.limit(100)
        .skip(0)
        .exec();
    actions = actions.map((a) => {
        let clientId = '';
        if (Array.isArray(a.order.customer.identifier)) {
            const clientIdProperty = a.order.customer.identifier.find((p) => p.name === 'clientId');
            if (clientIdProperty !== undefined) {
                clientId = clientIdProperty.value;
            }
        }

        let itemType = '';
        if (Array.isArray(a.order.acceptedOffers) && a.order.acceptedOffers.length > 0) {
            itemType = a.order.acceptedOffers[0].itemOffered.typeOf;
        } else if (a.order.acceptedOffers !== undefined && typeof a.order.acceptedOffers.typeOf === 'string') {
            itemType = a.order.acceptedOffers.itemOffered.typeOf;
        }
        if (a.typeOf === 'PayAction' && a.purpose.typeOf === 'ReturnAction') {
            itemType = 'ReturnFee'
        }

        return {
            ...a,
            itemType,
            order: {
                ...a.order,
                customer: {
                    ...a.order.customer,
                    // ...(Array.isArray(a.order.customer.additionalProperty))
                    //     ? { additionalProperty: JSON.stringify(a.order.customer.additionalProperty) }
                    //     : undefined,
                    clientId
                },
                numItems: a.order.acceptedOffers.length
            }
        }
    });
    console.log(actions);
    const csv = action2csv(actions);

    fs.writeFileSync(`${__dirname}/output/actions.csv`, csv);
    return;

    const result = await orderRepo.orderModel.find(
        { orderNumber: 'TTT3-0207796-8589840' },
    )
        .exec()
        .then((docs) => docs.map((doc) => doc.toObject()));

    if (result.length > 0) {
        const actions = result[0].actions;
        if (Array.isArray(actions)) {
            console.log(actions.map((action) => {
                let amount = '?';
                if (action.object[0].paymentMethod.totalPaymentDue !== undefined) {
                    amount = action.object[0].paymentMethod.totalPaymentDue.value;
                }

                return `${action.typeOf} ${action.id} ${action.startDate} ${action.object[0].paymentMethod.typeOf} ${action.object[0].paymentMethod.paymentMethodId} ${amount}`;
            }));
        } else {
            console.log('no actions');
        }
    } else {
        console.log('no orders');
    }
}

function action2csv(actions) {
    // let inputStream = repos.order.stream(params.conditions);
    let processor;

    // inputStream = inputStream.map((doc) => {
    //     return JSON.stringify(order2report({
    //         order: doc.toObject()
    //     }));
    // });

    const fields = [
        { label: 'アクションタイプ', default: '', value: 'typeOf' },
        { label: '金額(JPY)', default: '', value: 'object.paymentMethod.totalPaymentDue.value' },
        { label: '決済方法ID', default: '', value: 'object.paymentMethod.paymentMethodId' },
        { label: '決済方法区分コード', default: '', value: 'object.paymentMethod.typeOf' },
        { label: 'アイテムタイプ', default: '', value: 'itemType' },
        { label: '売上計上日時(GMT)', default: '', value: 'startDate' },
        { label: '注文番号', default: '', value: 'order.orderNumber' },
        { label: '注文日時', default: '', value: 'order.orderDate' },
        { label: 'アイテム数', default: '', value: 'order.numItems' },
        { label: 'クライアント', default: '', value: 'order.customer.clientId' },
        { label: 'カスタマー識別子', default: '', value: 'order.customer.identifier' },
    ];

    const opts = {
        fields: fields,
        delimiter: ',',
        eol: '\n',
        // flatten: true,
        // preserveNewLinesInValues: true,
        // unwind: 'acceptedOffers'
    };

    let csv = '';
    try {
        const parser = new json2csv.Parser(opts);
        csv = parser.parse(actions);
        console.log(csv);
    } catch (err) {
        console.error(err);
    }

    return csv;
}

main()
    .then()
    .catch(console.error);
