// Basic multer setup for handling avatar uploads.
// Kept small on purpose – just checks it's an image and not too big.
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// make sure the images folder exists so multer/sharp don't explode later
const uploadDir = path.join(__dirname, '..', 'public', 'images')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// use memoryStorage because sharp will work with the buffer
const storage = multer.memoryStorage()

// very simple filter so we only accept image mime types
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed'), false)
  }
}

// single file upload under the "avatar" field name
const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max for profile pics
  }
}).single('avatar')

module.exports = uploadAvatar
