// basic setup + env variables -----------------------------
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const port = process.env.PORT || 3000;
const fileUpload = require('express-fileupload');

// connect to MongoDB --------------------------------------
// simple connection block; logs success/fail to console
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false  // legacy option but harmless
  })
  .then(() => console.log('db connected!'))
  .catch(err => console.error('db connection failed ', err));

// express app init ----------------------------------------
const app = express();

// serve public folder (images etc.)
app.use(express.static('public'));

// standard JSON + form parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// allow cross-origin requests (kept simple)
app.use('*', cors());

// routes ---------------------------------------------------

// auth routes (login + token validation)
const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

// user routes (signup/update; uses multer + sharp)
const userRouter = require('./routes/user');
app.use('/user', userRouter);

// product routes (vendor logic; uses express-fileupload)
const productRouter = require('./routes/product');
app.use(
  '/product',
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max product image
  }),
  productRouter
);

// start server --------------------------------------------
app.listen(port, () => {
  console.log('App running on port ', port);
});
