const env = require('../config/environment');

const jwt = require('jsonwebtoken');

const sClient = require('./sanity_client');

function isOkWithoutSession(url) {
	if (url && /^\/feil\//.test(url)) {
		// Error messages are shown without a user session
		return true;
	}
	if (url && /^\/om\//.test(url)) {
		// A few other pages are shown without a user session too - /om/personvern for example
		return true;
	}
	return false;
}

const authenticate = async function(req, res, next) {
	if (req.url && /^\/client\//.test(req.url)) {
		// Static files from /client are shown without a user session
		return next();
	}

	console.log('authenticate for ' + req.url);
	if (!(req.query.t || req.cookies.token)) {
		console.log('no token in URL or cookie');

		if (isOkWithoutSession(req.url)) {
			return next();
		}
		res.statusCode = 302;
		res.setHeader('Location', '/feil/tilgang');
		res.end();
		return;
	}
	let token = req.query.t || req.cookies.token;
	try {
		let tokenData = jwt.verify(token, env.nconf.get('site:tokensecret'));
		let user;
		// admins are authenticated by email
		if (tokenData.email) {
			console.log('will get data for ' + tokenData.email)
			user = await sClient.getAdminUserData(tokenData.email);
		} else if (tokenData.userId) {
			user = await sClient.getUserData(tokenData.userId); // user, user.band
			user.project = await sClient.getProject(tokenData.userId, tokenData.projectId);
		}
		if (!user) {
			if (isOkWithoutSession(req.url)) { 
				// avoid redirect loops /feil/* if token is wrong
				return next();
			}
			console.error('go to /feil/nyreg')
			res.statusCode = 302;
			res.setHeader('Location', '/feil/nyreg');
			res.end();
			return;
		}
		req.user = user;
		// if token does not exist or is not the value we use for auth now,
		// make a new cookie.
		if (req.query.t && (!req.cookies.token || req.cookies.token !== token)) {
			res.setCookie('token', token);
		}
		return next();
	} catch(e) {
		console.error(e);
		res.statusCode = 302;
		res.setHeader('Location', '/feil/ukjent');
		res.end();
		return;
	}
};

module.exports = authenticate;