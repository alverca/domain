
const alverca = require('../lib/index');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const util = require('util');

async function main() {
    await mongoose.connect(process.env.MONGOLAB_URI);

    const reportRepo = new alverca.repository.Report(mongoose.connection);

    const cursor = await reportRepo.aggregateSaleModel.find(
        {
            // _id: { $eq: '200728001001012200' },
            date_bucket: {
                $gte: moment()
                    .add(-2, 'years')
                    .toDate()
            },
        },
        {
        }
    )
        // .sort({ modifiedTime: 1, })
        .cursor();
    console.log('reports found');

    let i = 0;
    let updateCount = 0;
    await cursor.eachAsync(async (doc) => {
        i += 1;
        const report = doc.toObject();

        if (report.sortBy === undefined
            || report.sortBy === null) {
            let status = '00';
            if (report.reservationStatus === 'CANCELLED') {
                status = '01';
            } else if (report.reservationStatus === 'CANCELLATION_FEE') {
                status = '02';
            }

            const sortBy = util.format(
                '%s:%s:%s:%s',
                `00000000000000000000${moment(report.reservation.reservationFor.startDate)
                    .unix()}`
                    // tslint:disable-next-line:no-magic-numbers
                    .slice(-20),
                `00000000000000000000${report.confirmationNumber}`
                    // tslint:disable-next-line:no-magic-numbers
                    .slice(-20),
                status,
                report.reservation.reservedTicket.ticketedSeat.seatNumber
            );

            const update = {
                sortBy: sortBy
            };
            console.log('updating...', report.date_bucket, sortBy);
            updateCount += 1;

            await reportRepo.aggregateSaleModel.findByIdAndUpdate(
                report.id,
                update
            )
                .exec();
            console.log('updated', report.date_bucket, i);
        } else {
            console.log('already migrated', report.date_bucket);
        }
    });

    console.log(i, 'reports checked');
    console.log(updateCount, 'reports updated');
}

main()
    .then()
    .catch(console.error);
