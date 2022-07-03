const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');

const keys = require('./private/keys');
const HttpError = require('./models/http-error');
const mainRoutes = require('./routes/main-routes');
const authRoutes = require('./routes/auth-routes');
const shopRoutes = require('./routes/shop-routes');

const app = express();

app.use(bodyParser.json());

app.use('/images', express.static(path.join('public', 'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
  });

app.use(mainRoutes);
app.use('/auth', authRoutes);
app.use('/shop', shopRoutes);

app.use((req, res, next) => {
  throw new HttpError('The page you are looking for could not be found', 404);
})

app.use((error, req, res, next) => {
  res.status(error.code || 500);
  res.json({ message: error.message || 'An Unknown error has occurred!' })
})

mongoose.connect(`mongodb+srv://pius_gori:${keys.mongoPassword}@piuscluster.wvoqx.mongodb.net/shop?retryWrites=true&w=majority`).then(() => {
  app.listen(8000);
}).catch(err => {
  console.log(err);
})
