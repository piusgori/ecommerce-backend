const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    isDiscount: { type: Boolean, required: true },
    isFinished: { type: Boolean, required: true },
    newPrice: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);