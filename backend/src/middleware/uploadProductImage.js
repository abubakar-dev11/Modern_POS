const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(
            null,
            path.join(
                __dirname,
                "../../uploads/products"
            )
        );
    },

    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

const uploadProductImage = multer({
    storage: storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(
                new Error("Only image files are allowed")
            );
        }
    }
});

module.exports = uploadProductImage;