const env = require('../config/environment');

const jwt = require('jsonwebtoken');

const sClient = require('./sanity_client');

const authenticate = async function(req, res, next) {
	if (req.url && /^\/client\//.test(req.url)) {
		// Static files from /client are shown without a user session
		return next();
	}

	if (req.url && /^\/feil\//.test(req.url)) {
		// Error messages are shown without a user session
		return next();
	}
	if (req.url && /^\/om\//.test(req.url)) {
		// A few other pages are shown without a user session too - /om/personvern for example
		return next();
	}

	console.log('authenticate for ' + req.url);
	if (!(req.query.t || req.cookies.token)) {
		console.log('no token in URL or cookie')
		res.statusCode = 302;
		res.setHeader('Location', '/feil/tilgang');
		res.end();
		return;
	}
	let token = req.query.t || req.cookies.token;
	try {
		let tokenData = jwt.verify(token, env.nconf.get('site:tokensecret'));
		let user, data;
		// admins are authenticated by email
		if (tokenData.email) {
			console.log('will get data for ' + tokenData.email)
			data = await sClient.getAdminUserData(tokenData.email);
			user = data[0];
		} else if (tokenData.userId) {
			data = await sClient.getUserData(tokenData.userId);
			user = data[0];
			user.project = await sClient.getProject(tokenData.userId, tokenData.projectId);
		}
		if (!(data && data.length === 1)) {
			res.statusCode = 302;
			res.setHeader('Location', '/feil/nyreg');
			return;
		}
		req.user = user;
		if (req.query.t && !req.cookies.token) {
			res.cookie('token', token);
		}
		return next();
	} catch(e) {
		res.setHeader('Location', '/feil/ukjent');
		return;
	}
};

module.exports = authenticate;