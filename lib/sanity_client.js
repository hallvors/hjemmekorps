const sanity = require("@sanity/client");
const fs = require("fs");
const env = require("../config/environment");
const NodeCache = require('node-cache');
const sanityCache = new NodeCache({ stdTTL: 60 * 60 * 24 * 7, useClones: true });

const PROJECT = env.nconf.get("sanity:project");
const TOKEN = env.nconf.get("sanity:token") || process.env.SANITY_TOKEN;
const DATASET = env.nconf.get("sanity:dataset");


var sanityClient = null;
function getSanityClient() {
	if (!sanityClient) {
		sanityClient = sanity({
			projectId: PROJECT,
			dataset: DATASET,
			token: TOKEN,
			useCdn: false,
			ignoreBrowserTokenWarning: DATASET === "test",
		});
	}
	return sanityClient;
}

function getAdminUserData(email) {
	// we want admin user data for nearly all API requests. Cache it..
	if (sanityCache.has(email)) {
		return Promise.resolve(sanityCache.get(email));
	}
	return getSanityClient().fetch(`*[_type == $type && email == $email && !(_id in path("drafts.**"))]{
		name, email, friendly_name, phone, portrait, _id, "portraitUrl": portrait.asset->url
	}`, {
		type: "adminUser",
		email,
	})
	.then(userData => {
		sanityCache.set(email, userData);
		return userData;
	});
}

function getBandsForUser(userId) {
	return getSanityClient().fetch(`*[_type == $type && references($userId) && !(_id in path("drafts.**"))]{
		..., "logoUrl": logo.asset->url,
		"palette": logo.asset->metadata.palette
	}`,
		{type: 'band', userId}
	);
}

function getProjects(userId) {
	return getSanityClient().fetch(
		`*[_type == $type && owner._ref == $userId && !(_id in path("drafts.**"))] {
			name, _id, sheetmusic,
			"sheetmusicFile": sheetmusic.asset->url,
			"members": members[]->{
				..., "portraitUrl": portrait.asset->url
			}
		}`,
		{
			type: "project",
			userId,
		}
	);
}

function addProject(userId, name, mxmlFile) {
	const client = getSanityClient();
	return client.assets
		.upload("file", mxmlFile.buffer, { filename: mxmlFile.originalname })
		.then((filedoc) => {
			return getSanityClient().create({
				_type: "project",
				owner: { _ref: userId },
				name,
				sheetmusic: filedoc._id,
			});
		});
}

function ensureMembersExist(userId, bandName, members) {
	const client = getSanityClient();
	return client
		.fetch(`*[_type == $type && name == $name && references($uid)]`, {
			type: "band",
			name: bandName,
			uid: userId,
		})
		.then((band) => {
			return Promise.all(
				members.map((member) => {
					return client
						.fetch(
							"*[_type == $type && name == $name && references($bandid)]",
							{ type: "member", name: member, bandid: band._id }
						)
						.then((result) => {
							if (!result) {
								return client.create({
									_type: "member",
									band: band._id,
									name: member,
								});
							}
						});
				})
			);
		});
}

// OLD code

function getProject(name) {
	return getSanityClient()
		.fetch(
			`
		*[_type == $type && name == $name] {
			_id,
			name,
			helprecording{asset->{url, _id}},
			images[]{asset->{url, "preview": metadata.lqip}}
		}`,
			{
				type: "project",
				name,
			}
		)
		.then((result) => result[0]);
}

function addHelpRecording(projectName, filepath) {
	const cl = getSanityClient();
	return getProject(projectName).then((project) => {
		return cl.assets
			.upload("file", fs.createReadStream(filepath))
			.then((doc) => {
				return cl
					.patch(project._id)
					.set({
						helprecording: {
							_type: "file",
							asset: {
								_type: "reference",
								_ref: doc._id,
							},
						},
					})
					.commit();
			});
	});
}

function removeHelpRecording(projectName, fileId) {
	const cl = getSanityClient();
	return getProject(projectName).then((project) => {
		return cl
			.transaction()
			.patch(cl.patch(project._id).unset(["helprecording"]))
			.delete(fileId)
			.commit();
	});
}

function addImage(projectName, filepath) {
	const cl = getSanityClient();
	return getProject(projectName).then((project) => {
		return cl.assets
			.upload("image", fs.createReadStream(filepath))
			.then((doc) => {
				return cl
					.patch(project._id)
					.setIfMissing({ images: [] })
					.append("images", [
						{
							_type: "image",
							asset: {
								_type: "reference",
								_ref: doc._id,
							},
						},
					])
					.commit();
			});
	});
}

function addRecording(projectName, pupil, meta, filepath) {
	const cl = getSanityClient();
	return getProject(projectName).then((project) => {
		return cl.assets
			.upload("file", fs.createReadStream(filepath), {
				filename: pupil + "-opptak.mp3",
			})
			.then((doc) => {
				return cl.create({
					_type: "recording",
					pupil,
					project: {
						_ref: project._id,
					},
					recording: {
						_type: "file",
						asset: {
							_type: "reference",
							_ref: doc._id,
						},
					},
					meta,
				});
			});
	});
}

function getRecordings(projectName) {
	return getProject(projectName).then((project) => {
		return getSanityClient().fetch(
			`*[
			_type == $type && project._ref == $projectId
		] {_id, _createdAt, pupil, meta, "url": recording.asset->url}`,
			{
				type: "recording",
				projectId: project._id,
			}
		);
	});
}

module.exports = {
	getSanityClient,
	getAdminUserData,
	getBandsForUser,
	getProjects,


	getProject,
	addProject,
	addHelpRecording,
	removeHelpRecording,
	addRecording,
	addImage,
	getRecordings,
};
