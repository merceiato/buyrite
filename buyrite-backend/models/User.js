// Basic user schema + model.
// Mostly the same idea as A1 but with avatar/bio/accessLevel for the SPA profile view.
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Utils = require('./../utils')
require('mongoose-type-email')

// schema
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    require: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: mongoose.SchemaTypes.Email,
    required: true    
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String    
  },
  bio: {
    type: String    
  },
  accessLevel: {
    type: Number    
  },
  newUser: {
    type: Boolean,
    default: true    
  }
}, { timestamps: true })

// encrypt password field on save
userSchema.pre('save', function(next) {
  // only hash when password exists and the doc has changed
  if( this.password && this.isModified() ){
      this.password = Utils.hashPassword(this.password);
  }
  next()
})

// model
const userModel = mongoose.model('User', userSchema)

// export
module.exports = userModel
