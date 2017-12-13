/**
 * 座席予約承認アクションファクトリー
 * @namespace action.authorize.seatReservation
 */

import { ActionStatusType, ActionType, IParticipant } from '../../action';
import { IExtendId } from '../../autoGenerated';
import ItemAvailability from '../../itemAvailability';
import IMultilingualString from '../../multilingualString';
import { IOffer as ISeatReservationOffer } from '../../offer/seatReservation';
import { IExtension as IExtensionPerformance, IPerformanceWithDetails } from '../../performance';
import { IExtensionReservation, IExtensionTicketType, ITicketCancelCharge } from '../../reservation/event';
import ReservationStatusType from '../../reservationStatusType';
import * as AuthorizeActionFactory from '../authorize';

export type IAgent = IParticipant;
export type IRecipient = IParticipant;

export interface ITmpReservation {
    /**
     * 在庫ID
     */
    stock: string;
    /**
     * 仮予約の在庫ステータス
     */
    stock_availability_before: ItemAvailability;
    /**
     * 完了後の予約ステータス
     */
    status_after: ReservationStatusType;
    seat_code: string;
    seat_grade_name: { en: string; ja: string; };
    seat_grade_additional_charge: number;
    ticket_type: string;
    ticket_type_name: IMultilingualString;
    ticket_type_charge: number;
    charge: number;
    watcher_name: string;
    ticket_cancel_charge: ITicketCancelCharge[];
    ticket_ttts_extension: IExtensionTicketType;
    performance_ttts_extension: IExtensionPerformance;
    reservation_ttts_extension: IExtensionReservation;
    payment_no: string;
    purchaser_group: string;
}

/**
 * authorize action result interface
 * 認可アクション結果
 * @export
 * @interface
 * @memberof action.authorize.seatReservation
 */
export interface IResult {
    price: number;
    /**
     * 仮予約リスト
     */
    tmpReservations: ITmpReservation[];
}

/**
 * authorize action object
 * 認可アクション対象
 * @export
 * @interface
 * @memberof action.authorize.seatReservation
 */
export interface IObject {
    transactionId: string;
    performance: IPerformanceWithDetails;
    offers: ISeatReservationOffer[];
}

/**
 * authorize action error interface
 * @export
 * @interface
 * @memberof action.authorize.seatReservation
 */
export type IError = any;

/**
 * seat reservation authorize action interface
 * 座席予約認可アクションインターフェース
 * @export
 * @interface
 * @memberof action.authorize.seatReservation
 */
export interface IAttributes extends AuthorizeActionFactory.IAttributes {
    result?: IResult;
    object: IObject;
}

export type IAction = IExtendId<IAttributes>;

/**
 * create seatReservation authorize action object
 * @export
 * @function
 * @memberof action.authorize.seatReservation
 */
export function createAttributes(params: {
    agent: IAgent;
    recipient: IRecipient;
    actionStatus: ActionStatusType;
    startDate: Date;
    endDate?: Date;
    object: IObject;
    result?: IResult;
    error?: IError;
}): IAttributes {
    return {
        actionStatus: params.actionStatus,
        typeOf: ActionType.AuthorizeAction,
        purpose: {
            typeOf: AuthorizeActionFactory.AuthorizeActionPurpose.SeatReservation
        },
        object: params.object,
        result: params.result,
        error: params.error,
        agent: params.agent,
        recipient: params.recipient,
        startDate: params.startDate,
        endDate: params.endDate
    };
}
