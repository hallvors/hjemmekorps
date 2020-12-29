export function post(req, res, next) {
	res.cookie('token', '', {expires: new Date(0)});
	res.json({status: 'logged out'});
}
