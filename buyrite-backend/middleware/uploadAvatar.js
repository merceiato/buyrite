const multer = require('multer')
const path = require('path')
const fs = require('fs')

// ensure upload folder exists
const uploadDir = path.join(__dirname, '..', 'public', 'images')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// store file in memory before processing
const storage = multer.memoryStorage()

// allow only image uploads
const fileFilter = (req, file, cb) => {
  file.mimetype.startsWith('image/')
    ? cb(null, true)
    : cb(new Error('Only image files are allowed'), false)
}

// configure multer
const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('avatar')

module.exports = uploadAvatar
