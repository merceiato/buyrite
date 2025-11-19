// Entry point for the backend API.
// Sets up Express, connects to MongoDB and mounts auth/user/product routes.
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const port = process.env.PORT || 3000;
const fileUpload = require('express-fileupload');

// database connection ----------------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => console.log('db connected!'))
  .catch(err => console.error('db connection failed ', err));

// express app setup -----------------------
const app = express();
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('*', cors());

// routes ---------------------------------

// auth
const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

// user (uses multer + sharp via uploadAvatar in routes/user.js)
const userRouter = require('./routes/user');
app.use('/user', userRouter);

// product (uses express-fileupload for product image uploads)
const productRouter = require('./routes/product');
app.use(
  '/product',
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }
  }),
  productRouter
);

// run app listen on port --------------------
app.listen(port, () => {
  console.log('App running on port ', port);
});
