/**
 * index module
 */
import * as OrderReportService from './service/report/order';

import * as factory from '@alverca/factory';

import * as repository from './repository';

export namespace service {
    export namespace report {
        export import order = OrderReportService;
    }
}

export import factory = factory;
export import repository = repository;
