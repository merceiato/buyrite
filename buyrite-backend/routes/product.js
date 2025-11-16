const express = require('express')
const router = express.Router()
const path = require('path')

const Utils = require('./../utils')
const Product = require('./../models/Product')
const User = require('./../models/User')

// helpers for parsing rating fields ----------------------------
// simple numeric check so user can’t submit weird stuff
function parseRating(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  if (n < 0 || n > 5) return null
  return n
}

// bundle all ethical rating fields together
function buildEthicalRatingsFromBody(body) {
  const hasAnyEthField =
    body.eth_animalWelfare !== undefined ||
    body.eth_humanitarian !== undefined ||
    body.eth_sustainability !== undefined ||
    body.eth_environmentalism !== undefined

  const animalWelfare = parseRating(body.eth_animalWelfare)
  const humanitarian = parseRating(body.eth_humanitarian)
  const sustainability = parseRating(body.eth_sustainability)
  const environmentalism = parseRating(body.eth_environmentalism)

  // nothing provided → skip updating this block
  if (!hasAnyEthField) return null

  // if any rating is bad → reject
  if (
    animalWelfare === null ||
    humanitarian === null ||
    sustainability === null ||
    environmentalism === null
  ) {
    return 'invalid'
  }

  return { animalWelfare, humanitarian, sustainability, environmentalism }
}

// checks vendor access based on DB lookup ----------------------
function requireVendor(req, res, next) {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  User.findById(req.user._id)
    .then(user => {
      if (!user) return res.status(401).json({ message: 'User not found' })

      // vendor = accessLevel 2 (simple system)
      if (Number(user.accessLevel) !== 2) {
        return res.status(403).json({ message: 'Vendor access required' })
      }

      req.user.accessLevel = user.accessLevel
      next()
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Error checking vendor access', error: err })
    })
}

// GET /product/vendor ------------------------------------------
// returns all products for this vendor
router.get('/vendor', Utils.authenticateToken, requireVendor, (req, res) => {
  Product.find({ vendor: req.user._id })
    .sort({ createdAt: -1 })
    .then(products => res.json(products))
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Problem getting vendor products', error: err })
    })
})

// GET /product -------------------------------------------------
// public product list (only active ones)
router.get('/', (req, res) => {
  Product.find({ active: true })
    .sort({ createdAt: -1 })
    .then(products => res.json(products))
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Problem getting products', error: err })
    })
})

// POST /product ------------------------------------------------
// create a new vendor product
router.post('/', Utils.authenticateToken, requireVendor, (req, res) => {
  if (!req.body && !req.files) {
    return res.status(400).json({ message: 'Product data cannot be empty' })
  }

  // ethical ratings required on create
  const ethicalRatings = buildEthicalRatingsFromBody(req.body)
  if (ethicalRatings === null || ethicalRatings === 'invalid') {
    return res.status(400).json({
      message:
        'All ethical ratings are required and must be between 0 and 5.'
    })
  }

  const createProduct = (imageFilename) => {
    const productData = {
      vendor: req.user._id,
      title: req.body.title,
      category: req.body.category,
      price: req.body.price,
      description: req.body.description,
      ethicalRatings
    }

    if (imageFilename) productData.image = imageFilename

    new Product(productData)
      .save()
      .then(product => res.status(201).json(product))
      .catch(err => {
        console.log(err)
        res.status(500).json({ message: 'Problem creating product', error: err })
      })
  }

  // handle image upload if present
  if (req.files && req.files.image) {
    const uploadPath = path.join(__dirname, '..', 'public', 'images')
    Utils.uploadFile(req.files.image, uploadPath, (uniqueFilename) => {
      createProduct(uniqueFilename)
    })
  } else {
    createProduct(null)
  }
})

// PUT /product/:id --------------------------------------------
// update vendor product
router.put('/:id', Utils.authenticateToken, requireVendor, (req, res) => {
  if (!req.body && !req.files) {
    return res.status(400).json({ message: 'Product data cannot be empty' })
  }

  const update = {}
  const fields = ['title', 'category', 'price', 'description', 'active']

  // optional patch update — only add fields they provided
  fields.forEach(field => {
    if (req.body[field] !== undefined && req.body[field] !== '') {
      update[field] = req.body[field]
    }
  })

  // ethical ratings: optional on update, but if submitted must be valid
  const ethicalRatings = buildEthicalRatingsFromBody(req.body)
  if (ethicalRatings === 'invalid') {
    return res.status(400).json({
      message: 'Ethical ratings must be between 0 and 5.'
    })
  }
  if (ethicalRatings && ethicalRatings !== 'invalid') {
    update.ethicalRatings = ethicalRatings
  }

  const doUpdate = (imageFilename) => {
    if (imageFilename) update.image = imageFilename

    Product.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user._id }, // vendor-only edit
      update,
      { new: true }
    )
      .then(product => {
        if (!product) {
          return res.status(404).json({ message: 'Product not found' })
        }
        res.json(product)
      })
      .catch(err => {
        console.log(err)
        res.status(500).json({ message: 'Problem updating product', error: err })
      })
  }

  if (req.files && req.files.image) {
    const uploadPath = path.join(__dirname, '..', 'public', 'images')
    Utils.uploadFile(req.files.image, uploadPath, (uniqueFilename) => {
      doUpdate(uniqueFilename)
    })
  } else {
    doUpdate(null)
  }
})

// DELETE /product/:id ------------------------------------------
// vendor deletes their own product
router.delete('/:id', Utils.authenticateToken, requireVendor, (req, res) => {
  Product.findOneAndDelete({ _id: req.params.id, vendor: req.user._id })
    .then(product => {
      if (!product) {
        return res.status(404).json({ message: 'Product not found' })
      }
      res.json({ message: 'Product deleted', product })
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Problem deleting product', error: err })
    })
})

module.exports = router
