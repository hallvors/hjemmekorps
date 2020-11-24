const express = require('express');
const router = express.Router({mergeParams: true}); // eslint-disable-line

router.use('/projects', require('./projects'));
router.use('/auth', require('./auth'));

module.exports = router;
