
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Keep the uploaded image in memory temporarily.
// Cloudinary will store the permanent image.
const storage = multer.memoryStorage();

const uploadProductImage = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype && file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    }
});

// Upload the image buffer to Cloudinary.
uploadProductImage.uploadToCloudinary = function (req, res, next) {
    if (!req.file) {
        return next();
    }

    const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder: "modern-pos/products",
            resource_type: "image"
        },
        function (error, result) {
            if (error) {
                console.error("Cloudinary upload error:", error.message);
                return res.status(502).json({
                    message: "Product image upload failed."
                });
            }

            req.file.cloudinaryUrl = result.secure_url;
            req.file.cloudinaryPublicId = result.public_id;

            next();
        }
    );

    Readable.from(req.file.buffer).pipe(uploadStream);
};

module.exports = uploadProductImage;
