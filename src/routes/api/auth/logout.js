export function get(req, res, next) {
	res.setCookie('token', '', {path: '/', expires: new Date(0)});
	res.statusCode = 302;
	res.setHeader('Location', '/?rnd=' + Math.random());
	res.end();
}
