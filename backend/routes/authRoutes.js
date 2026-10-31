const express = require("express");
const router = express.Router();

const {
    setupAdmin,
    registerBusiness,
    login,
    unifiedLogin

} = require("../src/controllers/authController");

router.post("/setup-admin", setupAdmin);
router.post("/register-business", registerBusiness);
router.post("/login", login);
router.post("/unified-login", unifiedLogin);
module.exports = router;
