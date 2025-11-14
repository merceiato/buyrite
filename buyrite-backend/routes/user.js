const express = require('express')
const router = express.Router()
const Utils = require('./../utils')
const User = require('./../models/User')
const path = require('path')

// GET - get single user -------------------------------------------------------
router.get('/:id', Utils.authenticateToken, (req, res) => {
  if(req.user._id != req.params.id){
    return res.status(401).json({
      message: "Not authorised"
    })
  }

  User.findById(req.params.id)
    .then(user => {
      res.json(user)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({
        message: "Couldn't get user",
        error: err
      })
    })
})


// PUT - update user ---------------------------------------------
router.put('/:id', Utils.authenticateToken, (req, res) => {
  // validate request
  if (!req.body && !req.files) return res.status(400).send("User content can't be empty")

  // only allow user to update their own profile
  if (req.user._id != req.params.id) {
    return res.status(401).json({ message: "Not authorised" })
  }

  // build update object only from fields that are actually provided
  const update = {}
  const updatableFields = ['firstName', 'lastName', 'email', 'bio', 'accessLevel']

  updatableFields.forEach(field => {
    if (req.body[field] !== undefined && req.body[field] !== '') {
      update[field] = req.body[field]
    }
  })

  // if avatar image exists, upload!
  if (req.files && req.files.avatar) {
    let uploadPath = path.join(__dirname, '..', 'public', 'images')
    Utils.uploadFile(req.files.avatar, uploadPath, (uniqueFilename) => {
      update.avatar = uniqueFilename
      doUpdate(update)
    })
  } else {
    // no avatar change
    doUpdate(update)
  }

  function doUpdate(updateObj) {
    User.findByIdAndUpdate(req.params.id, updateObj, { new: true })
      .then(user => res.json(user))
      .catch(err => {
        console.log(err)
        res.status(500).json({
          message: 'Problem updating user',
          error: err
        })
      })
  }
})


// POST - create new user --------------------------------------
router.post('/', (req, res) => {
  // validate request
  if(Object.keys(req.body).length === 0){   
    return res.status(400).send({message: "User content can not be empty"})
  }

  // check account with email doen't already exist
  User.findOne({email: req.body.email})
  .then(user => {
    if( user != null ){
      return res.status(400).json({
        message: "email already in use, use different email address"
      })
    }
  // create new user       
  let newUser = new User(req.body)
  newUser.save()
    .then(user => {        
      // success!  
      // return 201 status with user object
      return res.status(201).json(user)
    })
    .catch(err => {
      console.log(err)
      return res.status(500).send({
        message: "Problem creating account",
        error: err
      })
    })
  })
})

module.exports = router