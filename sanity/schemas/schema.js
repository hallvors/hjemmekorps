// First, we must import the schema creator
import createSchema from 'part:@sanity/base/schema-creator';

// Then import schema types from any plugins that might expose them
import schemaTypes from 'all:part:@sanity/base/schema-type';

// Custom schemas
import admin from './admin.js';
import project from './project.js';
import member from './member.js';
import band from './band.js';
import recording from './recording.js';
import projectassignment from './projectassignment.js';

// Then we give our schema to the builder and provide the result to Sanity
export default createSchema({
  // We name our schema
  name: 'default',
  // Then proceed to concatenate our document type
  // to the ones provided by any plugins that are installed
  types: schemaTypes.concat([
    admin,
    project,
    band,
    member,
    recording,
    projectassignment,
  ]),
});
