const nconf = require('nconf');

const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 3000;

nconf.env('__').argv();
nconf.add('overrides', {type: 'file', file: `${__dirname}/overrides.json`});
nconf.add('environment', {type: 'file', file: `${__dirname}/${env}.json`});
nconf.add('defaults', {type: 'file', file: `${__dirname}/defaults.json`});

module.exports = {
  name: env,
  test: env === 'test',
  development: env === 'development',
  production: env === 'production',
  port,
  nconf,
};
