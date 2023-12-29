import * as env from '../config/environment';
import fetch from 'node-fetch';

export async function sendSMS(to, message) {
  const req = await fetch({
    protocol: 'POST',
    url: env.config.sms.posturl,
    headers: {
      Authorization: `Bearer ${env.config.sms.apikey}`,
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      to,
      message,
      bypass_optout: true,
      sender_id: 'Hjemmekorps',
    }),
  });
  if (req.ok) {
    return req.json();
  }
  throw new Error('sending SMS failed');
}
