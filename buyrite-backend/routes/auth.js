require('dotenv').config()
const express = require('express')
const router = express.Router()
const User = require('./../models/User')
const Utils = require('./../utils')
const jwt = require('jsonwebtoken')

// POST /signin --------------------------------------------------
// handles login + token creation
router.post('/signin', (req, res) => {
  // quick check so user doesn't submit blank form
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ message: "Please provide email and password" })
  }

  // find the user by email
  User.findOne({ email: req.body.email })
    .then(async user => {
      if (user == null) {
        return res.status(400).json({ message: 'No account found' })
      }

      // compare password hashes
      if (Utils.verifyHash(req.body.password, user.password)) {
        // build token payload with basic access info
        let payload = {
          _id: user._id,
          accessLevel: user.accessLevel
        }

        let accessToken = Utils.generateAccessToken(payload)

        // never send password back
        user.password = undefined

        return res.json({
          accessToken,
          user
        })
      } else {
        return res.status(400).json({
          message: "Password / Email incorrect"
        })
      }
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({
        message: "account doesn't exist",
        error: err
      })
    })
})

// GET /validate -----------------------------------------------
// checks token + returns user info
router.get('/validate', (req, res) => {
  // token comes through Authorization header
  let token = req.headers['authorization'].split(' ')[1]

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authData) => {
    if (err) {
      console.log(err)
      return res.status(401).json({ message: "Unauthorised" })
    }

    // token OK, now fetch the actual user
    User.findById(authData._id)
      .then(user => {
        if (user) user.password = undefined
        res.json({ user })
      })
      .catch(err => {
        console.log(err)
        res.status(500).json({
          message: 'problem validating token',
          error: err
        })
      })
  })
})

module.exports = router
