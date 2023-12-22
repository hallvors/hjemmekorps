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
  let user, users, link, token;
  if (!req.user) {
    const email = req.body.email;
    console.log('get admin by email ' + email);
    user = await sClient.getAdminUserDataByEmail(email);
    console.log('admin user', user);
    const url =
      req.body.url && /^\//.test(req.body.url) ? req.body.url : undefined;
    if (user && user.name) {
      users = [user];
    } else {
      console.log('get users by email ' + email);
      users = await sClient.getUsersByEmail(email);
      console.log('user users', users);
      if (users && users.length) {
        console.log('found users', users.length);
      } else {
        // do not reveal valid email addresses by timing detection
        setTimeout(function () {
          res.json({ status: 'ok' });
        }, Math.ceil(Math.random() * 150));
        return;
      }
    }
    // if we're querying by the email of a parent with several children,
    // we have to send one email per child..
    for (let i = 0; i < users.length; i++) {
      token =
        users[i]._type === 'adminUser'
          ? sign({ email: users[i].email }, env.config.site.tokensecret)
          : sign({ userId: users[i]._id, url }, env.config.site.tokensecret);
          link = `https://${env.hostname}/?t=${token}`;
          let data = {
            link,
            hostname: env.hostname,
            user: users[i],
          };
          console.log('compiling text with ', data);
          let templatePlain = Handlebars.compile(templateText);
          let templateRich = Handlebars.compile(templateHTML);
          let result = await send(
            String(users[i].email),
            { name: 'Admin' },
            'Innlogging til ' + env.hostname + ' for ' + users[i].name,
            templatePlain(data),
            templateRich(data)
          );
          console.log(result);
    }

    res.json({ status: 'ok' });
  }
  // should never get here..
  res.statusCode = 401;
  res.end();
}
