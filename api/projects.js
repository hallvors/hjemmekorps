const express = require('express');
const router = express.Router({mergeParams: true}); // eslint-disable-line
const adminAuth = require('../lib/adminAuth');
const sClient = require('../lib/sanity_client');

router.use(adminAuth);

router.get('/projects', (req, res, next) => {
	return sClient.getProjects(req.user._id)
	.then(projects => {
		res.json(projects);
	})
});

module.exports = router;
