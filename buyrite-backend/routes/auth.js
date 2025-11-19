// Simple auth routes for login and token validation using JWT.
require('dotenv').config()
const express = require('express')
const router = express.Router()
const User = require('./../models/User')
const Utils = require('./../utils')
const jwt = require('jsonwebtoken')

// POST /signin ---------------------------------------
router.post('/signin', (req, res) => {
  // quick check that both email and password were sent from the client
  if( !req.body.email || !req.body.password ){     
    return res.status(400).json({message: "Please provide email and password"})
  }
  // find the user in the database
  User.findOne({email: req.body.email})
  .then(async user => {
     // account doesn't exist
     if(user == null) return res.status(400).json({message: 'No account found'})     
     // user exists, now check password against stored hash
     if (Utils.verifyHash(req.body.password, user.password)) {
  // credentials match - create JWT token
  let payload = {
    _id: user._id,
    accessLevel: user.accessLevel   // keep accessLevel so the front end knows vendor vs normal user
  }
  let accessToken = Utils.generateAccessToken(payload)
  // strip the password from our user object before sending it back        
  user.password = undefined
  return res.json({
    accessToken: accessToken,
    user: user
  })
}
else{
        // Password didn't match!
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


// GET /validate --------------------------------------
// used on initial app load to check if the stored token is still valid
router.get('/validate', (req, res) => {   
  // get token from "Authorization: Bearer <token>"
  let token = req.headers['authorization'].split(' ')[1];
  // validate token using jwt
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authData) => {
    if(err){
      console.log(err)
      return res.status(401).json({
        message: "Unauthorised"
      })
    }

    // token valid - send back the latest user data
    User.findById(authData._id)
      .then(user => {
        // remove password field (never send this back!)
        user.password = undefined
        res.json({
          user: user
        })
      })
      .catch(err => {
        console.log(err)
        res.status(500).json({
          message: "problem validating token",
          error: err
        })
      })
  })
})



module.exports = router
