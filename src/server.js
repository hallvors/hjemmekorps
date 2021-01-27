import * as env from './config/environment';
import sirv from 'sirv'; // sirv is a fast and basic server for static files
import polka from 'polka'; // polka is a slightly simpler Express-like server module
import compression from 'compression';
import * as sapper from '@sapper/server';

import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'body-parser';

import authenticate from './lib/authenticate'; // code to check if we have a user or admin session
import utils from './lib/utils';
import { getBandsForAdminUser, getProjects } from './lib/sanity_client';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

console.log('---- starting server ----');
console.log({
  PORT,
  NODE_ENV,
  datast: env.nconf.get('sanity:dataset'),
  sec: env.nconf.get('site:tokensecret'),
});

const app = polka();
app
  .use(json(), urlencoded({ extended: false }), cookieParser())
  .use(utils.jsonSender, utils.parseUrl, utils.setCookie) // Some stuff Express does by default.
  //.use('/', authenticate) // set req.user if cookie or URL token exists, redirects to error message otherwise
  .use(
    compression({ threshold: 0 }), // enable gzip compression of transferred data
    sirv('static', { dev }), // serve files in "static" dir (in root) as-is
    authenticate,
    sapper.middleware({
      // enable Sapper - Svelte's server-side rendering lib
      session: async (req, res) => {
        // this adds session data to the page
        // data will be available to routes that do export let session
        let bands = [];
        let projects = [];
        if (req.user && req.user._type === 'adminUser') {
          // admin is loading this page, list bands and projects
          bands = await getBandsForAdminUser(req.user._id);
          projects = await getProjects(req.user._id);
        } else if (req.user) {
          // this a regular, non-admin user
          projects = [req.user.project];
          bands = [req.user.band];
        }
        return {
          user: req.user,
          bands,
          projects,
          instruments: env.instruments,
        };
      },
    })
  )
  .listen(PORT, err => {
    if (err) console.log('error', err);
  });

module.exports = app;
