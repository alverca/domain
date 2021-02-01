
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

        if (report.category === undefined
            || report.category === null) {
            const update = {
                category: report.reservationStatus
            };
            console.log('updating...', report.date_bucket, update.category);
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
