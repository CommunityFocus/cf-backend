const { Router } = require("express");
const router = Router();
const { slugHandler } = require("../controllers/apiController");

router.get('/getSlug', slugHandler);

module.exports = router;