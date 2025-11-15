const express = require('express');
const router = express.Router();
const Utils = require('./../utils');
const User = require('./../models/User');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const uploadAvatar = require('../middleware/uploadAvatar'); // multer middleware

// GET - get single user -------------------------------------------------------
router.get('/:id', Utils.authenticateToken, (req, res) => {
  if (req.user._id != req.params.id) {
    return res.status(401).json({
      message: 'Not authorised'
    });
  }

  User.findById(req.params.id)
    .then(user => {
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      res.json(user);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        message: "Couldn't get user",
        error: err
      });
    });
});

// PUT - update user (includes avatar via multer + sharp) ----------------------
router.put('/:id', Utils.authenticateToken, uploadAvatar, async (req, res) => {
  // only allow user to update their own profile
  if (req.user._id != req.params.id) {
    return res.status(401).json({ message: 'Not authorised' });
  }

  // if nothing at all was sent
  if (!req.body && !req.file) {
    return res.status(400).send("User content can't be empty");
  }

  // Build update object only from provided fields
  const update = {};
  const updatableFields = [
    'firstName',
    'lastName',
    'email',
    'bio',
    'accessLevel',
    'newUser'
  ];

  updatableFields.forEach(field => {
    if (req.body[field] !== undefined && req.body[field] !== '') {
      if (field === 'accessLevel') {
        update[field] = Number(req.body[field]);
      } else if (field === 'newUser') {
        // handle "true"/"false" strings or boolean
        update[field] = req.body[field] === 'true' || req.body[field] === true;
      } else {
        update[field] = req.body[field];
      }
    }
  });

  try {
    // If avatar file is uploaded, process it with sharp
    if (req.file) {
      const uploadDir = path.join(__dirname, '..', 'public', 'images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filename = `${req.params.id}-${Date.now()}.jpg`;
      const fullPath = path.join(uploadDir, filename);

      await sharp(req.file.buffer)
        .resize(256, 256, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(fullPath);

      update.avatar = filename;
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    return res.json(user);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: 'Problem updating user',
      error: err
    });
  }
});

// POST - create new user ------------------------------------------------------
router.post('/', (req, res) => {
  // validate request
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send({ message: 'User content can not be empty' });
  }

  // check account with email doesn't already exist
  User.findOne({ email: req.body.email }).then(user => {
    if (user != null) {
      return res.status(400).json({
        message: 'email already in use, use different email address'
      });
    }

    // create new user
    let newUser = new User(req.body);
    newUser.save()
      .then(user => {
        // success! return 201 status with user object
        return res.status(201).json(user);
      })
      .catch(err => {
        console.log(err);
        return res.status(500).send({
          message: 'Problem creating account',
          error: err
        });
      });
  });
});

module.exports = router;
