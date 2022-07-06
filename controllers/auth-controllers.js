const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const sendgrid = require('nodemailer-sendgrid-transport');
const nodemailer = require('nodemailer');
// const keys = require('../private/keys');
const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const Admin = require('../models/admin');
const Order = require('../models/order');

const transporter = nodemailer.createTransport(sendgrid({ auth: { api_key: process.env.sendgridKey } }));

exports.getUsers = async (req, res, next) => {
    const users = [];
    try {
        const foundUsers = await User.find();
        for(const k of foundUsers){
            users.push({ id: k._id, name: k.name, email: k.email, phoneNumber: k.phoneNumber, joinedAt: k.createdAt.toISOString() });
        }
    } catch (err) {
        return next(new HttpError('Unable to fetch the users', null, 500));
    }
    res.status(200).json({ message: 'Users found successfully', users });
}

exports.signup = async (req, res, next) => {
    const { name, email, password, phoneNumber } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for(const k of errorArray){
            const each = { message: k.msg, type: k.param }
            messageArray.push(each);
        }
        return next(new HttpError('Unable to Process', messageArray, 422));
    }

    try {
        const foundUser = await User.find({ email: email });
        if(foundUser.length > 0){
            const message = 'A user with the E-Mail address you have provided already exists. Please try using another one.';
            const type = 'email';
            return next(new HttpError('Unable to process email', [{ message, type }], 422))
        }
    } catch (err) {
        return next(new HttpError('Could not find users an unexpected error occurred', null, 500));
    }

    let hashedPassword;

    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        return next(new HttpError('An error occurred encrypting the password', null, 500));
    }

    const formattedNumber = () => {
        const number = Number(phoneNumber);
        const newNumber = Number('254' + number);
        return newNumber;
    }

    const newUser = new User({ name, email, password: hashedPassword, phoneNumber: formattedNumber(), cart: [], orders: [], });
    
    try {
        await newUser.save();
    } catch (err) {
        return next(new HttpError('An error occurred while saving the user',  null, 500));
    }

    let token;

    try {
        token = jwt.sign({ id: newUser._id, email: newUser.email, isAdmin: false }, 'shop_secret', { expiresIn: '1h' });
    } catch (err) {
        return next(new HttpError('An error occurred while creating a token', null, 500));
    }

    res.status(201).json({ message: 'Signed up successfully', id: newUser._id, email: newUser.email, phoneNumber: newUser.phoneNumber, token, name: newUser.name, cart: newUser.cart, orders: newUser.orders });
}

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for(const k of errorArray){
            const each = { message: k.msg, type: k.param }
            messageArray.push(each);
        }
        return next(new HttpError('Unable to Process', messageArray, 422));
    }
    let existingUser;
    try {
        existingUser = await User.findOne({ email });
        if(!existingUser){
            const message = 'We have not found this E-Mail address. Perhaps create an account with us.';
            const type = 'email';
            return next(new HttpError('Unable to process email', [{ message, type }], 403));
        }
    } catch (err) {
        return next(new HttpError('An error occurred while looking for a user', null, 500));
    }
    
    try {
        const passwordIsValid = await bcrypt.compare(password, existingUser.password);
        if(!passwordIsValid){
            const message = 'You have entered the wrong password. Please try again!';
            const type = 'password';
            return next(new HttpError('Unable to process password', [{ message, type }], 403));
        }
    } catch (err) {
        return next(new HttpError('An error occurred while validating the password', null, 500));
    }

    let userOrders;

    try {
        userOrders = await Order.find({ customerPhoneNumber: existingUser.phoneNumber});
    } catch (err) {
        return next(new HttpError("Error while looking for user's orders", null, 500));
    }

    let token;

    try {
        token = jwt.sign({ id: existingUser._id, email: existingUser.email, isAdmin: false }, 'shop_secret', { expiresIn: '1h' });
    } catch (err) {
        return next(new HttpError('An error occurred while creating a token', null, 500));
    }
    res.status(200).json({ message: 'Logged in successfully', id: existingUser._id, email: existingUser.email, phoneNumber: existingUser.phoneNumber, token, name: existingUser.name, cart: existingUser.cart, orders: userOrders });
}

exports.passwordReset = async (req, res, next) => {
    const { email } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for(const k of errorArray){
            const each = { message: k.msg, type: k.param }
            messageArray.push(each);
        }
        return next(new HttpError('Unable to Process', messageArray, 422));
    }
    let existingUser;
    try {
        existingUser = await User.findOne({ email });
        if(!existingUser){
            const message = 'We have not found this E-Mail address.';
            const type = 'email';
            return next(new HttpError('Unable to process email', [{ message, type }], 403));
        }
    } catch (err) {
        return next(new HttpError('An error occurred while looking for a user', null, 500));
    }

    const generateNewNumber = () => {
        let resetNumber = Math.round(Math.random() * 1000000);
        if(resetNumber.toString().length < 6){
            for(i = 1; i <= 6 - resetNumber.toString().length; i++){
                resetNumber = resetNumber.toString() + Math.round(Math.random() * 1).toString();
            }
        }
        return Number(resetNumber);
    }

    const theGeneratedNumber = generateNewNumber();

    let passwordResetToken;
    try {
        passwordResetToken = jwt.sign({ id: existingUser._id, email: existingUser.email, isAdmin: false, passwordResetDigit: theGeneratedNumber }, 'shop_secret', { expiresIn: '1h' });
    } catch (err) {
        return next(new HttpError('Unable to generate password reset token', null, 500));
    }

    transporter.sendMail({
        to: existingUser.email,
        from: 'dreefstar@gmail.com',
        subject: 'Reset Password',
        html: `<h1>Here's your code</h1>
        <p>Please use this code ${theGeneratedNumber} to create a new password</p>
        `
    });

    res.status(200).json({ message: 'E-Mail sent successfully', token: `Bearer ${passwordResetToken}` });
}

exports.createNewPassword = async (req, res, next) => {
    const { code } = req.body;
    const token = req.headers.authorization.split(' ')[1];
    let email;
    try {
        if(!token){
            const message = 'Your token has expired';
            const type = 'code'
            return next(new HttpError('Token error', [{ message, type }], 403));
        }
        const decodedToken = jwt.verify(token, 'shop_secret');
        email = decodedToken.email;
        if(code != decodedToken.passwordResetDigit){
            const message = 'You have entered the wrong reset code. Please check your E-Mail for the correct one';
            const type = 'code'
            return next(new HttpError('Error validating code', [{ message, type }], 403))
        }
    } catch (err) {
        return next(new HttpError('Error validating token', null, 500));
    }

    res.status(200).json({ message: 'Code validated and is valid', code, email });
}

exports.setPassword = async (req, res, next) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for(const k of errorArray){
            const each = { message: k.msg, type: k.param }
            messageArray.push(each);
        }
        return next(new HttpError('Unable to Process', messageArray, 422));
    }
    let existingUser;
    try {
        existingUser = await User.findOne({ email });
        if(!existingUser){
            const message = 'We have not found this E-Mail address. Perhaps create an account with us.';
            const type = 'email';
            return next(new HttpError('Unable to process email', [{ message, type }], 403));
        }
    } catch (err) {
        return next(new HttpError('An error occurred while looking for a user', null, 500));
    }

    let hashedPassword;

    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        return next(new HttpError('An error occurred encrypting the password', null, 500));
    }

    existingUser.password = hashedPassword;

    try {
        await existingUser.save();
    } catch (err) {
        return next(new HttpError('Unable to save the user who has updated his/her password', null, 500));
    }
    res.status(200).json({ message: 'Password updated successfully' });
}

exports.adminSignup = async (req, res, next) => {
    const { name, email, password, phoneNumber } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for(const k of errorArray){
            const each = { message: k.msg, type: k.param }
            messageArray.push(each);
        }
        return next(new HttpError('Unable to Process', messageArray, 422));
    }

    try {
        const foundAdmin = await Admin.find({ email: email });
        if(foundAdmin.length > 0){
            const message = 'An administrator with the E-Mail address you have provided already exists. Please try using another one.';
            const type = 'email';
            return next(new HttpError('Unable to process email', [{ message, type }], 422))
        }
    } catch (err) {
        return next(new HttpError('Could not find users an unexpected error occurred', null, 500));
    }

    let hashedPassword;

    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        return next(new HttpError('An error occurred encrypting the password', null, 500));
    }

    const formattedNumber = () => {
        const number = Number(phoneNumber);
        const newNumber = Number('254' + number);
        return newNumber;
    }

    const newAdmin = new Admin({ name, email, password: hashedPassword, phoneNumber: formattedNumber() });
    
    try {
        await newAdmin.save();
    } catch (err) {
        return next(new HttpError('An error occurred while saving the admin',  null, 500));
    }

    let token;

    try {
        token = jwt.sign({ id: newAdmin._id, email: newAdmin.email, isAdmin: true }, 'shop_secret');
    } catch (err) {
        return next(new HttpError('An error occurred while creating a token', null, 500));
    }

    res.status(201).json({ message: 'Signed up successfully', id: newAdmin._id, email: newAdmin.email, phoneNumber: newAdmin.phoneNumber, token, name: newAdmin.name });
}

exports.adminLogin = async (req, res, next) => {
    const { email, password } = req.body;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        const errorArray = errors.array();
        const messageArray = [];
        for(const k of errorArray){
            const each = { message: k.msg, type: k.param }
            messageArray.push(each);
        }
        return next(new HttpError('Unable to Process', messageArray, 422));
    }
    let existingAdmin;
    try {
        existingAdmin = await Admin.findOne({ email });
        if(!existingAdmin){
            const message = 'We have not found this E-Mail address. Perhaps create an account.';
            const type = 'email';
            return next(new HttpError('Unable to process email', [{ message, type }], 403));
        }
    } catch (err) {
        return next(new HttpError('An error occurred while looking for a user', null, 500));
    }
    
    try {
        const passwordIsValid = await bcrypt.compare(password, existingAdmin.password);
        if(!passwordIsValid){
            const message = 'You have entered the wrong password. Please try again!';
            const type = 'password';
            return next(new HttpError('Unable to process password', [{ message, type }], 403));
        }
    } catch (err) {
        return next(new HttpError('An error occurred while validating the password', null, 500));
    }

    let token;

    try {
        token = jwt.sign({ id: existingAdmin._id, email: existingAdmin.email, isAdmin: true }, 'shop_secret');
    } catch (err) {
        return next(new HttpError('An error occurred while creating a token', null, 500));
    }
    res.status(200).json({ message: 'Logged in successfully', id: existingAdmin._id, email: existingAdmin.email, phoneNumber: existingAdmin.phoneNumber, token, name: existingAdmin.name });
}