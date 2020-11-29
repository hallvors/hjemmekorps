const express = require("express");
const router = express.Router({ mergeParams: true }); // eslint-disable-line

const adminAuth = require("../lib/adminAuth");

router.get('/login', adminAuth, (req, res, next) => {
	if (req.user) {
		return res.redirect('/');
	}
	return res.status(401);
});

router.post('/logout', (req, res, next) => {
	res.cookie('token', '', {expires: new Date(0)});
	res.json({status: 'logged out'});
});

module.exports = router;
