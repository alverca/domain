
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
            dateRecorded: {
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

        if (typeof report.checkinDate === 'string' && report.checkinDate.length > 0) {
            if (report.reservation.reservedTicket === undefined
                || report.reservation.reservedTicket === null
                || report.reservation.reservedTicket.dateUsed === undefined
                || report.reservation.reservedTicket.dateUsed === null) {
                const dateUsed = moment(`${report.checkinDate}+09:00`, 'YYYY/MM/DD HH:mm:ssZ')
                    .toDate();
                const update = {
                    'reservation.reservedTicket.dateUsed': dateUsed
                };
                console.log('updating...', report.dateRecorded, update);
                updateCount += 1;

                await reportRepo.aggregateSaleModel.findByIdAndUpdate(
                    report.id,
                    update
                )
                    .exec();
                console.log('updated', report.dateRecorded, i);
            } else {
                console.log('already migrated', report.dateRecorded);
            }
        } else {
            console.log('not attended', report.dateRecorded);
        }
    });

    console.log(i, 'reports checked');
    console.log(updateCount, 'reports updated');
}

main()
    .then()
    .catch(console.error);
