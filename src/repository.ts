// tslint:disable:max-classes-per-file
/**
 * リポジトリ
 */
import { MongoRepository as ActionRepo } from './repo/action';
import { MongoRepository as OrderRepo } from './repo/order';
import { MongoRepository as ReportRepo } from './repo/report';

/**
 * アクションリポジトリ
 */
export class Action extends ActionRepo { }

/**
 * 注文リポジトリ
 */
export class Order extends OrderRepo { }

/**
 * レポートリポジトリ
 */
export class Report extends ReportRepo { }
