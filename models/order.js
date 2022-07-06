const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orderSchema = new Schema({
    totalAmount: { type: Number, required: true },
    productsOrdered: { type: Array, required: true },
    customerName: { type: String, required: true },
    customerPhoneNumber: { type: Number, required: true },
    customerAddress: { type: String, required: true },
    customerLocation: { type: Object, required: true },
    delivered: { type: Boolean, required: true },
}, { timestamps: true })

module.exports = mongoose.model('Order', orderSchema);