const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const email = process.argv[2];
if (!email) {
	console.error('missing argument: email');
	process.exit(1);
}
console.log(email)
const token = jwt.sign({email}, env.nconf.get('site:tokensecret'));

console.log('\n');
console.log('(KOMMER!) https://hjemmekorps.herokuapp.com/api/auth/login?t=' + token)
console.log('\n\n');
console.log(`http://localhost:${env.port}/api/auth/login?t=${token}`);
console.log('\n');
