const express = require('express')
const router = express.Router()
const Utils = require('./../utils')
const User = require('./../models/User')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const uploadAvatar = require('../middleware/uploadAvatar')

// GET /user/:id --------------------------------------------------
// only the user can view their own data
router.get('/:id', Utils.authenticateToken, (req, res) => {
  if (req.user._id != req.params.id) {
    return res.status(401).json({ message: 'Not authorised' })
  }

  User.findById(req.params.id)
    .then(user => {
      if (!user) return res.status(404).json({ message: 'User not found' })
      res.json(user)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: "Couldn't get user", error: err })
    })
})

// PUT /user/:id --------------------------------------------------
// update profile + optional avatar upload
router.put('/:id', Utils.authenticateToken, uploadAvatar, async (req, res) => {
  if (req.user._id != req.params.id) {
    return res.status(401).json({ message: 'Not authorised' })
  }

  if (!req.body && !req.file) {
    return res.status(400).send("User content can't be empty")
  }

  // only update fields they actually sent
  const update = {}

  // NOTE: include the ethical fields here
  const allowed = [
    'firstName',
    'lastName',
    'email',
    'bio',
    'accessLevel',
    'newUser',
    'ethicalPreferences',
    'questionnaireCompleted'
  ]

  allowed.forEach(field => {
    if (req.body[field] !== undefined && req.body[field] !== '') {
      if (field === 'accessLevel') {
        update[field] = Number(req.body[field])

      } else if (field === 'newUser' || field === 'questionnaireCompleted') {
        const v = req.body[field]
        update[field] = v === 'true' || v === true

      } else if (field === 'ethicalPreferences') {
        // coming from JSON body, so this should already be an object
        // we still coerce to numbers just in case
        const prefs = req.body.ethicalPreferences || {}
        const cleaned = {}
        ;['animalWelfare', 'humanitarian', 'sustainability', 'environmentalism']
          .forEach(k => {
            if (prefs[k] !== undefined) {
              const n = Number(prefs[k])
              if (Number.isFinite(n)) cleaned[k] = n
            }
          })
        update.ethicalPreferences = cleaned

      } else {
        update[field] = req.body[field]
      }
    }
  })

  try {
    // process avatar if given
    if (req.file) {
      const uploadDir = path.join(__dirname, '..', 'public', 'images')
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const filename = `${req.params.id}-${Date.now()}.jpg`
      const fullPath = path.join(uploadDir, filename)

      await sharp(req.file.buffer)
        .resize(256, 256, { fit: 'cover' }) // simple square avatar
        .jpeg({ quality: 80 })
        .toFile(fullPath)

      update.avatar = filename
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    )

    if (!user) return res.status(404).json({ message: 'User not found' })

    return res.json(user)
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      message: 'Problem updating user',
      error: err
    })
  }
})

// POST /user (signup) --------------------------------------------
// new account creation
router.post('/', uploadAvatar, (req, res) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).send({ message: 'User content can not be empty' })
  }

  // check if email already exists
  User.findOne({ email: req.body.email }).then(user => {
    if (user != null) {
      return res.status(400).json({
        message: 'email already in use, use different email address'
      })
    }

    let newUser = new User(req.body)

    // user may upload an avatar on signup (optional)
    if (req.file) {
      newUser.avatar = `${newUser._id}-${Date.now()}.jpg`
      // (if uploadAvatar stores the file, this filename should match)
    }

    newUser
      .save()
      .then(user => res.status(201).json(user))
      .catch(err => {
        console.log(err)
        res.status(500).send({
          message: 'Problem creating account',
          error: err
        })
      })
  })
})

module.exports = router
