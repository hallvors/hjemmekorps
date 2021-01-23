const nconf = require('nconf');

const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 5000;

nconf.env('__').argv();
nconf.overrides(require('./overrides.json'));
if (env === 'development') {
	nconf.env(require('./development.json'));
} else {
	nconf.env(require('./production.json'));

}

nconf.defaults(require('./defaults.json'));

module.exports = {
  instruments: require('./instruments.json').instruments,
  icons: require('./instrument-icons.json').icons,
  name: env,
  test: env === 'test',
  development: env === 'development',
  production: env === 'production',
  port,
  nconf,
};
