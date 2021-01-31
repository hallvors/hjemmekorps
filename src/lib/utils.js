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
    console.log('will set c ' + name);
    let exp =
      options && options.expires
        ? '; Expires=' + options.expires.toGMTString()
        : '';
    res.setHeader(
      'Set-Cookie',
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}${exp}`
    );
  };
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

module.exports = {
  jsonSender,
  parseUrl,
  setCookie,
  filterInstrumentName,
  getRandomInt,
};
