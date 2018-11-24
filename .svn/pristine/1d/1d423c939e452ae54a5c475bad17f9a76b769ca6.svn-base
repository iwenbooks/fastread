'use strict';

const Koa = require('koa');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const mongoose = require('mongoose');
var parse = require('co-busboy');
const fs = require('fs');

const app = new Koa();
const routers = require('./routers');

app.use(
  bodyParser({
    multipart: true
  })
);

app.use(async (ctx, next) => {
  // the body isn't multipart, so busboy can't parse it
  if (!!ctx.request.is('multipart/*')) {
    var parts = parse(ctx);
    var part;
    while ((part = await parts())) {
      if (part.length) {
        // arrays are busboy fields
        console.log('key: ' + part[0]);
        console.log('value: ' + part[1]);
      } else {
        // otherwise, it's a stream
        ctx.req.part = part;
        await next(ctx);
        return;
      }
    }
    console.log('and we are done parsing the form!');
  }
  await next();
});

app.use(routers.routers());
app.use(routers.securedRouters());
app.use(logger());
const PORT = 9596;
app.listen(PORT);

console.log(`listen to PORT ${PORT}`);
//const mongodbUri = 'mongodb://localhost:27017/fastread';
const mongodbUri = 'mongodb://localhost:1997/fastread';

mongoose.connect(
  mongodbUri,
  {
    /*config: { autoIndex: false }*/
  }
);

// MongoDB connect success
mongoose.connection.on('connected', function() {
  console.log('Mongoose default connection open to ' + mongodbUri);
});

// MongoDB connect error
mongoose.connection.on('error', function(err) {
  console.log('Mongoose default connection error: ' + err);
});

// MongoDB disconnect
mongoose.connection.on('disconnected', function() {
  console.log('Mongoose default connection disconnected');
});

// disconnect MongoDB before the process close
process.on('SIGINT', function() {
  mongoose.connection.close(function() {
    console.log('Mongoose default connection closed through app termination');
    process.exit(0);
  });
});
