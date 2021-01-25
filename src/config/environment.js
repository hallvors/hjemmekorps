const nconf = require('nconf');

const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 3000;

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
  name: env,
  test: env === 'test',
  development: env === 'development',
  production: env === 'production',
  port,
  nconf,
};
