const env = require('../config/environment');

const jwt = require('jsonwebtoken');

const sClient = require('./sanity_client');

const adminAuth = async function(req, res, next) {
	if (!(req.query.t || req.cookies.token)) {
		return res.redirect(302, '/feil/tilgang');
	}
	let token = req.query.t || req.cookies.token;
	try {
		let tokenData = jwt.verify(token, env.nconf.get('site:tokensecret'));
		let data = await sClient.getAdminUserData(tokenData.email);
		if (!(data && data.length === 1)) {
			return res.redirect(302, '/feil/nyreg');
		}
		req.user = data[0];
		if (req.query.t && !req.cookies.token) {
			res.cookie('token', token);
		}
		return next();
	} catch(e) {
		return res.redirect(302, '/feil/ukjent');
	}
};

module.exports = adminAuth;