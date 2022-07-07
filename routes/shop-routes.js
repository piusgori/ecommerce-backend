const express = require('express');
const { body } = require('express-validator');

const shopControllers = require('../controllers/shop-controllers');

const router = express.Router();

const request = require('request');
// const keys = require('../private/keys');

const getAccess = (req, res, next) => {
    const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    const auth = new Buffer(`${process.env.darajaConsumerKey}:${process.env.darajaConsumerSecret}`).toString('base64');

    request({
        url: url,
        headers: { "Authorization": `Basic ${auth}` }
    }, (error, response, body) => {
        if(error){
            throw new Error('There is an error');
        }
        req.access_token = JSON.parse(body).access_token;
        next();
    })
}

router.get('/', shopControllers.getProducts);

router.get('/category', shopControllers.getCategories);

router.get('/product/:productId', shopControllers.getProductById);

router.get('/access-token', getAccess, shopControllers.accessToken);

router.post('/', [
    body('title').isLength({ min: 2 }).withMessage('Please enter a valid name of at least 2 characters long'),
    body('category').isLength({ min: 2 }).withMessage('Please enter a valid category of at least 2 characters'),
    body('price').isLength({ min: 2 }).withMessage('Please enter a valid price for your product'),
], shopControllers.createProduct);

router.post('/category', [
    body('title').isLength({ min: 2 }).withMessage('Please enter a valid category name of at least 2 characters long'),
], shopControllers.createCategory);

router.patch('/product/:productId', shopControllers.editProduct);

router.delete('/product/:productId', shopControllers.deleteProduct);

router.patch('/cart/:userId', shopControllers.addToCart);

router.post('/order/:userId', shopControllers.addOrder);

router.patch('/delivery/:orderId', shopControllers.delivery);

module.exports = router;