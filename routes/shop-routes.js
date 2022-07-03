const express = require('express');

const shopControllers = require('../controllers/shop-controllers');

const router = express.Router();

router.get('/', shopControllers.getShop);

module.exports = router;