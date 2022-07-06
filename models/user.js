const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: Number, required: true },
    password: { type: String, required: true },
    cart: { type: Array },
    orders: { type: Array },
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema);