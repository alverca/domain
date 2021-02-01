
const alverca = require('../lib/index');
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGOLAB_URI);

    const reportRepo = new alverca.repository.Report(mongoose.connection);

    const result = await reportRepo.aggregateSaleModel.updateMany(
        { _id: { $exists: true } },
        {
            $unset: {
                cancellationFee: 1,
                confirmationNumber: 1,
                customer: 1,
                orderDate: 1,
                paymentMethod: 1,
                price: 1,
            }
        },
    )
        .exec();

    console.log(result);
}

main()
    .then()
    .catch(console.error);
