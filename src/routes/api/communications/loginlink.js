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
  let user, link, token;
  if (!req.user) {
    const email = req.body.email;
    console.log('get admin by email ' + email)
    user = await sClient.getAdminUserDataByEmail(email);
    console.log('admin user', user)
    const url = req.body.url && /^\//.test(req.body.url) ? req.body.url : undefined;
    if (user && user.name) {
      token = sign({ email, url }, env.config.site.tokensecret);
    } else {
      console.log('get user by email ' + email)
      user = await sClient.getUserByEmail(email);
      console.log('user user', user)
      if (user && user.name) {
        console.log('found user', user)
        // login link requested by a band member, not admin
        token = sign({ userId: user._id, url }, env.config.site.tokensecret);
      } else {
        // do not reveal valid email addresses by timing detection
        setTimeout(function () {
          res.json({ status: 'ok' });
        }, 450);
        return;
      }
    }

    link = `https://${env.hostname}/?t=${token}`;
    let data = {
      link,
      hostname: env.hostname,
      user,
    };
    console.log('compiling text with ', data)
    let templatePlain = Handlebars.compile(templateText);
    let templateRich = Handlebars.compile(templateHTML);
    let result = await send(
      user.email,
      { name: 'Admin' },
      'Innlogging til ' + env.hostname,
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
