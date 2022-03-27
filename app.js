const cookieParser = require('cookie-parser');
const express = require('express');
const httpErrors = require('http-errors');
const logger = require('morgan');
const path = require('path');
const debug = require('debug')('klarna');

// ENV PARAMS
const KLARNA_API_USERNAME = (process.env.KLARNA_API_USERNAME !== undefined ? process.env.KLARNA_API_USERNAME : null);
const KLARNA_API_PASSWORD = (process.env.KLARNA_API_PASSWORD !== undefined ? process.env.KLARNA_API_PASSWORD : null);
const KLARNA_API_URL = (process.env.KLARNA_API_URL !== undefined
  ? process.env.KLARNA_API_URL : 'https://api-na.playground.klarna.com');

if (!KLARNA_API_USERNAME || !KLARNA_API_PASSWORD) {
  debug('KLARNA_API_USERNAME or KLARNA_API_PASSWORD env variables not found.');
  process.exit(1);
}

const KlarnaService = require('./services/KlarnaService');

// eslint-disable-next-line no-unused-vars
const klarnaService = new KlarnaService(KLARNA_API_USERNAME, KLARNA_API_PASSWORD, KLARNA_API_URL).getInstance();

const app = express();

const indexRouter = require('./routes/index');
const sessionRouter = require('./routes/session');
const orderRouter = require('./routes/order');

app.set('views', path.join(__dirname, 'views'));
// view engine setup
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/session', sessionRouter);
app.use('/order', orderRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(httpErrors(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

debug('Application started!');

module.exports = app;
