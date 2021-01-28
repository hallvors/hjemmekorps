const sanity = require('@sanity/client');

const env = require('../src/config/environment');
const PROJECT = env.config.sanity.project;
const TOKEN = env.config.sanity.token;
const DATASET = 'test';

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

let client = getSanityClient();

client.fetch('*[_type == "member" && !visible]')
.then(members => {
	console.log(members)
	return Promise.all(members.map(m => client.delete(m._id)))
	.then(res => {
		console.log(res)
	})
})


