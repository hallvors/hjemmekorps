const mailgun = require('mailgun-js');

const env = require('../config/environment');
const DOMAIN = 'hjemmekorps.no';
const KEY = env.config.mailgun.apikey;

const mg = mailgun({ apiKey: KEY, domain: DOMAIN, testMode: !env.production });

export async function send(to, subject, text) {
  const data = {
    from: 'ikkesvar@hjemmekorps.no',
    to,
    subject,
    text,
  };
  return new Promise((resolve, reject) => {
      mg.messages().send(data, function (error, body) {
          if (error) {
              reject(error);
          }
        resolve(body);
      });
  });
}
