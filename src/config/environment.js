const nconf = require('nconf');

const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 3000;

nconf.env('__').argv();
nconf.add('overrides', {type: 'file', file: './overrides.json'});
if (env === 'development') {
	nconf.add('environment', {type: 'file', file: './development.json'});
} else {
	nconf.add('environment', {type: 'file', file: './production.json'});
}

nconf.add('defaults', {type: 'file', file: './defaults.json'});

module.exports = {
  instruments: require('./instruments.json').instruments,
  name: env,
  test: env === 'test',
  development: env === 'development',
  production: env === 'production',
  port,
  nconf,
};
