import * as mongoose from 'mongoose';

const safe: any = { j: 1, w: 'majority', wtimeout: 10000 };

/**
 * 売上レポートスキーマ
 */
const schema = new mongoose.Schema(
    {
        project: mongoose.SchemaTypes.Mixed,
        reservation: mongoose.SchemaTypes.Mixed,
        category: String,
        /**
         * 購入座席インデックス
         * @deprecated
         */
        payment_seat_index: Number, // 購入座席インデックス
        sortBy: String,
        mainEntity: mongoose.SchemaTypes.Mixed,
        amount: Number,
        dateRecorded: Date
        // checkedin: String,
        // checkinDate: String,
        // confirmationNumber: String,
        // customer: mongoose.SchemaTypes.Mixed,
        // orderDate: Date,
        // paymentMethod: String,
        // price: String
    },
    {
        collection: 'aggregateSales',
        id: true,
        read: 'primaryPreferred',
        safe: safe,
        strict: true,
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
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
    { sortBy: 1 },
    { name: 'searchBySortBy' }
);

schema.index(
    { category: 1, sortBy: 1 },
    { name: 'searchByCategory' }
);

schema.index(
    { dateRecorded: 1, sortBy: 1 },
    { name: 'searchByDateRecorded' }
);

schema.index(
    { 'mainEntity.customer.group': 1, sortBy: 1 },
    {
        name: 'searchByMainEntityCustomerGroup',
        partialFilterExpression: {
            'mainEntity.customer.group': { $exists: true }
        }
    }
);

schema.index(
    { 'mainEntity.confirmationNumber': 1, sortBy: 1 },
    {
        name: 'searchByMainEntityConfirmationNumber',
        partialFilterExpression: {
            'mainEntity.confirmationNumber': { $exists: true }
        }
    }
);

schema.index(
    { 'mainEntity.orderNumber': 1, sortBy: 1 },
    {
        name: 'searchByMainEntityOrderNumber',
        partialFilterExpression: {
            'mainEntity.orderNumber': { $exists: true }
        }
    }
);

schema.index(
    { 'reservation.id': 1, sortBy: 1 },
    {
        name: 'searchByReservationId-v2',
        partialFilterExpression: {
            'reservation.id': { $exists: true }
        }
    }
);

schema.index(
    { 'reservation.reservationFor.id': 1, sortBy: 1 },
    {
        name: 'searchByReservationReservationForId',
        partialFilterExpression: {
            'reservation.reservationFor.id': { $exists: true }
        }
    }
);

schema.index(
    { 'reservation.reservationFor.startDate': 1, sortBy: 1 },
    {
        name: 'searchByReservationReservationForStartDate',
        partialFilterExpression: {
            'reservation.reservationFor.startDate': { $exists: true }
        }
    }
);

schema.index(
    { 'project.id': 1, sortBy: 1 },
    {
        name: 'searchByProjectId-v2',
        partialFilterExpression: {
            'project.id': { $exists: true }
        }
    }
);

export default mongoose.model('AggregateSale', schema)
    .on('index', (error) => {
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore next */
        if (error !== undefined) {
            // tslint:disable-next-line:no-console
            console.error(error);
        }
    });
