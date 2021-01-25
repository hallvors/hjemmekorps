const env = require('../config/environment');

const sanity = require('@sanity/client');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const _ = require('underscore');
const { nanoid } = require('nanoid');
const NodeCache = require('node-cache');

const { filterInstrumentName } = require('./utils');

const sanityCache = new NodeCache({
  stdTTL: 60 * 60 * 24 * 7,
  useClones: true,
});

const PROJECT = env.nconf.get('sanity:project');
const TOKEN = env.nconf.get('sanity:token') || process.env.SANITY_TOKEN;
const DATASET = env.nconf.get('sanity:dataset');
const instruments = env.instruments;

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

function getAdminUserData(email) {
  // we want admin user data for nearly all API requests. Cache it..
  if (sanityCache.has(email)) {
    return Promise.resolve(sanityCache.get(email));
  }
  return getSanityClient()
    .fetch(
      `*[_type == $type && email == $email && !(_id in path("drafts.**"))][0]{
    name, email, friendly_name, phone, portrait, _id, _type,
    "portraitUrl": portrait.asset->url
  }`,
      {
        type: 'adminUser',
        email,
      }
    )
    .then(userData => {
      sanityCache.set(email, userData);
      return userData;
    });
}

function getUserData(id) {
  // we want user data for most API requests from non-admins too, cache it..
  if (sanityCache.has(id)) {
    return Promise.resolve(sanityCache.get(id));
  }
  return getSanityClient()
    .fetch(
      `*[_type == $type && _id == $id && !(_id in path("drafts.**"))][0]{
    name, email, phone, "portrait": portrait.asset->, _id, _type,
    "band": band->{name,
      "palette": logo.asset->metadata.palette,
      "logoUrl": logo.asset->url
    }
  }`,
      {
        type: 'member',
        id,
      }
    )
    .then(userData => {
      sanityCache.set(id, userData);
      return userData;
    });
}

function getBandsForAdminUser(userId) {
  return getSanityClient().fetch(
    `*[_type == $type && references($userId) && !(_id in path("drafts.**"))]{
    ..., "logoUrl": logo.asset->url,
    "palette": logo.asset->metadata.palette,
    "members": *[_type == "member" && references(^._id)] {
      ..., "portraitUrl": portrait.asset->url
    }
  }`,
    { type: 'band', userId }
  );
}

function getProjects(userId) {
  return getSanityClient().fetch(
    `*[_type == $type && owner._ref == $userId && !(_id in path("drafts.**"))] {
      name, _id, sheetmusic,
      "sheetmusicFile": sheetmusic.asset->url
    }
    | order(_createdAt desc)`,
    {
      type: 'project',
      userId,
    }
  );
}

function getProjectScoreData(projectId) {
  return getSanityClient().fetch(
    `*[_type == $type && _id == $projectId && !(_id in path("drafts.**"))] {
      _id, "sheetmusicFile": sheetmusic.asset->url, partslist
    }[0]`,
    {
      type: 'project',
      projectId,
    }
  );
}

function getProject(userId, projectId) {
  // userId can be either an admin user or a regular band member user ID
  // admin user will get more data from this method, however: no members details
  // for a non-admin
  let id = `project-${userId}-${projectId}`;
  if (sanityCache.has(id)) {
    return Promise.resolve(sanityCache.get(id));
  }
  const client = getSanityClient();
  return client
    .fetch(
      `*[_type == $type && _id == $projectId][0] {
      name, _id, sheetmusic,
      "sheetmusicFile": sheetmusic.asset->url,
      owner, partslist, generated_soundfile,
    }`,
      {
        type: 'project',
        userId,
        projectId,
      }
    )
    .then(result => {
      if (!result) {
        console.error('no result!?');
        return null;
      }
      if (result.owner._ref !== userId) {
        console.log('not requested by owner?', result.owner._ref);
        // not requested by the admin user who owns this project..
        if (
          !result.partslist.find(
            part =>
              part.members &&
              part.members.find(member => member._ref === userId)
          )
        ) {
          // the user is not a musician for this project.. odd!
          console.error('user not musician for requested project');
          return null;
        }
        // Here comes the hard part: remove non-useful parts of this score
        // we want to send only the relevant part for this person
        // TODO: is there a usable XML parser / serializer for node.js? Should we attempt to do this here,
        // or push this work to the browser? Or can we use AlphaTab and just tell it to render a certain track?
        // To be continued..
        return result;
      } else {
        console.log('project owner requests project');
        // Project owner is requesting data. We should also include the secret links for all members
        const memberIds = _.flatten(
          result.partslist.map(
            part => part.members && part.members.map(member => member._ref)
          )
        );
        return client
          .fetch(
            `*[
          _type == "member" && _id in $memberIds
        ]{
          _id, name, phone, email, subgroup, instrument,
          "band": band->name, "portraitUrl": portrait.asset->url,
            "recording": *[_type == 'recording' && references(^._id) && references($projectId)][0]{
              "url": file.asset->url, volume
            }
        }`,
            { memberIds, projectId }
          )
          .then(members => {
            result.members = members;

            result.members.forEach(member => {
              member.token = jwt.sign(
                { userId: member._id, projectId },
                env.nconf.get('site:tokensecret')
              );
              let part = result.partslist.find(
                part =>
                  part.members &&
                  part.members.find(partMem => partMem._ref === member._id)
              );
              if (part) {
                member.part = part.part;
              }
            });
            // sanityCache.set(id, result);
            return result;
          });
      }
    });
}

function addProject(userId, name, mxmlFile, partslist, members) {
  const client = getSanityClient();
  return client.assets
    .upload('file', mxmlFile.buffer, { filename: mxmlFile.originalname })
    .then(filedoc => {
      const tempMapping = {};
      partslist = partslist
        .map(part => {
          // The name of the part might be "Trumpet 1" etc
          // but it might also mention the name of a member,
          // in the latter case we can complete the assignment
          const member = members.find(member => {
            return part.toLowerCase().indexOf(member.name.toLowerCase()) > -1;
          });
          if (member) {
            // this score part mentions a name
            if (tempMapping[part]) {
              // We have assigned somebody else already, add to the list
              tempMapping[part].push({ _type: 'reference', _ref: member._id });
              return;
            }
            const assignmentObj = {
              _key: nanoid(),
              _type: 'projectassignment',
              part,
              members: [{ _type: 'reference', _ref: member._id }],
            };
            tempMapping[part] = assignmentObj.members;
            return assignmentObj;
          }
          // This is a generic part name, no musician assigned (which we know about)
          return { _key: nanoid(), part, _type: 'projectassignment', members: [] };
        })
        .filter(obj => obj); // remove any nulls
      return client
        .create({
          _type: 'project',
          owner: { _ref: userId },
          name,
          sheetmusic: {
            _type: 'file',
            asset: { _type: 'reference', _ref: filedoc._id },
          },
          partslist,
        })
        .then(project => getProject(userId, project._id));
    });
}

function updateProject(userId, projectId, data) {
  const client = getSanityClient();
  return client.getDocument(projectId).then(oldData => {
    if (oldData.owner._ref !== userId) {
      throw new Error('not allowed');
    }

    Object.assign(oldData, data);
    return client
      .createOrReplace(oldData)
      .then(result => getProject(userId, projectId));
  });
}

async function updateOrCreateMember(data, bandId, portraitFile) {
  const client = getSanityClient();

  ['phone', 'email'].forEach(prop => {
    // probably not relevant if we get JSON data, but just in case..
    if (typeof data[prop] === 'string') {
      data[prop] = data[prop].split(/,/g);
    }
  });

  let oldData;
  if (data._id) {
    oldData = await client.getDocument(data._id);
  }

  let portraitDoc;
  if (portraitFile) {
    portraitDoc = await client.upload('image', fs.createReadStream(filepath));
  }

  let update = { _type: 'member', visible: true };
  Object.assign(
    update,
    oldData || {},
    _.pick(
      data,
      '_id',
      'name',
      'phone',
      'email',
      'instrument',
      'subgroup',
      'visible'
    )
  );
  if (bandId) {
    update.band = { _type: 'reference', _ref: bandId };
  }
  if (portraitDoc) {
    update.portrait = {
      _type: 'image',
      asset: { _type: 'reference', _ref: portraitDoc._id },
    };
  }
  const result = await (update._id
    ? client.createOrReplace(update)
    : client.create(update));

  // Clean up: remove the old image file if we have a new one
  if (oldData && oldData.portrait && portraitFile) {
    await client.delete(oldData.portrait.asset._ref);
  }
  return result;
}

// TODO: reconsider if this is useful... likely not
function ensureMembersExist(userId, bandId, members) {
  const client = getSanityClient();
  return client
    .fetch(`*[_type == $type && _id == $id && references($uid)]`, {
      type: 'band',
      id: bandId,
      uid: userId,
    })
    .then(band => {
      if (!band.length) {
        return Promise.reject({ message: 'Band not found' });
      }
      return Promise.all(
        members.map(member => {
          const name = member.name.trim();
          return client
            .fetch(
              '*[_type == $type && name == $name && references($bandId)]',
              {
                type: 'member',
                name,
                bandId,
              }
            )
            .then(result => {
              if (!result.length) {
                return client.create({
                  _type: 'member',
                  band: {
                    _type: 'reference',
                    _ref: bandId,
                  },
                  name,
                  instrument: member.instrument
                    ? filterInstrumentName(member.instrument, instruments)
                    : '',
                  visible: true,
                });
              } else {
                return result[0];
              }
            });
        })
      );
    });
}

function addProjectRecording(projectId, memberId, filepath) {
  const cl = getSanityClient();
  return cl
    .fetch(
      `*[_type == $type &&
    references($projectId) &&
    references($memberId)]`,
      { type: 'recording', projectId, memberId }
    )
    .then(oldRecordings => {
      return Promise.all(
        oldRecordings.map(recording => {
          return cl
            .delete(recording._id)
            .then(() => cl.delete(recording.file.asset._ref));
        })
      );
    })
    .then(() => {
      return cl.assets
        .upload('file', fs.createReadStream(filepath))
        .then(doc => {
          return cl
            .create({
              _type: 'recording',
              project: {
                _type: 'reference',
                _ref: projectId,
              },
              member: {
                _type: 'reference',
                _ref: memberId,
              },
              file: {
                _type: 'file',
                asset: {
                  _type: 'reference',
                  _ref: doc._id,
                },
              },
              volume: 100,
            })
            .then(() => getProject(memberId, projectId));
        });
    });
}

function getRecordings(projectId) {
  return getSanityClient().fetch(
    `*[
        _type == $type && references($projectId)
      ] {_id, _createdAt, member, "url": file.asset->url, volume}`,
    {
      type: 'recording',
      projectId: projectId,
    }
  );
}

// OLD code

function addHelpRecording(projectName, filepath) {
  const cl = getSanityClient();
  return getProject(projectName).then(project => {
    return cl.assets.upload('file', fs.createReadStream(filepath)).then(doc => {
      return cl
        .patch(project._id)
        .set({
          helprecording: {
            _type: 'file',
            asset: {
              _type: 'reference',
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
  return getProject(projectName).then(project => {
    return cl
      .transaction()
      .patch(cl.patch(project._id).unset(['helprecording']))
      .delete(fileId)
      .commit();
  });
}

function addImage(projectName, filepath) {
  const cl = getSanityClient();
  return getProject(projectName).then(project => {
    return cl.assets
      .upload('image', fs.createReadStream(filepath))
      .then(doc => {
        return cl
          .patch(project._id)
          .setIfMissing({ images: [] })
          .append('images', [
            {
              _type: 'image',
              asset: {
                _type: 'reference',
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
  return getProject(projectName).then(project => {
    return cl.assets
      .upload('file', fs.createReadStream(filepath), {
        filename: pupil + '-opptak.mp3',
      })
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
              _type: 'reference',
              _ref: doc._id,
            },
          },
          meta,
        });
      });
  });
}

module.exports = {
  getSanityClient,
  getAdminUserData,
  getUserData,
  getBandsForAdminUser,
  getProjects,
  getProjectScoreData,
  updateProject,
  updateOrCreateMember,
  ensureMembersExist,

  getProject,
  addProject,
  addProjectRecording,

  removeHelpRecording,
  addRecording,
  addImage,
  getRecordings,
};
