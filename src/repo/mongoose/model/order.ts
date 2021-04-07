import * as mongoose from 'mongoose';

const modelName = 'Order';

const writeConcern: mongoose.WriteConcern = { j: true, w: 'majority', wtimeout: 10000 };

/**
 * 注文スキーマ
 */
const schema = new mongoose.Schema(
    {
        orderDate: Date,
        dateReturned: Date
    },
    {
        collection: 'orders',
        id: true,
        read: 'primaryPreferred',
        writeConcern: writeConcern,
        strict: false,
        useNestedStrict: true,
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt'
        },
        toJSON: {
            getters: false,
            virtuals: false,
            minimize: false,
            versionKey: false
        },
        toObject: {
            getters: false,
            virtuals: true,
            minimize: false,
            versionKey: false
        }
    }
);

schema.index(
    { orderDate: -1 },
    {
        name: 'searchByOrderDate'
    }
);

schema.index(
    { orderNumber: 1 },
    {
        unique: true,
        name: 'uniqueOrderNumber'
    }
);

schema.index(
    { 'project.id': 1, orderDate: -1 },
    {
        name: 'searchByProjectId'
    }
);

schema.index(
    { 'seller.id': 1, orderDate: -1 },
    {
        name: 'searchBySellerId',
        partialFilterExpression: {
            'seller.id': { $exists: true }
        }
    }
);

schema.index(
    { orderStatus: 1, orderDate: -1 },
    {
        name: 'searchByOrderStatus'
    }
);

schema.index(
    { confirmationNumber: 1, orderDate: -1 },
    {
        name: 'searchByConfirmationNumber',
        partialFilterExpression: {
            confirmationNumber: { $exists: true }
        }
    }
);

schema.index(
    { 'customer.id': 1, orderDate: -1 },
    {
        name: 'searchByCustomerId',
        partialFilterExpression: {
            'customer.id': { $exists: true }
        }
    }
);

schema.index(
    { 'paymentMethods.accountId': 1, orderDate: -1 },
    {
        name: 'searchByPaymentMethodsAccountId',
        partialFilterExpression: {
            'paymentMethods.accountId': { $exists: true }
        }
    }
);

schema.index(
    { 'paymentMethods.typeOf': 1, orderDate: -1 },
    {
        name: 'searchByPaymentMethodTypeOf',
        partialFilterExpression: {
            'paymentMethods.typeOf': { $exists: true }
        }
    }
);

schema.index(
    { 'paymentMethods.paymentMethodId': 1, orderDate: -1 },
    {
        name: 'searchByPaymentMethodId',
        partialFilterExpression: {
            'paymentMethods.paymentMethodId': { $exists: true }
        }
    }
);

schema.index(
    { 'acceptedOffers.itemOffered.reservationFor.startDate': 1, orderDate: -1 },
    {
        name: 'searchByItemOfferedReservationForStartDate',
        partialFilterExpression: {
            'acceptedOffers.itemOffered.reservationFor.startDate': { $exists: true }
        }
    }
);

mongoose.model(modelName, schema)
    .on(
        'index',
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore next */
        (error) => {
            if (error !== undefined) {
                // tslint:disable-next-line:no-console
                console.error(error);
            }
        }
    );

export { modelName, schema };
