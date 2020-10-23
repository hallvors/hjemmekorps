// feil/tilgang:
//			message: 'Ingen tilgang. Bruk tilsendt passord-lenke på nytt.'
// feil/nyreg:
//				message: 'Ingen tilgang. Du må be om å bli registrert på nytt.'
// feil/ukjent
//			 ' Eventuelt kan du prøve å starte nettleseren på nytt og klikke lenka en gang til.' +


const adminAuth = async function(req, res, next) {
	if (!(req.query.t || req.cookies.token)) {
		return res.redirect('feil/tilgang');
	}
	let token = req.query.t || req.cookies.token;
	try {
		let tokenData = jwt.verify(token, process.env.TOKENSECRET);
		let data = await sClient.getAdminUserData(tokenData.email);
		if (!(data && data.length === 1)) {
			return res.render('feil/nyreg');
		}
		req.user = data[0];
		if (req.query.t && !req.cookies.token) {
			res.cookie('token', token);
		}
		next();
	} catch(e) {
		return res.render('feil/ukjent');
	}
};

module.exports = adminAuth;