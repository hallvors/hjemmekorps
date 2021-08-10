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
  hostname: env.hostname,
  envname: env.name,
  dev,
  PORT,
  NODE_ENV,
  sanity: env.config.sanity.dataset,
});

const app = polka();
app
  .use((req, res, next) => {
    req.locals = { env };
    next();
  })
  .use(
    json({ limit: '25MB' }),
    urlencoded({ extended: false, limit: '25MB' }),
    cookieParser()
  )
  .use(utils.jsonSender, utils.parseUrl, utils.setCookie) // Some stuff Express does by default.
  .use(utils.ensureHttps) // redirect to https if http
  .use(
    compression({ threshold: 0 }), // enable gzip compression of transferred data
    sirv('static', { dev }), // serve files in "static" dir (in root) as-is
    authenticate,
    sapper.middleware({
      // scaffold session data
      session: async (req, res) => {
        // data will be available to routes that use a preload() method
        let bands = [];
        let projectList = [];
        if (req.user && req.user._type === 'adminUser') {
          // admin is loading this page, list bands and projects
          // bands includes band.members - full member info
          // projects include recordings and partlist[].members[].token
          // for secret links
          bands = await getBandsForAdminUser(req.user._id);
          projectList = await getProjects(req.user._id);
        } else if (req.user) {
          // this a regular, non-admin user
          projectList = [req.user.project];
          bands = [req.user.band];
        }
        return {
          user: req.user,
          bands,
          projectList, // holds a list of id, title
          instruments: env.instruments,
          hostname: env.hostname,
          protocol: dev ? 'http' : 'https',
        };
      },
    })
  )
  .listen(PORT, err => {
    if (err) {
      console.log('error', err);
      env.logServerSideError(err.message || err, err.stack || '');
    }
  });

module.exports = app;
