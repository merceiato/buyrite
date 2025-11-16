const mongoose = require('mongoose')
const Schema = mongoose.Schema

// Product schema holds everything needed to list an item in the marketplace
const productSchema = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'User',  // links back to whoever created the product
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true    // helps keep things cleaner
  },
  category: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0        // no negative prices obviously
  },
  description: {
    type: String
  },
  image: {
    type: String   // stores the file name from /public/images
  },
  active: {
    type: Boolean,
    default: true  // lets vendors disable an item without deleting it
  },

  // basic ethical ratings (0–5). Just a simple block to expand on later if needed
  ethicalRatings: {
    animalWelfare: {
      type: Number,
      min: 0,
      max: 5,
      required: true,
      default: 3
    },
    humanitarian: {
      type: Number,
      min: 0,
      max: 5,
      required: true,
      default: 3
    },
    sustainability: {
      type: Number,
      min: 0,
      max: 5,
      required: true,
      default: 3
    },
    environmentalism: {
      type: Number,
      min: 0,
      max: 5,
      required: true,
      default: 3
    }
  }
}, { timestamps: true })  // auto-adds createdAt + updatedAt

module.exports = mongoose.model('Product', productSchema)
