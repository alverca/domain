import { Connection } from 'mongoose';

import ActionModel from './mongoose/model/action';

/**
 * アクションリポジトリ
 */
export class MongoRepository {
    public readonly actionModel: typeof ActionModel;

    constructor(connection: Connection) {
        this.actionModel = connection.model(ActionModel.modelName);
    }
}
