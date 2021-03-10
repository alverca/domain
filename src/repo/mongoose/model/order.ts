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
