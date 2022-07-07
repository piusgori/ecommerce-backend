const { validationResult } = require('express-validator');
const Product = require('../models/product');
const User = require('../models/user');
const HttpError = require('../models/http-error');
const request = require('request');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const Order = require('../models/order');
const Category = require('../models/category');

exports.getProducts = async (req, res, next) => {
    const products = [];
    try {
        const foundProducts = await Product.find();
        for(const i of foundProducts){
            products.push({ id: i._id, title: i.title, price: i.price, isDiscount: i.isDiscount, isFinished: i.isFinished, newPrice: i.newPrice, category: i.category, image: i.image, createdAt: i.createdAt.toISOString() });
        }
    } catch (err) {
        return next(new HttpError('Could not get all the products', null, 500));
    }
    res.json({ message: 'Products found successfully', products });
}

exports.createProduct = async (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    let decodedId;
    try {
        if(!token){
            const message = 'Your token has expired';
            const type = 'code'
            return next(new HttpError('Token error', [{ message, type }], 403));
        }
        const decodedToken = jwt.verify(token, 'shop_secret');
        decodedId = decodedToken.id;
        
    } catch (err) {
        return next(new HttpError('Error validating token', null, 500));
    }

    let foundAdmin;

    try {
        foundAdmin = await Admin.findById(decodedId);
        if(!foundAdmin){
            const message = 'You are not allowed to create a new product.';
            const type = 'code';
            return next(new HttpError('Token error', [{ message, type }], 403));
        }

    } catch (err) {
        return next(new HttpError('Error validating the token', null, 500));
    }

    const { title, price, category } = req.body;
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
    let product;
    try {
        product = await Product.find({ title });
        if(product.length > 0){
            const message = 'A product with a similar title already exists. Perharps you have already added it';
            const type = 'title';
            return next(new HttpError('Error from title', [{ message, type }], 422))
        }
    } catch (err) {
        return next(new HttpError('Unable to look for similar product', null, 500))
    }

    product = new Product({ title, category, price: Number(price), isDiscount: false, isFinished: false, newPrice: 0, image: 'https://cdn.pixabay.com/photo/2016/06/07/17/15/yogurt-1442034__340.jpg' });

    try {
        await product.save();
    } catch (err) {
        return next(new HttpError('Unable to create product', null, 500));
    }

    res.status(201).json({ message: 'Product created successfully', category: product.category, price: product.price, isDiscount: product.isDiscount, isFinished: product.isFinished, newPrice: product.newPrice, image: product.image, title: product.title, id: product._id, createdAt: product.createdAt.toISOString() });
}

exports.getProductById = async (req, res, next) => {
    const productId = req.params.productId;
    let product;
    try {
        product = await Product.findById(productId);
        if(!product){
            return next(new HttpError('The product you are looking for does not exist', null, 404));
        }
    } catch (err) {
        return next(new HttpError('Unable to find product', null, 500));
    }
    res.status(200).json({ message: 'Product found', category: product.category, price: product.price, isDiscount: product.isDiscount, isFinished: product.isFinished, newPrice: product.newPrice, image: product.image, title: product.title, id: product._id, createdAt: product.createdAt.toISOString()})
}

exports.editProduct = async (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    let decodedId;
    try {
        if(!token){
            const message = 'Your token has expired';
            const type = 'code'
            return next(new HttpError('Token error', [{ message, type }], 403));
        }
        const decodedToken = jwt.verify(token, 'shop_secret');
        decodedId = decodedToken.id;
        
    } catch (err) {
        return next(new HttpError('Error validating token', null, 500));
    }

    let foundAdmin;

    try {
        foundAdmin = await Admin.findById(decodedId);
        if(!foundAdmin){
            const message = 'You are not allowed to edit this product';
            const type = 'code';
            return next(new HttpError('Token error', [{ message, type }], 403));
        }

    } catch (err) {
        return next(new HttpError('Error validating the token', null, 500));
    }

    const productId = req.params.productId;
    const { title, isDiscount, isFinished, newPrice } = req.body;
    let product;
    try {
        product = await Product.findById(productId);
        if(!product){
            return next(new HttpError('The product you are looking for does not exist', null, 404));
        }
    } catch (err) {
        return next(new HttpError('Unable to find product', null, 500));
    }
    product.title = title;
    product.isDiscount = isDiscount;
    product.isFinished = isFinished;
    product.newPrice = newPrice;
    try {
        await product.save();
    } catch (err) {
        return next(new HttpError('Unable to update product', null, 500));
    }
    res.status(200).json({ message: 'Product updated', category: product.category, price: product.price, isDiscount: product.isDiscount, isFinished: product.isFinished, newPrice: product.newPrice, image: product.image, title: product.title, id: product._id, createdAt: product.createdAt.toISOString()})
}

exports.deleteProduct = async (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    let decodedId;
    try {
        if(!token){
            const message = 'Your token has expired';
            const type = 'code'
            return next(new HttpError('Token error', [{ message, type }], 403));
        }
        const decodedToken = jwt.verify(token, 'shop_secret');
        decodedId = decodedToken.id;
        
    } catch (err) {
        return next(new HttpError('Error validating token', null, 500));
    }

    let foundAdmin;

    try {
        foundAdmin = await Admin.findById(decodedId);
        if(!foundAdmin){
            const message = 'You are not allowed to delete this product';
            const type = 'code';
            return next(new HttpError('Token error', [{ message, type }], 403));
        }

    } catch (err) {
        return next(new HttpError('Error validating the token', null, 500));
    }

    const productId = req.params.productId;
    try {
        await Product.findByIdAndDelete(productId);
    } catch(err){
        return next(new HttpError('Unable to delete product', null, 500))
    }
    res.status(200).json({ message: 'Product deleted' });
}

exports.addToCart = async (req, res, next) => {
    const userId = req.params.userId.trim();
    const { cart } = req.body;
    let user;
    try {
        user = await User.findById(userId);
        if(!user){
            return next(new HttpError('The user does not exist', null, 400));
        }
    } catch (err) {
        return next(new HttpError('Unable to find the user', null, 500));
    }

    user.cart = cart;
    try {
        await user.save();
    } catch (err) {
        return next(new HttpError('Unable to update the user', null, 500));
    }
    res.json({ message: 'Cart updated successfully' });
}

exports.addOrder = async (req, res, next) => {
    const userId = req.params.userId.trim();
    const { order, address, location } = req.body;
    let user;
    try {
        user = await User.findById(userId);
        if(!user){
            return next(new HttpError('The user does not exist', null, 400));
        }
    } catch (err) {
        return next(new HttpError('An error while looking for the user', null ,500));
    }
    const userOrders = user.orders;
    const updatedOrders = [...userOrders, order];
    user.orders = updatedOrders;
    user.cart = [];
    try {
        await user.save();
    } catch(err) {
        return next(new HttpError('Unable to save the orders', null, 500));
    }

    const generalOrder = new Order({ totalAmount: order.totalAmount, productsOrdered: order.productsOrdered, delivered: order.delivered || false, customerEmail: user.email, customerName: user.name, customerPhoneNumber: user.phoneNumber, customerId: user._id, customerAddress: address, customerLocation: location });

    try {
        await generalOrder.save();
    } catch (err) {
        return next(new HttpError('Unable to add the new order', null, 500));
    }

    res.status(200).json({ message: 'Order added', order })
}

exports.delivery = async (req, res, next) => {
    const orderId = req.params.orderId;
    let foundOrder;
    try {
        foundOrder = await Order.findById(orderId);
        if(!foundOrder){
            const message = 'The order you are looking for does not exist';
            const type = 'order';
            return next(new HttpError('Order error', [{ message, type }], 404));
        }
    } catch (err) {
        return next(new HttpError('Unable to find order among whole orders', null, 500));
    }

    let user;

    try {
        user = await User.findOne({ phoneNumber: foundOrder.customerPhoneNumber});
        if(!user){
            const message = 'The user you are looking for does not exist';
            const type = 'user';
            return next(new HttpError('User error', [{ message, type }], 400));
        }
    } catch (err) {
        return next(new HttpError('Unable to find the user the order belongs to.', null, 500));
    }

    const orderToUpdate = user.orders.find((order) => order.productsOrdered[0].title === foundOrder.productsOrdered[0].title && order.totalAmount === foundOrder.totalAmount);
    const indexOfOrderToUpdate = user.orders.findIndex((order) => order.productsOrdered[0].title === foundOrder.productsOrdered[0].title && order.totalAmount === foundOrder.totalAmount);

    if(!orderToUpdate){
        return next(new HttpError('Unable to update the delivery status of the order', null, 500));
    }

    foundOrder.delivered = true;

    try {
        await foundOrder.save();
    } catch (err) {
        return next(new HttpError('An error while updating main order', null, 500));
    }

    user.orders[indexOfOrderToUpdate].delivered = true;

    try {
        await user.save();
    } catch (err) {
        return next(new HttpError('An error occurred while updated customer order', null, 500));
    }

    res.status(200).json({ message: 'Delivery has been made successfully' });
}

exports.createCategory = async (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    const { title } = req.body;

    let decodedId;
    try {
        if(!token){
            const message = 'Your token has expired';
            const type = 'code'
            return next(new HttpError('Token error', [{ message, type }], 403));
        }
        const decodedToken = jwt.verify(token, 'shop_secret');
        decodedId = decodedToken.id;
        
    } catch (err) {
        return next(new HttpError('Error validating token', null, 500));
    }

    let foundAdmin;

    try {
        foundAdmin = await Admin.findById(decodedId);
        if(!foundAdmin){
            const message = 'You are not allowed to create a new product.';
            const type = 'code';
            return next(new HttpError('Token error', [{ message, type }], 403));
        }

    } catch (err) {
        return next(new HttpError('Error validating the token', null, 500));
    }

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

    let foundCategory; 

    try {
        foundCategory = await Category.findOne({ title });
        if(foundCategory){
            const message = 'This category already exists.';
            const type = 'title';
            return next(new HttpError('Unable to process category title', [{ message, type }], 422))
        }
    } catch (err) {
        return next(new HttpError('Unable to look for the category name'));
    }

    const newCategory = new Category({ title });

    try {
        await newCategory.save();
    } catch (err) {
        return next(new HttpError('Unable to save the new category', null, 500));
    }
    res.status(201).json({ message: 'Category added successfully', title: title })
}

exports.accessToken = async (req, res, next) => {
    
}