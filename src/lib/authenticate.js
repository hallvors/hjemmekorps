const env = require('../config/environment');
const jwt = require('jsonwebtoken');
const sClient = require('./sanity_client');

function isOkWithoutSession(url) {
  console.log('ok without session check, ' + url);

  const exceptions = [
    '/', // there is some front page content for non-session guests
    /^\/\?rnd=/, // redirecting to random URL after for example log out
    /^\/feil\//, // Error messages are shown without a user session
    /^\/om\//, // A few other pages are shown without a user session too - /om/personvern for example
    '/api/communications/loginlink', // API route for creating login links must be available
    '/lek/treffnoten', // Hit note game has adapted login form
    '/api/logout', // Odd one
  ];

  if (
    exceptions.find(item => {
      if (item instanceof RegExp && item.test(url)) {
        return true;
      }
      if (item === url) {
        return true;
      }
    })
  ) {
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
    let user, projects;
    // admins are authenticated by email
    if (tokenData.email) {
      //console.log('will get data for ' + tokenData.email)
      user = await sClient.getAdminUserDataByContactInfo(tokenData.email);
    } else if (tokenData.userId) {
      [user, projects] = await Promise.all([
        sClient.getUserData(tokenData.userId), // user, user.band
        sClient.getProjectsForUser(tokenData.userId),
      ]);
      user.projects = projects;
    }
    //console.log({user});
    if (!user) {
      if (isOkWithoutSession(req.url)) {
        // avoid redirect loops /feil/* if token is wrong
        return next();
      }
      console.error('go to /feil/nyreg');
      res.statusCode = 302;
      res.setHeader('Location', '/feil/nyreg');
      res.end();
      return;
    }
    // if user, session token should contain ID but not project ID
    token =
      user._type === 'member' && (tokenData.projectId || tokenData.url)
        ? jwt.sign({ userId: user._id }, env.config.site.tokensecret)
        : token;

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
    // If original secret link is for a specific project, redirect
    // token in cookie should grant access when user arrives there
    if (tokenData.projectId && req.url.indexOf('/ta-opp/') === -1) {
      res.statusCode = 302;
      res.setHeader('Location', `/ta-opp/${tokenData.projectId}`);
      res.end();
      return;
    } else if (
      tokenData.url &&
      tokenData.url.indexOf('/') === 0 &&
      req.url.indexOf(tokenData.url) === -1
    ) {
      res.statusCode = 302;
      res.setHeader('Location', tokenData.url);
      res.end();
      return;
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
