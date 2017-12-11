import * as mongoose from 'mongoose';

import ReservationModel from './reservation';

const safe: any = { j: 1, w: 'majority', wtimeout: 10000 };

const objectSchema = new mongoose.Schema(
    {},
    {
        id: false,
        _id: false,
        strict: false
    }
);

const resultSchema = new mongoose.Schema(
    {
        eventReservations: [ReservationModel.schema]
    },
    {
        id: false,
        _id: false,
        strict: false
    }
);

const agentSchema = new mongoose.Schema(
    {},
    {
        id: false,
        _id: false,
        strict: false
    }
);

const sellerSchema = new mongoose.Schema(
    {},
    {
        id: false,
        _id: false,
        strict: false
    }
);

const errorSchema = new mongoose.Schema(
    {},
    {
        id: false,
        _id: false,
        strict: false
    }
);

/**
 * 取引スキーマ
 * @ignore
 */
const schema = new mongoose.Schema(
    {
        status: String,
        typeOf: String,
        agent: agentSchema,
        seller: sellerSchema,
        error: errorSchema,
        result: resultSchema,
        object: objectSchema,
        expires: Date,
        startDate: Date,
        endDate: Date,
        tasksExportedAt: Date,
        tasksExportationStatus: String
    },
    {
        collection: 'transactions',
        id: true,
        read: 'primaryPreferred',
        safe: safe,
        strict: true,
        useNestedStrict: true,
        timestamps: {
            createdAt: 'createdAt',
            updatedAt: 'updatedAt'
        },
        toJSON: { getters: true },
        toObject: { getters: true }
    }
);

// タスクエクスポート時の検索で使用
schema.index(
    { tasksExportationStatus: 1, status: 1 }
);

// 取引期限切れ確認等に使用
schema.index(
    { status: 1, expires: 1 }
);

// 実行中タスクエクスポート監視に使用
schema.index(
    { tasksExportationStatus: 1, updatedAt: 1 }
);

// 取引進行中は、基本的にIDとステータスで参照する
schema.index(
    { status: 1, typeOf: 1, _id: 1 }
);

// 許可証でユニークに
schema.index(
    {
        'object.passportToken': 1
    },
    {
        unique: true,
        partialFilterExpression: {
            'object.passportToken': { $exists: true }
        }
    }
);

// 購入番号から照会の際に使用
schema.index(
    {
        'result.order.orderInquiryKey.confirmationNumber': 1,
        'result.order.orderInquiryKey.theaterCode': 1,
        'result.order.orderInquiryKey.telephone': 1,
        status: 1
    },
    {
        name: 'orderInquiryKey',
        partialFilterExpression: {
            'result.order.orderInquiryKey.confirmationNumber': { $exists: true },
            'result.order.orderInquiryKey.theaterCode': { $exists: true },
            'result.order.orderInquiryKey.telephone': { $exists: true }
        }
    }
);

// LINEアシスタントでの取引照会に使用
schema.index(
    {
        'result.order.orderInquiryKey.theaterCode': 1,
        'result.order.orderInquiryKey.confirmationNumber': 1
    },
    {
        partialFilterExpression: {
            'result.order.orderInquiryKey.theaterCode': { $exists: true },
            'result.order.orderInquiryKey.confirmationNumber': { $exists: true }
        }
    }
);

// 結果の注文番号はユニークなはず
schema.index(
    {
        'result.order.orderNumber': 1
    },
    {
        unique: true,
        partialFilterExpression: {
            'result.order.orderNumber': { $exists: true }
        }
    }
);

schema.index(
    {
        typeOf: 1,
        'result.order.orderNumber': 1
    },
    {
        partialFilterExpression: {
            'result.order.orderNumber': { $exists: true }
        }
    }
);

// レポート作成時に使用
schema.index({ startDate: 1 });
schema.index({ endDate: 1 });
schema.index(
    { 'seller.id': 1, startDate: 1, endDate: 1 },
    {
        partialFilterExpression: {
            'seller.id': { $exists: true },
            endDate: { $exists: true }
        }
    }
);
schema.index(
    { status: 1, 'seller.id': 1, startDate: 1 }
);
schema.index(
    { status: 1, 'seller.id': 1, endDate: 1 },
    {
        partialFilterExpression: {
            'seller.id': { $exists: true },
            endDate: { $exists: true }
        }
    }
);

// 取引タイプ指定で取得する場合に使用
schema.index(
    {
        typeOf: 1,
        _id: 1
    }
);

export default mongoose.model('Transaction', schema)
    .on('index', (error) => {
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore next */
        if (error !== undefined) {
            console.error(error);
        }
    });