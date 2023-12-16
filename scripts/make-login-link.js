const jwt = require('jsonwebtoken');
const env = require('../src/config/environment');
const email = process.argv[2];
if (!email) {
	console.error('missing argument: email');
	process.exit(1);
}
console.log(email)
const token = jwt.sign({email}, env.config.site.tokensecret);

console.log('\nLokal utvikling:\n');
console.log(`http://localhost:${env.port}/?t=${token}`);
console.log('\nTesting:\n');
console.log('https://hjemmekorps-staging.herokuapp.com/?t=' + token)
console.log('\n\nVirkelig side:\n');
console.log('https://hjemmekorps.no/?t=' + token)
console.log('\n');
