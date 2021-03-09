// tslint:disable:max-classes-per-file
/**
 * リポジトリ
 */
import { MongoRepository as ActionRepo } from './repo/action';
import { MongoRepository as ReportRepo } from './repo/report';

/**
 * アクションリポジトリ
 */
export class Action extends ActionRepo { }

/**
 * レポートリポジトリ
 */
export class Report extends ReportRepo { }
