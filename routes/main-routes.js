const express = require('express');
const mainControllers = require('../controllers/main-controllers');

const router = express.Router();

router.get('/', mainControllers.main);

module.exports = router;