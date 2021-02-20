import Handlebars from 'handlebars';
import sClient from '../../../lib/sanity_client';
import { send } from '../../../lib/mail';
import * as fs from 'fs';
import { join } from 'path';
import * as env from '../../../config/environment';
import { sign } from 'jsonwebtoken';

const templateText = fs.readFileSync(
  join('src', 'templates', 'mail', 'login_link.hbs.txt'),
  { encoding: 'utf8', flag: 'r' }
);
const templateHTML = fs.readFileSync(
  join('src', 'templates', 'mail', 'login_link.hbs.html'),
  { encoding: 'utf8', flag: 'r' }
);

export async function post(req, res, next) {
  if (!req.user) {
    const email = req.body.email;
    const user = await sClient.getAdminUserData(email);
    if (!user) {
      // do not reveal valid admin email addresses by timing detection
      setTimeout(function () {
        req.json({ status: 'ok' });
      }, 450);
      return;
    }
    
    const token = sign({ email }, env.config.site.tokensecret);
    const link = `https://${env.domain}/?t=${token}`;
    let data = {
      link,
      domain: env.domain,
      user,
    };
    let templatePlain = Handlebars.compile(templateText);
    let templateRich = Handlebars.compile(templateHTML);
    let result = await send(
      user.email,
      { name: 'Admin' },
      'Innlogging til ' + env.domain,
      templatePlain(data),
      templateRich(data)
    );
    console.log(result);
    res.json({ result });
  }
  // should never get here..
  res.statusCode = 401;
  res.end();
}
