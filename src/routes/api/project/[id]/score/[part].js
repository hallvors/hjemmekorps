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
    // Apparently, Sibelius might only add metronome instructions to
    // one of the parts in a complex score..
    const metronomes = doc.getElementsByTagName('metronome');
    const metronomeData = [];
    for (let i = 0; i < metronomes.length; i++) {
      const ancestor = metronomes[i].parentNode.parentNode; // direction > direction-type > metronome
      const measure = ancestor.parentNode.getAttribute('number');
      metronomeData.push({
        element: ancestor.cloneNode(true),
        measure,
      });
    }
    let keepIds = [];
    for (let i = scoreParts.length - 1; i >= 0; i--) {
      let id = scoreParts[i].getAttribute('id');
      let name = scoreParts[i].getElementsByTagName('part-name')[0].textContent;
      if (name.trim() === req.params.part.trim()) {
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

    for (let i = 0; i < metronomeData.length; i++) {
      let measure = getMeasureByNumber(doc, metronomeData[i].measure);
      if (measure) {
        let elm =
          measure.getElementsByTagName('attributes')[0] || measure.firstChild;
        measure.insertBefore(metronomeData[i].element, elm.nextSibling || elm);
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

function getMeasureByNumber(doc, number) {
  const measures = doc.getElementsByTagName('measure');
  for (let i = 0; i < measures.length; i++) {
    if (measures[i].getAttribute('number') === number) {
      return measures[i];
    }
  }
}

export async function post(req, res, next) {
  let projectId = req.params.id;
  let partName = req.params.part;
  let svgMarkup = req.body.svgMarkup;
  await sClient.addPartFile(projectId, partName, Buffer.from(svgMarkup));
  res.json({ status: 'ok' });
}
