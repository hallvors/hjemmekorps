export function post(req, res, next) {
	res.setCookie('token', '', {expires: new Date(0)});
	res.json({status: 'logged out'});
}
