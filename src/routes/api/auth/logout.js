export function get(req, res, next) {
	res.setCookie('token', '', {expires: new Date(0)});
	res.statusCode = 302;
	res.setHeader('Location', '/');
	res.end();
}
