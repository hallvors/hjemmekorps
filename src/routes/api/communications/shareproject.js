import Handlebars from 'handlebars';
import sClient from '../../../lib/sanity_client';
import { send } from '../../../lib/mail';
import * as fs from 'fs';
import { join } from 'path';
import * as env from '../../../config/environment';

const templateText = fs.readFileSync(
  join('src', 'templates', 'mail', 'share_project.hbs.txt'),
  { encoding: 'utf8', flag: 'r' }
);
const templateHTML = fs.readFileSync(
  join('src', 'templates', 'mail', 'share_project.hbs.html'),
  { encoding: 'utf8', flag: 'r' }
);

export async function post(req, res, next) {
  if (req.user && req.user._type === 'adminUser') {
    // we allow sending email about a project - req.body.projectId - to
    // all known emails associated with the members assigned parts in this
    // project.
    console.log(req.body)
    const project = await sClient.getProject(req.user._id, req.body.projectId);
    const recipients = [];
    for (let i = 0; i < project.partslist.length; i++) {
      let part = project.partslist[i];
      for (let j = 0; j < part.members.length; j++) {
        let token = part.members[j].token;
        let member = await sClient.getUserData(part.members[j]._ref);
        recipients.push({
          to: member.email,
          name: member.name,
          token,
        });
      }
    }
    // req.body.message + blurb personalized to every receipient here
    let extraData = {
      friendly_name: req.user.friendly_name,
      project_name: project.name,
      message: req.body.message,
      hostname: env.hostname,
    };
    let templatePlain = Handlebars.compile(templateText);
    let templateRich = Handlebars.compile(templateHTML);
    let results = await Promise.all(
      recipients.map(recipient => {
        return send(
          recipient.to,
          req.user,
          'Nye noter: ' + project.name,
          templatePlain(Object.assign(recipient, extraData)),
          templateRich(Object.assign(recipient, extraData))
        );
      })
    );
    console.log(results);
    res.json({ results });
  }
  // should never get here..
  res.statusCode = 401;
  res.end();
}
