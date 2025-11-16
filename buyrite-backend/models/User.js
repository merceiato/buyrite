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
    // 1 = shopper, 2 = vendor
    type: Number
  },
  newUser: {
    type: Boolean,
    default: true
  },

  // ---------- Ethical preferences from questionnaire ----------
  ethicalPreferences: {
    animalWelfare: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    humanitarian: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    sustainability: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    },
    environmentalism: {
      type: Number,
      min: 1,
      max: 5,
      default: 3
    }
  },

  questionnaireCompleted: {
    type: Boolean,
    default: false
  }

}, { timestamps: true })

// encrypt password field on save
userSchema.pre('save', function (next) {
  // check if password is present and is modified
  if (this.password && this.isModified()) {
    this.password = Utils.hashPassword(this.password)
  }
  next()
})

// model
const userModel = mongoose.model('User', userSchema)

// export
module.exports = userModel
