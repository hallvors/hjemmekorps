
function jsonSender(req, res, next) {
	res.json = data => {
		res.setHeader('Content-type', 'application/json');
		if (typeof data === 'string') {
			res.write(data);
		} else {
			res.write(JSON.stringify(data));
		}
		res.end();
	};
	next();
}

function parseUrl(req, res, next) {
	req.location = new URL(req.url, `${req.protocol || 'http'}://${req.headers.host}`);
	//console.log('location', req.location)
	next();
}

module.exports = {jsonSender, parseUrl};
