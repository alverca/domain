import * as mongoose from 'mongoose';

const modelName = 'AccountingReport';

const writeConcern: mongoose.WriteConcern = { j: true, w: 'majority', wtimeout: 10000 };

/**
 * 経理レポートスキーマ
 */
const schema = new mongoose.Schema(
    {
        hasPart: [mongoose.SchemaTypes.Mixed],
        mainEntity: mongoose.SchemaTypes.Mixed,
        project: mongoose.SchemaTypes.Mixed
    },
    {
        collection: 'accountingReports',
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
    { 'mainEntity.orderDate': -1 },
    {
        name: 'searchByOrderDate'
    }
);

schema.index(
    { 'mainEntity.orderNumber': 1 },
    {
        unique: true,
        name: 'uniqueOrderNumber'
    }
);

schema.index(
    { 'project.id': 1, 'mainEntity.orderDate': -1 },
    {
        name: 'searchByProjectId'
    }
);

schema.index(
    { 'mainEntity.seller.id': 1, 'mainEntity.orderDate': -1 },
    {
        name: 'searchBySellerId',
        partialFilterExpression: {
            'mainEntity.seller.id': { $exists: true }
        }
    }
);

schema.index(
    { 'mainEntity.orderStatus': 1, 'mainEntity.orderDate': -1 },
    {
        name: 'searchByOrderStatus'
    }
);

schema.index(
    { 'mainEntity.confirmationNumber': 1, 'mainEntity.orderDate': -1 },
    {
        name: 'searchByConfirmationNumber',
        partialFilterExpression: {
            'mainEntity.confirmationNumber': { $exists: true }
        }
    }
);

schema.index(
    { 'mainEntity.customer.id': 1, 'mainEntity.orderDate': -1 },
    {
        name: 'searchByCustomerId',
        partialFilterExpression: {
            'mainEntity.customer.id': { $exists: true }
        }
    }
);

schema.index(
    { 'mainEntity.paymentMethods.accountId': 1, 'mainEntity.orderDate': -1 },
    {
        name: 'searchByPaymentMethodsAccountId',
        partialFilterExpression: {
            'mainEntity.paymentMethods.accountId': { $exists: true }
        }
    }
);

schema.index(
    { 'mainEntity.paymentMethods.typeOf': 1, 'mainEntity.orderDate': -1 },
    {
        name: 'searchByPaymentMethodTypeOf',
        partialFilterExpression: {
            'mainEntity.paymentMethods.typeOf': { $exists: true }
        }
    }
);

schema.index(
    { 'mainEntity.paymentMethods.paymentMethodId': 1, 'mainEntity.orderDate': -1 },
    {
        name: 'searchByPaymentMethodId',
        partialFilterExpression: {
            'mainEntity.paymentMethods.paymentMethodId': { $exists: true }
        }
    }
);

schema.index(
    { 'mainEntity.acceptedOffers.itemOffered.reservationFor.startDate': 1, 'mainEntity.orderDate': -1 },
    {
        name: 'searchByItemOfferedReservationForStartDate',
        partialFilterExpression: {
            'mainEntity.acceptedOffers.itemOffered.reservationFor.startDate': { $exists: true }
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
