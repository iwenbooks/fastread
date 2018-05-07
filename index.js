'use strict';

const Koa = require("koa");
const logger = require('koa-logger');
const bodyParser = require('koa-body-parser');
const mongoose = require('mongoose');

const app = new Koa();
const routers = require('./routers');

app.use(bodyParser());
app.use(routers.routers());
app.use(routers.securedRouters());
app.use(logger());

app.listen(8687);

const mongodbUri = 'mongodb://localhost:27017/fastread';
mongoose.connect(mongodbUri, { /*config: { autoIndex: false }*/ });

// MongoDB connect success
mongoose.connection.on('connected', function () {
    console.log('Mongoose default connection open to ' + mongodbUri);
});

// MongoDB connect error
mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
});

// MongoDB disconnect
mongoose.connection.on('disconnected', function () {
    console.log('Mongoose default connection disconnected');
});

// disconnect MongoDB before the process close
process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection closed through app termination');
        process.exit(0);
    });
});
