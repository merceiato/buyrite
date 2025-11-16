require('dotenv').config()
const jwt = require('jsonwebtoken')
let crypto = require('crypto');
const { v4: uuidv4 } = require('uuid')
const path = require('path')

// simple utility class to keep shared helpers tidy
class Utils {

    // create salted password hash --------------------------------
    // format stored: "salt$hash"
    hashPassword(password){
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex');
        return [salt, hash].join('$');
    }

    // compare password to stored hash ----------------------------
    verifyHash(password, original){
        const originalHash = original.split('$')[1];
        const salt = original.split('$')[0];
        const hash = crypto.pbkdf2Sync(password, salt, 2048, 32, 'sha512').toString('hex');
        return hash === originalHash;
    }

    // create JWT for the user ------------------------------------
    // expires in 7 days — simple long-ish session style
    generateAccessToken(user){
        return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d'})
    }

    // middleware for protecting routes ---------------------------
    authenticateToken(req, res, next){
        const authHeader = req.headers['authorization']        
        const token = authHeader && authHeader.split(' ')[1]

        // no token → reject
        if(token == null){
            return res.status(401).json({
                message: "Unauthorised"
            })
        } 
        
        // verify token and pass user payload forward
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if(err) {
                return res.status(401).json({
                    message: "Unauthorised"
                })
            }
            req.user = user
            next()
        })
    }

    // save an uploaded file to disk ------------------------------
    // used for product images
    uploadFile(file, uploadPath, callback){        
        // get extension from original filename
        const fileExt = file.name.split('.').pop()

        // avoid collisions by using uuid
        const uniqueFilename = uuidv4() + '.' + fileExt

        // final location we're saving into
        const uploadPathFull = path.join(uploadPath, uniqueFilename)

        // move file to destination
        file.mv(uploadPathFull, function(err) {
            if(err){
                console.log(err)
                return false
            }
            // callback gives the new file name back to route
            if(typeof callback == 'function'){
                callback(uniqueFilename)
            }
        })
    }
}

// export a single instance
module.exports = new Utils()
