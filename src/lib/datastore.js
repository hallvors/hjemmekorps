/**
 * Manage the data structures and data this site needs
 *
 * Sapper has a built-in data store, but using it requires code
 * for subscribing in every route/*.svelte file as far as I can tell.
 * We can't import that Sapper store into this file either.
 * Hence we use regular Svelte stores to maintain global state.
 *
 * Structure: user - self explanatory
 * bands - list of bands, each band has a .members array
 * projectList - just IDs/names to make a linked list
 * projects - more detailed data, keyed by project._id,
 *   updated when we load a project's page
 */

import { writable, derived } from 'svelte/store';

export const user = writable({});
export const bands = writable([]);
export const selectedBand = writable(0);
// projectList - names and _ids
export const projectList = writable([]);
// instruments in a particular order
export const instruments = writable([]);
// detailed project info, keyed on _id
export const projects = writable({});

export function setSession(newSessionData) {
  //console.log('data from server', newSessionData)
  // called from _layout.svelte with session data from server.js
  user.set(newSessionData.user);
  bands.set(newSessionData.bands);
  projectList.set(newSessionData.projectList);
  instruments.set(newSessionData.instruments);
}

// members[_id] > member derived from band.members
// TODO: should we load members separately and not derive?
export const members = derived(bands, $bands => {
  // For convenience, we query members with bands - but we
  // want the members stored by id..
  let keyedById = {};
  $bands.forEach(band => {
    band.members.forEach(member => {
      keyedById[member._id] = member;
    });
  });
  return keyedById;
});




function updateObjectTypeStore(store) {
  return newData => {
    return store.update(oldData => Object.assign({}, oldData, newData));
  };
}

function updateArrayTypeStore(store) {
  // TODO: not sure if this is a good idea, but
  // argument can be either array (replace!) or
  // object with ._id (update specific or add if
  // not found).
  return newData => {
    return store.update(oldData => {
      if (newData instanceof Array) {
        return [...newData];
      }
      if (!newData._id) {
        throw new TypeError('input lacks _id property');
      }
      let done = false;
      for (let i = 0; i < oldData.length; i++) {
        if (oldData[i] && oldData[i]._id === newData._id) {
          oldData[i] = newData;
          done = true;
          break;
        }
      }
      if (!done) {
        oldData.push(newData);
      }
      return [...oldData];
    });
  };
}

export const updateBands = updateArrayTypeStore(bands);
export const updateProjectList = updateArrayTypeStore(projectList);
export const updateProjects = updateObjectTypeStore(projects);

export function updateProjectAssignment(projectId, newAssignment) {
  projects.update(old => {
    old[projectId].partslist = newAssignment;
    return Object.assign({}, old);
  });
}

export function updateSelectedBand(newIdx) {
  selectedBand.set(newIdx);
}

export function updateMember(bandId, memberId, newMemberData) {
  bands.update(
    old => {
      let band = old.find(b => b._id === bandId);
      let memberIdx = band.members.findIndex(m => m._id === memberId);
      if (memberIdx > -1) {
        band.members[memberIdx] = Object.assign({}, band.members[memberIdx], newMemberData)
      }
      return [...old];
    }
  );
}

export function addProject(project) {
  projects.update(oldData => {
    return {...oldData, [project._id]: project}
  });
}

export const assignments = derived(projects, $projects => {
  let assignments = {};
  Object.keys($projects).forEach(projId => {
    assignments[projId] = {};
    ($projects[projId].partslist || []).forEach(part => {
      (part.members || []).forEach(memRef => {
        assignments[projId][memRef._ref] = {
          part: part.part,
          recording: memRef.recording,
        };
      });
    });
  });
  return assignments;
});

// recording wav buffers, decoded, keyed on url
export const soundBuffers = writable({});

