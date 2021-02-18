const env = require('../config/environment');

const fxp = require('fast-xml-parser');
const fs = require('fs');
const _ = require('underscore');

function parseFile(file) {
  return fxp.parse(file.buffer.toString('utf-8'));
}

function getName(mxmlData) {
  return (
    (mxmlData['score-partwise'] &&
      mxmlData['score-partwise']['work'] &&
      mxmlData['score-partwise']['work']['work-title']) ||
    null
  );
}

function getPartsList(mxmlData) {
  if (
    mxmlData['score-partwise'] &&
    mxmlData['score-partwise']['part-list'] &&
    mxmlData['score-partwise']['part-list']['score-part']
  ) {
    if (
      !(mxmlData['score-partwise']['part-list']['score-part'] instanceof Array)
    ) {
      return [
        mxmlData['score-partwise']['part-list']['score-part']['part-name'],
      ];
    }
    return mxmlData['score-partwise']['part-list']['score-part'].map(
      part => part['part-name']
    );
  }
  return [];
}

module.exports = {
  parseFile,
  getName,
  getPartsList,
};
