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

    const reportRepo = new domain.repository.Report(mongoose.connection);

    let result;

    result = await reportRepo.aggregateSaleModel.deleteMany({
        created_at: { $lt: createdThrough }
    })
        .exec();
    console.log('aggregateSales deleted', result);

    // await mongoose.disconnect();
}

main().then(() => {
    console.log('success!');
}).catch((error) => {
    console.error(error);
    process.exit(1);
});
