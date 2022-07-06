const express = require('express');
const { body } = require('express-validator');

const authControllers = require('../controllers/auth-controllers');

const router = express.Router();

router.get('/', authControllers.getUsers);

router.post('/signup', [
    body('name').isLength({ min: 3 }).withMessage('Please enter a name of at least 3 characters long!'),
    body('password').isLength({ min: 8 }).withMessage('Please enter a strong password, at least 8 characters long!'),
    body('email').normalizeEmail().isEmail().withMessage('Please enter a valid E-Mail Address'),
    body('phoneNumber').isLength({ min: 10 }).withMessage('Please enter a correct phone number!'),
] ,authControllers.signup);

router.post('/login', [
    body('email').normalizeEmail().isEmail().withMessage('Please enter a valid E-Mail Address'),
] ,authControllers.login);

router.post('/reset-password', [
    body('email').normalizeEmail().isEmail().withMessage('Please enter a valid E-Mail Address'),
],authControllers.passwordReset);

router.post('/new-password', authControllers.createNewPassword);

router.post('/set-password', [
    body('email').normalizeEmail().isEmail().withMessage('Please enter a valid E-Mail Address'),
    body('password').isLength({ min: 8 }).withMessage('Please enter a strong password, at least 8 characters long!'),
],authControllers.setPassword);

router.post('/admin/signup', [
    body('name').isLength({ min: 3 }).withMessage('Please enter a name of at least 3 characters long!'),
    body('password').isLength({ min: 8 }).withMessage('Please enter a strong password, at least 8 characters long!'),
    body('email').normalizeEmail().isEmail().withMessage('Please enter a valid E-Mail Address'),
    body('phoneNumber').isLength({ min: 10 }).withMessage('Please enter a correct phone number!'),
], authControllers.adminSignup);

router.post('/admin/login', [
    body('email').normalizeEmail().isEmail().withMessage('Please enter a valid E-Mail Address'),
], authControllers.adminLogin);

module.exports = router;