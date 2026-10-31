const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

const uploadBusinessLogo = multer({
    storage,
    limits: {
        fileSize: 2 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Logo must be JPG, PNG, or WEBP."));
        }
    }
});

uploadBusinessLogo.uploadToCloudinary = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            message: "Please select a logo image."
        });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder: "modern-pos/business-logos",
            resource_type: "image"
        },
        (error, result) => {
            if (error) {
                console.error("Business logo upload error:", error.message);

                return res.status(502).json({
                    message: "Business logo upload failed."
                });
            }

            req.file.cloudinaryUrl = result.secure_url;
            req.file.cloudinaryPublicId = result.public_id;

            next();
        }
    );

    Readable.from(req.file.buffer).pipe(uploadStream);
};

module.exports = uploadBusinessLogo;