const express = require('express');
const router = express.Router({mergeParams: true}); // eslint-disable-line

router.use('/auth', require('./auth'));
router.use('/projects', require('./projects'));
router.use('/users', require('./users'));
router.use('/bands', require('./bands'));

module.exports = router;
