import * as factory from '@tokyotower/factory';

import { IConnectionSettings, IOperation } from '../task';

import { MongoRepository as ProjectRepo } from '../../repo/project';
import { MongoRepository as ReservationRepo } from '../../repo/reservation';
import { MongoRepository as TaskRepo } from '../../repo/task';
import { MongoRepository as TransactionRepo } from '../../repo/transaction';

import * as StockService from '../stock';

/**
 * タスク実行関数
 */
export function call(data: factory.task.settleSeatReservation.IData): IOperation<void> {
    return async (settings: IConnectionSettings) => {
        await StockService.transferSeatReservation(data.transactionId)(
            new TransactionRepo(settings.connection),
            new ReservationRepo(settings.connection),
            new TaskRepo(settings.connection),
            new ProjectRepo(settings.connection)
        );
    };
}