import { Connection, Model } from 'mongoose';

import { modelName } from './mongoose/model/order';

/**
 * 注文リポジトリ
 */
export class MongoRepository {
    public readonly orderModel: typeof Model;

    constructor(connection: Connection) {
        this.orderModel = connection.model(modelName);
    }
}
