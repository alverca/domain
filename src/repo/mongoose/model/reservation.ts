import * as mongoose from 'mongoose';

import Film from './film';
import Performance from './performance';
import multilingualString from './schemaTypes/multilingualString';
import ticketCancelCharge from './schemaTypes/ticketCancelCharge';
import tttsExtensionPerformance from './schemaTypes/tttsExtensionPerformance';
import tttsExtensionTicketType from './schemaTypes/tttsExtensionTicketType';
import Screen from './screen';
import Theater from './theater';

const safe: any = { j: 1, w: 'majority', wtimeout: 10000 };

/**
 * 予約スキーマ
 */
const schema = new mongoose.Schema(
    {
        _id: String, // qr_strに等しい
        qr_str: {
            type: String,
            required: true
        },
        transaction: {
            type: String,
            required: true
        },
        order_number: {
            type: String,
            required: true
        },
        stocks: [mongoose.SchemaTypes.Mixed],
        performance: {
            type: String,
            ref: Performance.modelName,
            required: true
        },
        seat_code: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true
        },

        performance_day: String,
        performance_open_time: String,
        performance_start_time: String,
        performance_end_time: String,
        performance_start_date: Date,
        performance_end_date: Date,
        performance_door_time: Date,
        performance_canceled: {
            type: Boolean,
            default: false
        },
        performance_ttts_extension: tttsExtensionPerformance,

        theater: {
            type: String,
            ref: Theater.modelName
        },
        theater_name: multilingualString,
        theater_address: multilingualString,

        screen: {
            type: String,
            ref: Screen.modelName
        },
        screen_name: multilingualString,

        film: {
            type: String,
            ref: Film.modelName
        },
        film_name: multilingualString,
        film_is_mx4d: Boolean,
        film_copyright: String,

        purchaser_group: String, // 購入者区分
        purchaser_name: String,
        purchaser_last_name: String,
        purchaser_first_name: String,
        purchaser_email: String,
        purchaser_tel: String,
        purchaser_international_tel: String,
        purchaser_age: String, // 生まれた年代
        purchaser_address: String, // 住所
        purchaser_gender: String, // 性別

        payment_no: String, // 購入番号
        payment_seat_index: Number, // 購入座席インデックス
        purchased_at: Date, // 購入確定日時
        payment_method: String, // 決済方法

        seat_grade_name: multilingualString,
        seat_grade_additional_charge: Number,

        ticket_type: String, // 券種
        ticket_type_name: multilingualString,
        ticket_type_charge: Number,
        ticket_cancel_charge: {
            type: [ticketCancelCharge],
            default: []
        },
        ticket_ttts_extension: tttsExtensionTicketType,
        rate_limit_unit_in_seconds: Number,

        watcher_name: String, // 配布先
        watcher_name_updated_at: Date, // 配布先更新日時 default: Date.now

        charge: Number, // 座席単体の料金

        owner_username: String,
        owner_name: String,
        owner_last_name: String,
        owner_first_name: String,
        owner_email: String,
        owner_group: String,

        checkins: { // 入場履歴
            type: [{
                _id: false,
                when: Date, // いつ
                where: String, // どこで
                why: String, // 何のために
                how: String // どうやって
            }],
            default: []
        },

        gmo_order_id: String, // GMOオーダーID
        transaction_agent: mongoose.SchemaTypes.Mixed
    },
    {
        collection: 'reservations',
        id: true,
        read: 'primaryPreferred',
        safe: safe,
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at'
        },
        toJSON: { getters: true },
        toObject: { getters: true }
    }
);

schema.index(
    { performance_day: 1, status: 1 }
);

// 予約のQR文字列はグローバルユニーク
schema.index(
    {
        qr_str: 1
    },
    {
        unique: true
    }
);

// 予約検索
schema.index(
    {
        performance: 1,
        purchaser_group: 1
    }
);

// 予約検索
schema.index(
    {
        status: 1,
        performance_day: 1,
        performance_start_time: 1,
        payment_no: 1,
        ticket_type: 1
    },
    { name: 'findAndSortReservations' }
);

export default mongoose.model('Reservation', schema)
    .on('index', (error) => {
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore next */
        if (error !== undefined) {
            console.error(error);
        }
    });
