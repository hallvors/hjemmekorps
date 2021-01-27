const env = process.env.NODE_ENV || 'development';
const port = process.env.PORT || 3000;

let envConf = {};
['sanity__token', 'site__tokensecret', 'sanity__dataset'].forEach(varName => {
  if (process.env[varName]) {
    let parts = varName.split('__');
    envConf[parts[0]] = { [parts[1]]: process.env[varName] };
  }
});
const defaultConf = require('./defaults.json');
let runtimeConf = {};
if (env === 'test') {
  runtimeConf = require('./test.json');
} else if (env === 'development') {
  runtimeConf = require('./development.json');
} else {
  runtimeConf = require('./production.json');

}
const overrideConf = require('./overrides.json');

let config = Object.assign({}, defaultConf, runtimeConf, overrideConf, envConf);

module.exports = {
  instruments: require('./instruments.json').instruments,
  name: env,
  test: env === 'test',
  development: env === 'development',
  production: env === 'production',
  port,
  config,
};
