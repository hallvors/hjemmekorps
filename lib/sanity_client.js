const sanity = require('@sanity/client');
const fs = require('fs');
const env = require('../config/environment');
const PROJECT = env.nconf.get('sanity:project');
const TOKEN =  env.nconf.get('sanity:token') || process.env.SANITY_TOKEN;
const DATASET = env.nconf.get('sanity:dataset') ;

var sanityClient = null;
function getSanityClient() {
	if (!sanityClient) {
		sanityClient = sanity({
			projectId: PROJECT,
			dataset: DATASET,
			token: TOKEN,
			useCdn: false,
			ignoreBrowserTokenWarning: DATASET === 'test',
		});
	}
	return sanityClient;
}


function getProjects(userId) {
	return getSanityClient().fetch('*[_type == $type && owner._ref == $userId] {name, _id, sheetmusic}', {
		type: 'project',
		userId,
	});
}

function getAdminUserData(email) {
	return getSanityClient().fetch('*[_type == $type && email == $email]', {
		type: 'adminUser',
		email,
	});
}


// OLD code

function addProject(userId, name) {
	return getSanityClient().create({
		_type: 'project',
		owner: {_ref: userId},
		name
	});
}

function getProject(name) {
	return getSanityClient().fetch(`
		*[_type == $type && name == $name] {
			_id,
			name,
			helprecording{asset->{url, _id}},
			images[]{asset->{url, "preview": metadata.lqip}}
		}`, {
		type: 'project',
		name,
	})
	.then(result => result[0]);
}

function addHelpRecording(projectName, filepath) {
	const cl = getSanityClient();
	return getProject(projectName)
	.then(project => {
		return cl.assets
		.upload('file', fs.createReadStream(filepath))
		.then(doc => {
			return cl.patch(project._id)
			.set({
				helprecording: {
					_type: 'file',
					asset: {
						_type: "reference",
						_ref: doc._id
					}
				}
			})
			.commit();
		});
	});
}

function removeHelpRecording(projectName, fileId) {
	const cl = getSanityClient();
	return getProject(projectName)
	.then(project => {
		return cl
		.transaction()
		.patch(
			cl.patch(project._id)
			.unset(['helprecording'])
		)
		.delete(fileId)
		.commit();
	});
}

function addImage(projectName, filepath) {
	const cl = getSanityClient();
	return getProject(projectName)
	.then(project => {
		return cl.assets
		.upload('image', fs.createReadStream(filepath))
		.then(doc => {
			return cl.patch(project._id)
			.setIfMissing({images: []})
			.append('images', [{
				_type: 'image',
				asset: {
					_type: 'reference',
					_ref: doc._id
				}
			}])
			.commit();
		});
	});
}

function addRecording(projectName, pupil, meta, filepath) {
	const cl = getSanityClient();
	return getProject(projectName)
	.then(project => {
		return cl.assets
		.upload('file', fs.createReadStream(filepath),
			{filename: pupil + '-opptak.mp3'})
		.then(doc => {
			return cl.create({
				_type: 'recording',
				pupil,
				project: {
					_ref: project._id,
				},
				recording: {
					_type: 'file',
					asset: {
						_type: "reference",
						_ref: doc._id
					}
				},
				meta,
			})
		});
	});
}

function getRecordings(projectName) {
	return getProject(projectName)
	.then(project => {
		return getSanityClient().fetch(`*[
			_type == $type && project._ref == $projectId
		] {_id, _createdAt, pupil, meta, "url": recording.asset->url}`, {
			type: 'recording',
			projectId: project._id,
		});
	});
}

module.exports = {
	getSanityClient,
	getAdminUserData,
	getProjects,
	getProject,
	addProject,
	addHelpRecording,
	removeHelpRecording,
	addRecording,
	addImage,
	getRecordings,
};
