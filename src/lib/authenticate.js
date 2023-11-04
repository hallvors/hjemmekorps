const env = require('../config/environment');
const jwt = require('jsonwebtoken');
const sClient = require('./sanity_client');

function isOkWithoutSession(url) {
  if (url && /^\/feil\//.test(url)) {
    // Error messages are shown without a user session
    return true;
  }
  if (url && /^\/om\//.test(url)) {
    // A few other pages are shown without a user session too - /om/personvern for example
    return true;
  }
  if (
    url === '/' ||
	url.indexOf('/?rnd') === 0 ||
    url === '/api/communications/loginlink' ||
    url === '/api/logout'
  ) {
    // there is some front page content for non-session guests
    // also API route for creating login links must be available
    return true;
  }
  return false;
}

const authenticate = async function (req, res, next) {
  if (req.url && /^\/client\//.test(req.url)) {
    // Static files from /client are shown without a user session
    return next();
  }
  if (!(req.query.t || req.cookies.token)) {
    console.log('no token in URL or cookie, ', req.url);

    if (isOkWithoutSession(req.url)) {
      return next();
    }
    res.statusCode = 302;
    res.setHeader('Location', '/feil/tilgang');
    res.end();
    return;
  }
  let token = req.query.t || req.cookies.token;
  try {
    let tokenData = jwt.verify(token, env.config.site.tokensecret);
    let user;
    // admins are authenticated by email
    if (tokenData.email) {
      //console.log('will get data for ' + tokenData.email)
      user = await sClient.getAdminUserDataByEmail(tokenData.email);
    } else if (tokenData.userId) {
      user = await sClient.getUserData(tokenData.userId); // user, user.band
      user.project = await sClient.getProject(
        tokenData.userId,
        tokenData.projectId
      );
    }
    //console.log({user});
    if (!user) {
      if (isOkWithoutSession(req.url)) {
        // avoid redirect loops /feil/* if token is wrong
        // TODO: what if we are on / with a ?t= URL?
        return next();
      }
      console.error('go to /feil/nyreg');
      res.statusCode = 302;
      res.setHeader('Location', '/feil/nyreg');
      res.end();
      return;
    }
    user.token = token;
    req.user = user;
    // if token does not exist or is not the value we use for auth now,
    // make a new cookie.
    if (
      req.query.t &&
      (!req.cookies.token || req.cookies.token !== token) &&
      req.url.indexOf('/api/logout') === -1
    ) {
      res.setCookie('token', token);
    }
    return next();
  } catch (e) {
    console.error(e);
    res.statusCode = 302;
    res.setHeader('Location', '/feil/ukjent');
    res.end();
    return;
  }
};

module.exports = authenticate;
