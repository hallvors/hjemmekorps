import * as env from '../config/environment';
const got = require('got');

export async function sendSMS(to, message) {
  const {data} = await got.post(env.config.sms.posturl, {
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
  }).json();
  return data;
}
