import { Connection, Model } from 'mongoose';

import { modelName } from './mongoose/model/accountingReport';

/**
 * 経理レポートリポジトリ
 */
export class MongoRepository {
    public readonly accountingReportModel: typeof Model;

    constructor(connection: Connection) {
        this.accountingReportModel = connection.model(modelName);
    }
}
