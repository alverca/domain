/**
 * パフォーマンスに対する注文返品タスクファクトリー
 * @namespace task.returnOrder
 */

import { IExtendId } from '../autoGenerated';
import * as TaskFactory from '../task';
import * as TaskExecutionResult from '../taskExecutionResult';
import TaskName from '../taskName';
import TaskStatus from '../taskStatus';

export interface IData {
    /**
     * 返品アクションを起こした主体ID
     */
    agentId: string;
    /**
     * 返品対象のパフォーマンスID
     */
    performanceId: string;
}

export interface IAttributes extends TaskFactory.IAttributes {
    data: IData;
}

export type ITask = IExtendId<IAttributes>;

export function createAttributes(params: {
    status: TaskStatus;
    runsAt: Date;
    remainingNumberOfTries: number;
    lastTriedAt: Date | null;
    numberOfTried: number;
    executionResults: TaskExecutionResult.ITaskExecutionResult[];
    data: IData;
}): IAttributes {
    return TaskFactory.createAttributes({ ...params, ...{ name: TaskName.ReturnOrdersByPerformance } });
}
