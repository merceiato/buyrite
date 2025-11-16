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

  // 🔑 add new fields here
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
        // accept boolean or "true"/"false" strings
        const v = req.body[field]
        update[field] = v === 'true' || v === true

      } else if (field === 'ethicalPreferences') {
        // can arrive as JSON string (from multipart) or as an object (from JSON body)
        let prefs = req.body.ethicalPreferences

        if (typeof prefs === 'string') {
          try {
            prefs = JSON.parse(prefs)
          } catch (e) {
            console.warn('Could not parse ethicalPreferences JSON', e)
            prefs = {}
          }
        }

        // pick only the known keys, and coerce to numbers where possible
        const cleaned = {}
        const keys = [
          'animalWelfare',
          'humanitarian',
          'sustainability',
          'environmentalism'
        ]

        keys.forEach(k => {
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
      // note: you can add sharp processing here if needed
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
