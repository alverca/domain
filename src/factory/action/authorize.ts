/**
 * authorize action factory
 * 承認アクションファクトリー
 * @namespace action.authorize
 */

import * as ActionFactory from '../action';
import { IExtendId } from '../autoGenerated';

export enum AuthorizeActionPurpose {
    CreditCard = 'CreditCard',
    Mvtk = 'Mvtk',
    SeatReservation = 'SeatReservation'
}

export interface IPurpose {
    typeOf: AuthorizeActionPurpose;
}

export interface IAttributes extends ActionFactory.IAttributes {
    purpose: IPurpose;
    agent: ActionFactory.IParticipant;
    recipient: ActionFactory.IParticipant;
    result?: any;
    error?: any;
    object: any;
    startDate: Date;
    endDate?: Date;
}

export type IAction = IExtendId<IAttributes>;