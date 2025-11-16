const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Utils = require('./../utils')
require('mongoose-type-email')

// user accounts for login + profile info
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    require: true   // small typo in original but mongoose still handles this
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: mongoose.SchemaTypes.Email,
    required: true   // built-in email validation from plugin
  },
  password: {
    type: String,
    required: true    // will be hashed before saving
  },
  avatar: {
    type: String      // optional profile picture
  },
  bio: {
    type: String      // short user intro
  },
  accessLevel: {
    type: Number      // leave flexible for admin/user roles later
  },
  newUser: {
    type: Boolean,
    default: true     // can be used for onboarding prompts
  }
}, { timestamps: true })

// encrypt password before saving to DB
userSchema.pre('save', function(next) {
  // only hash if the field is set AND actually changed
  if (this.password && this.isModified()) {
    this.password = Utils.hashPassword(this.password)
  }
  next()
})

// final model
const userModel = mongoose.model('User', userSchema)

module.exports = userModel
