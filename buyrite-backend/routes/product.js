const express = require('express')
const router = express.Router()
const path = require('path')

const Utils = require('./../utils')
const Product = require('./../models/Product')
const User = require('./../models/User')

// helper: must be vendor (check against DB for safety)
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

      // console.log('requireVendor user:', user.accessLevel) // <- optional debug

      // Force numeric comparison
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

// GET /product - public list for consumer interface
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

  const createProduct = (imageFilename) => {
    const productData = {
      vendor: req.user._id,
      title: req.body.title,
      category: req.body.category,
      price: req.body.price,
      description: req.body.description
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

// PUT /product/:id - update product (only vendor owner)
router.put('/:id', Utils.authenticateToken, requireVendor, (req, res) => {
  if (!req.body && !req.files) {
    return res.status(400).json({ message: 'Product data cannot be empty' })
  }

  const update = {}
  const fields = ['title', 'category', 'price', 'description', 'active']

  fields.forEach(field => {
    if (req.body[field] !== undefined && req.body[field] !== '') {
      update[field] = req.body[field]
    }
  })

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
