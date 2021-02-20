import Handlebars from "handlebars";
import sClient from '../../../lib/sanity_client';
import {send} from '../../../lib/mail';

export async function post(req, res, next) {
	if (req.user && req.user._type === 'adminUser') {
		// we allow sending email about a project - req.body.projectId - to
		// all known emails associated with the members assigned parts in this
		// project.
		const project = await sClient.getProject(req.user._id, req.body.projectId);
		const recipients = [];
		for (let i = 0; i < project.partslist.length; i++ ){
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
		await Promise.all(recipients.map(recipient => {
			send(recipient.to, '')
		}));
	}
	// should never get here..
	res.statusCode = 401;
	res.end();
}

