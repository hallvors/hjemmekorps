import sClient from '../../../../../lib/sanity_client';
import got from 'got';
const { DOMParser, XMLSerializer } = require('xmldom');

export async function get(req, res, next) {
  let project = await sClient.getProjectScoreData(req.params.id);
  return got(project.sheetmusicFile).then(result => {
    let mxml = result.body;
    const doc = new DOMParser().parseFromString(mxml);
    const scoreParts = doc.getElementsByTagName('score-part');
    const parts = doc.getElementsByTagName('part');

    let keepIds = [];
    for (let i = scoreParts.length - 1; i >= 0; i--) {
      let id = scoreParts[i].getAttribute('id');
      let name = scoreParts[i].getElementsByTagName('part-name')[0].textContent;
      if (name === req.params.part) {
        keepIds.push(id);
      } else {
        scoreParts[i].parentNode.removeChild(scoreParts[i]);
      }
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      if (!keepIds.includes(parts[i].getAttribute('id'))) {
        parts[i].parentNode.removeChild(parts[i]);
      }
    }

    let markup = new XMLSerializer().serializeToString(doc);
    res.setHeader(
      'Content-type',
      'application/vnd.recordare.musicxml+xml; charset=utf-8'
    );
    res.end(markup);
  });
}
