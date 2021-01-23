const env = require("../config/environment");

const sanity = require("@sanity/client");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const NodeCache = require("node-cache");

const {filterInstrumentName} = require('./utils');

const sanityCache = new NodeCache({
  stdTTL: 60 * 60 * 24 * 7,
  useClones: true,
});

const PROJECT = env.nconf.get("sanity:project");
const TOKEN = env.nconf.get("sanity:token") || process.env.SANITY_TOKEN;
const DATASET = env.nconf.get("sanity:dataset");
const instruments = env.nconf.get("instruments");

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
  return getSanityClient()
    .fetch(
      `*[_type == $type && email == $email && !(_id in path("drafts.**"))][0]{
    name, email, friendly_name, phone, portrait, _id, _type,
    "portraitUrl": portrait.asset->url
  }`,
      {
        type: "adminUser",
        email,
      }
    )
    .then((userData) => {
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
        type: "member",
        id,
      }
    )
    .then((userData) => {
      sanityCache.set(id, userData);
      return userData;
    });
}

function getBandsForAdminUser(userId) {
  return getSanityClient().fetch(
    `*[_type == $type && references($userId) && !(_id in path("drafts.**"))]{
    ..., "logoUrl": logo.asset->url,
    "palette": logo.asset->metadata.palette
  }`,
    { type: "band", userId }
  );
}

function getProjects(userId) {
  return getSanityClient().fetch(
    `*[_type == $type && owner._ref == $userId && !(_id in path("drafts.**"))] {
      name, _id, sheetmusic,
      "sheetmusicFile": sheetmusic->url,
    }
    | order(_createdAt desc)`,
    {
      type: "project",
      userId,
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

  return getSanityClient()
    .fetch(
      `*[_type == $type && _id == $projectId][0] {
      name, _id, sheetmusic,
      "sheetmusicFile": sheetmusic.asset->url,
      owner, partslist,
      "members": members[]->{
        _id, name, phone, email, "band": band->name, "portraitUrl": portrait.asset->url,
        "recording": *[_type == 'recording' && references(^._id)][0]
      }
    }`,
      {
        type: "project",
        userId,
        projectId,
      }
    )
    .then((result) => {
      if (!result) {
        console.error("no result!?");
        return null;
      }
      if (result.owner._ref !== userId) {
        console.log("not requested by owner?", result.owner._ref);
        // not requested by the admin user who owns this project..
        if (!result.members.find((member) => member._id === userId)) {
          // the user is not a musician for this project.. odd!
          console.error("user not musician for requested project");
          return null;
        }
        // privacy etc.. remove the members data
        delete result.members;
        // Here comes the hard part: remove non-useful parts of this score
        // we want to send only the relevant part for this person
        // TODO: is there a usable XML parser / serializer for node.js? Should we attempt to do this here,
        // or push this work to the browser? Or can we use AlphaTab and just tell it to render a certain track?
        // To be continued..
      } else {
        console.log("project owner requests project");
        // Project owner is requesting data. We should also include the secret links for all members
        result.members.forEach((member) => {
          member.token = jwt.sign(
            { userId: member._id, projectId },
            env.nconf.get("site:tokensecret")
          );
        });
      }
      sanityCache.set(id, result);
      return result;
    });
}

function addProject(userId, name, mxmlFile, partslist, members) {
  const client = getSanityClient();
  return client.assets
    .upload("file", mxmlFile.buffer, { filename: mxmlFile.originalname })
    .then((filedoc) => {
      members = members.map((member) => ({
        _type: "reference",
        _ref: member._id,
        _key: nanoid(),
      }));
      return client
        .create({
          _type: "project",
          owner: { _ref: userId },
          name,
          sheetmusic: {
            _type: "file",
            asset: { _type: "reference", _ref: filedoc._id },
          },
          members,
          partslist,
        })
        .then((project) => getProject(userId, project._id));
    });
}

function ensureMembersExist(userId, bandId, members) {
  const client = getSanityClient();
  return client
    .fetch(`*[_type == $type && _id == $id && references($uid)]`, {
      type: "band",
      id: bandId,
      uid: userId,
    })
    .then((band) => {
      if (!band.length) {
        return Promise.reject({ message: "Band not found" });
      }
      return Promise.all(
        members.map((member) => {
          const name = member.name.trim();
          return client
            .fetch(
              "*[_type == $type && name == $name && references($bandId)]",
              {
                type: "member",
                name,
                bandId,
              }
            )
            .then((result) => {
              if (!result.length) {
                return client.create({
                  _type: "member",
                  band: {
                    _type: "reference",
                    _ref: bandId,
                  },
                  name,
                  instrument: filterInstrumentName(member.instrument, instruments)
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
      { type: "recording", projectId, memberId }
    )
    .then((oldRecordings) => {
      return Promise.all(
        oldRecordings.map((recording) => {
          return cl
            .delete(recording._id)
            .then(() => cl.delete(recording.file.asset._ref));
        })
      );
    })
    .then(() => {
      return cl.assets
        .upload("file", fs.createReadStream(filepath))
        .then((doc) => {
          return cl
            .create({
              _type: "recording",
              project: {
                _type: "reference",
                _ref: projectId,
              },
              member: {
                _type: "reference",
                _ref: memberId,
              },
              file: {
                _type: "file",
                asset: {
                  _type: "reference",
                  _ref: doc._id,
                },
              },
            })
            .then(() => getProject(memberId, projectId));
        });
    });
}

function getRecordings(projectId) {
  return getSanityClient().fetch(
    `*[
        _type == $type && references($projectId)
      ] {_id, _createdAt, member, "url": file.asset->url}`,
    {
      type: "recording",
      projectId: projectId,
    }
  );
}

// OLD code

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

module.exports = {
  getSanityClient,
  getAdminUserData,
  getUserData,
  getBandsForAdminUser,
  getProjects,
  ensureMembersExist,

  getProject,
  addProject,
  addProjectRecording,

  removeHelpRecording,
  addRecording,
  addImage,
  getRecordings,
};
