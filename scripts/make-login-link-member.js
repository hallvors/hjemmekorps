const jwt = require('jsonwebtoken');
const env = require('../src/config/environment');
const userId = process.argv[2];
if (!userId) {
	console.error('missing argument: userId');
	process.exit(1);
}
console.log(userId)
const token = jwt.sign({userId}, env.config.site.tokensecret);

console.log('\nLokal utvikling:\n');
console.log(`http://localhost:${env.port}/?t=${token}`);
console.log('\nTesting:\n');
console.log('https://test.hjemmekorps.no/?t=' + token)
console.log('\n\nVirkelig side:\n');
console.log('https://hjemmekorps.no/?t=' + token)
console.log('\n');
