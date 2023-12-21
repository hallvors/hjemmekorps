function jsonSender(req, res, next) {
  res.json = data => {
    res.setHeader('Content-type', 'application/json');
    if (typeof data === 'string') {
      res.write(data);
    } else {
      res.write(JSON.stringify(data));
    }
    res.end();
  };
  next();
}

function parseUrl(req, res, next) {
  req.location = new URL(
    req.url,
    `${req.protocol || 'http'}://${req.headers.host}`
  );
  //console.log('location', req.location)
  next();
}

function setCookie(req, res, next) {
  res.setCookie = function (name, value, options) {
    const cookieOpts = ['SameSite=Strict'];
    if (options && options.expires) {
      cookieOpts.push('Expires=' + options.expires.toGMTString());
    }
    if (options && options.path) {
      cookieOpts.push('Path=' + options.path);
    }
    let optsString = '';
    if (cookieOpts.length) {
      optsString = '; ' + cookieOpts.join('; ');
    }
    res.setHeader(
      'Set-Cookie',
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}${optsString}`
    );
  };

  next();
}

function ensureHttps(req, res, next) {
  let url = req.location.origin + req.url;
  if (req.headers['x-forwarded-proto'] !== 'https') {
    // do not redirect localhost to https
    if (req.location.origin.match(/(127\.0\.0\.1|localhost)/)) {
      return next();
    }
    if (!req.locals.env.development) {
      if (url.indexOf('.well-known/acme-challenge') === -1) {
        url = url.replace(/^http:/, 'https:');
        res.statusCode = 302;
        res.setHeader('Location', url);
        res.end();
        return;
      }
    }
  }
  next();
}

function filterInstrumentName(someName, instrumentList) {
  let instrumentFromList = instrumentList.find(instrument => {
    return someName.toLowerCase().indexOf(instrument.value) > -1;
  });
  if (instrumentFromList) {
    return instrumentFromList.value;
  }
}

function getRandomInt(min, max) {
  return parseInt(Math.random() * (max - min) + min);
}

function rectsOverlap(rect1, rect2) {
  if (rect1.x + rect1.width < rect2.x || rect2.x + rect2.width < rect1.x) {
    return false;
  }
  if (rect1.y + rect1.height < rect2.y || rect2.y + rect2.height < rect1.y) {
    return false;
  }

  return true;
}

function getEvtX(evt, touchIdentifier) {
  if (evt.clientX) {
    return evt.clientX;
  }
  if (evt.touches) {
    const touch = touchIdentifier
      ? evt.touches.find(touch => (touch.identifier = touchIdentifier))
      : evt.touches[0];
    if (touch) {
      return touch.clientX;
    }
  }
}

function getEvtY(evt, touchIdentifier) {
  if (evt.clientY) {
    return evt.clientY;
  }
  if (evt.touches) {
    const touch = touchIdentifier
      ? evt.touches.find(touch => (touch.identifier = touchIdentifier))
      : evt.touches[0];
    if (touch) {
      return touch.clientY;
    }
  }
}

module.exports = {
  jsonSender,
  parseUrl,
  setCookie,
  ensureHttps,
  filterInstrumentName,
  getRandomInt,
  rectsOverlap,
  getEvtX,
  getEvtY,
};
