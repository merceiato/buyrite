// Product model for vendor items that show up in the shop.
// Ethical ratings live on the same doc so they are easy to query/filter later.
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const productSchema = new Schema({
  vendor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String
  },
  image: {
    type: String // filename saved into /public/images
  },
  active: {
    type: Boolean,
    default: true
  },
  // group of simple numeric ratings for the "ethical" side of the app (0–5)
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
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)
