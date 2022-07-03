const express = require('express');

const authControllers = require('../controllers/auth-controllers');

const router = express.Router();

router.get('/', authControllers.getAuth);


module.exports = router;