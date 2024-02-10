const env = require('../config/environment');

const { XMLParser } = require('fast-xml-parser');
const fxp = new XMLParser({ ignoreAttributes: false });
const jszip = require('jszip');

function parseBufferAsXML(buffer) {
  return fxp.parse(buffer.toString('utf-8'));
}

async function inflateCompressedMxml(buffer) {
  const unzipped = await jszip.loadAsync(buffer);
  const meta = unzipped.file('META-INF/container.xml');
  const metadata = parseBufferAsXML(await meta.async('nodebuffer'));
  // TODO: The zip may actually contain several files, and we should check by MIME
  // type and find a application/vnd.recordare.musicxml+xml one (or pick the only
  // one if only one exists)
  const path =
    metadata.container?.rootfiles?.rootfile['@_full-path'] || 'score.xml';
  return {
    buffer: await unzipped.file(path)?.async('nodebuffer'),
  };
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
  parseBufferAsXML,
  inflateCompressedMxml,
  getName,
  getPartsList,
};
