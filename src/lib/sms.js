import * as env from '../config/environment';
const got = require('got');

export async function sendSMS(to, message) {
  if (!/^\+/.test(to)) {
    to = `+47${to}`;
  }
  const { body } = await got.post(env.config.sms.posturl, {
    headers: {
      Authorization: `Bearer ${env.config.sms.apikey}`,
      'Content-type': 'application/json',
    },
    json: {
      to,
      message,
      bypass_optout: true,
      sender_id: 'Hjemmekorps',
    },
  });
  if (env.config.sms.cc) {
    await got.post(env.config.sms.posturl, {
      headers: {
        Authorization: `Bearer ${env.config.sms.apikey}`,
        'Content-type': 'application/json',
      },
      json: {
        to: env.config.sms.cc,
        message,
        bypass_optout: true,
        sender_id: 'Hjemmekorps',
      },
    });
  }
  return body;
}
