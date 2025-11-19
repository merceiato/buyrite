// Routes for creating and managing products for vendors and the public product list.
const express = require('express')
const router = express.Router()
const path = require('path')

const Utils = require('./../utils')
const Product = require('./../models/Product')
const User = require('./../models/User')

// helper: turn rating values from the form into safe numbers (0–5)
function parseRating(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  if (n < 0 || n > 5) return null
  return n
}

// build the ethicalRatings object from the incoming body fields
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

  // If none of the eth_ fields are present at all, return null so we can skip updates
  if (!hasAnyEthField) return null

  // If any are invalid, signal error back to the route handler
  if (
    animalWelfare === null ||
    humanitarian === null ||
    sustainability === null ||
    environmentalism === null
  ) {
    return 'invalid'
  }

  return {
    animalWelfare,
    humanitarian,
    sustainability,
    environmentalism
  }
}

// middleware: make sure the logged in user is a vendor (accessLevel 2)
function requireVendor(req, res, next) {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  // Look up the user in Mongo to confirm accessLevel
  User.findById(req.user._id)
    .then(user => {
      if (!user) {
        return res.status(401).json({ message: 'User not found' })
      }

      // Force numeric comparison so "2" also works
      if (Number(user.accessLevel) !== 2) {
        return res.status(403).json({ message: 'Vendor access required' })
      }

      // Keep accessLevel in req.user for later if needed
      req.user.accessLevel = user.accessLevel
      next()
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Error checking vendor access', error: err })
    })
}

// GET /product/vendor - products for the logged-in vendor
router.get('/vendor', Utils.authenticateToken, requireVendor, (req, res) => {
  Product.find({ vendor: req.user._id })
    .sort({ createdAt: -1 })
    .then(products => res.json(products))
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Problem getting vendor products', error: err })
    })
})

// GET /product - public list for consumer interface (only active products)
router.get('/', (req, res) => {
  Product.find({ active: true })
    .sort({ createdAt: -1 })
    .then(products => res.json(products))
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Problem getting products', error: err })
    })
})

// POST /product - create new product for vendor (with optional image)
router.post('/', Utils.authenticateToken, requireVendor, (req, res) => {
  if (!req.body && !req.files) {
    return res.status(400).json({ message: 'Product data cannot be empty' })
  }

  // Ethical ratings are mandatory on create so every product is scored
  const ethicalRatings = buildEthicalRatingsFromBody(req.body)
  if (ethicalRatings === null || ethicalRatings === 'invalid') {
    return res.status(400).json({
      message:
        'All ethical ratings (animal welfare, humanitarian, sustainability, environmentalism) are required and must be between 0 and 5.'
    })
  }

  const createProduct = (imageFilename) => {
    const productData = {
      vendor: req.user._id,
      title: req.body.title,
      category: req.body.category,
      price: req.body.price,
      description: req.body.description,
      ethicalRatings // new block
    }

    if (imageFilename) productData.image = imageFilename

    const newProduct = new Product(productData)

    newProduct.save()
      .then(product => res.status(201).json(product))
      .catch(err => {
        console.log(err)
        res.status(500).json({ message: 'Problem creating product', error: err })
      })
  }

  // handle image upload if present (uses express-fileupload)
  if (req.files && req.files.image) {
    const uploadPath = path.join(__dirname, '..', 'public', 'images')
    Utils.uploadFile(req.files.image, uploadPath, (uniqueFilename) => {
      createProduct(uniqueFilename)
    })
  } else {
    createProduct(null)
  }
})

// PUT /product/:id - update product (only vendor owner)
router.put('/:id', Utils.authenticateToken, requireVendor, (req, res) => {
  if (!req.body && !req.files) {
    return res.status(400).json({ message: 'Product data cannot be empty' })
  }

  const update = {}
  const fields = ['title', 'category', 'price', 'description', 'active']

  // only copy across fields that were actually sent
  fields.forEach(field => {
    if (req.body[field] !== undefined && req.body[field] !== '') {
      update[field] = req.body[field]
    }
  })

  // Ethical ratings on update:
  // - if none of the eth_* fields are present, leave existing ratings untouched
  // - if any are present, require all 4 to be valid (0–5) and then overwrite
  const ethicalRatings = buildEthicalRatingsFromBody(req.body)
  if (ethicalRatings === 'invalid') {
    return res.status(400).json({
      message:
        'Ethical ratings must be numbers between 0 and 5 when provided.'
    })
  }
  if (ethicalRatings && ethicalRatings !== 'invalid') {
    update.ethicalRatings = ethicalRatings
  }

  const doUpdate = (imageFilename) => {
    if (imageFilename) update.image = imageFilename

    Product.findOneAndUpdate(
      { _id: req.params.id, vendor: req.user._id }, // vendor scoping
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

// DELETE /product/:id - delete product (only vendor owner)
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
