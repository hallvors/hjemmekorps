import * as env from '../config/environment';
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mgObj = new Mailgun(formData);

const KEY = env.config.mailgun.apikey;

const mg = mgObj.client({
  username: 'api',
  key: KEY,
  url: 'https://api.eu.mailgun.net',
});

export async function send(to, user, subject, text, html) {
  console.log({to, subject})
  const data = {
    from: `"${user.name} via ${env.hostname}" <ikkesvar@${env.hostname}>`,
    to,
    subject,
    text,
    html,
   // 'o:testmode': env.development ? 'yes' : 'no',
  };
  
  return mg.messages.create('kom.hjemmekorps.no', data);
}
