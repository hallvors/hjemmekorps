import sClient from '../../lib/sanity_client';

export async function get(req, res, next) {
	if (req.user && req.user._type === 'adminUser') {
		return sClient.getBandsForAdminUser(req.user._id)
		.then(result => res.json(result));
	}
	// should never get here..
	res.statusCode = 401;
	res.end();
}
