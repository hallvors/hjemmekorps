const jwt = require('jsonwebtoken');
const env = require('../src/config/environment');
const userId = process.argv[2];
const url = process.argv[3] || undefined;
if (!userId) {
	console.error('missing argument: userId');
	process.exit(1);
}
console.log('creating login link for ' + userId)

const token = jwt.sign({userId, url}, env.config.site.tokensecret);

console.log('\nLokal utvikling:\n');
console.log(`http://localhost:${env.port}/?t=${token}`);
console.log('\nTesting:\n');
console.log('https://hjemmekorps-staging.herokuapp.com/?t=' + token)
console.log('\n\nVirkelig side:\n');
console.log('https://hjemmekorps.no/?t=' + token)
console.log('\n');
