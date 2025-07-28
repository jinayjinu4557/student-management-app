var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const studentsRouter = require('./routes/students');
const feesRouter = require('./routes/fees');
const summaryRouter = require('./routes/summary');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hometuition', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/students', studentsRouter);
app.use('/api/fees', feesRouter);
app.use('/api/summary', summaryRouter);

module.exports = app;
