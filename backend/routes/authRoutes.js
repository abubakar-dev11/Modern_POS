const express = require("express");
const router = express.Router();

const {
    setupAdmin,
    registerBusiness,
    login
} = require("../src/controllers/authController");

router.post("/setup-admin", setupAdmin);
router.post("/register-business", registerBusiness);
router.post("/login", login);

module.exports = router;
