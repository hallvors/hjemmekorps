const express = require("express");
const router = express.Router({ mergeParams: true }); // eslint-disable-line

const adminAuth = require("../lib/adminAuth");
const sClient = require("../lib/sanity_client");

router.use(adminAuth);

router.get("/", (req, res, next) => {
	if (req.user) {
		return sClient.getBandsForUser(req.user._id)
		.then(result => res.json(result));
	}
	// should never get here..
	res.status(401);
	res.end();
});

module.exports = router;
