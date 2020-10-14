const moment = require('moment');
const mongoose = require('mongoose');
const domain = require('../');

async function main() {
    await mongoose.connect(process.env.MONGOLAB_URI);

    const now = new Date();
    const createdThrough = moment(now)
        .add(-15, 'months')
        .toDate();

    console.log('deleting...createdThrough:', createdThrough);

    const aggregateSaleRepo = new domain.repository.AggregateSale(mongoose.connection);
    const performanceRepo = new domain.repository.Performance(mongoose.connection);
    const reservationRepo = new domain.repository.Reservation(mongoose.connection);

    let result;

    result = await aggregateSaleRepo.aggregateSaleModel.deleteMany({
        created_at: { $lt: createdThrough }
    })
        .exec();
    console.log('aggregateSales deleted', result);

    result = await performanceRepo.performanceModel.deleteMany({
        created_at: { $lt: createdThrough }
    })
        .exec();
    console.log('performances deleted', result);

    result = await reservationRepo.reservationModel.deleteMany({
        created_at: { $lt: createdThrough }
    })
        .exec();
    console.log('reservations deleted', result);

    // await mongoose.disconnect();
}

main().then(() => {
    console.log('success!');
}).catch((error) => {
    console.error(error);
    process.exit(1);
});
