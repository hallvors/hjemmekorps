import Blob from 'cross-blob';
import jsdom from 'jsdom';

// this path is prepared by prep-files.sh - but should we skip that
// and reference node_modules?
let osmdBuildDir = __dirname + '../../static/js/opensheetmusicdisplay/';

let window, document;
let pageFormat = 'Endless';

// fake Browser DOM OSMD and Vexflow need to generate SVG
const dom = new jsdom.JSDOM('<!DOCTYPE html></html>');
window = dom.window;
document = dom.window.document;
global.window = dom.window;
global.document = window.document;
window.console = console; // probably does nothing
global.HTMLElement = window.HTMLElement;
global.HTMLAnchorElement = window.HTMLAnchorElement;
global.XMLHttpRequest = window.XMLHttpRequest;
global.DOMParser = window.DOMParser;
global.Node = window.Node;

// all the faked browser stuff needs to be available before we can require OSMD
const OSMD = require('opensheetmusicdisplay');

export async function generateSVGImage(
  mxmlData,
  partName,
  pageWidth,
  pageHeight,
  DEBUG = false
) {
  const markupStrings = [];
  pageWidth = parseInt(pageWidth);
  pageHeight = parseInt(pageHeight);
  const endlessPage = !(pageHeight > 0 && pageWidth > 0);
  if (!endlessPage) {
    pageFormat = `${pageWidth}x${pageHeight}`;
  }

  const div = document.createElement('div');
  div.id = 'browserlessDiv';
  document.body.appendChild(div);

  // TODO sometimes the width is way too small for the score, may need to adjust zoom.
  if (endlessPage && !pageWidth > 0) {
    pageWidth = 1440;
  }
  if (endlessPage) {
    pageHeight = 32767; //???
  }
  div.style.width = pageWidth + 'px';
  div.height = pageHeight;
  Object.defineProperties(window.HTMLElement.prototype, {
    offsetLeft: {
      get: function () {
        return parseFloat(window.getComputedStyle(this).marginTop) || 0;
      },
    },
    offsetTop: {
      get: function () {
        return parseFloat(window.getComputedStyle(this).marginTop) || 0;
      },
    },
    offsetHeight: {
      get: function () {
        return pageHeight;
      },
    },
    offsetWidth: {
      get: function () {
        return pageWidth;
      },
    },
  });
  debug('div.offsetWidth: ' + div.offsetWidth, DEBUG);
  debug('div.height: ' + div.height, DEBUG);
  // ---- end browser hacks (hopefully) ----

  const osmdInstance = new OSMD.OpenSheetMusicDisplay(div, {
    autoResize: true,
    backend: 'svg',
    pageBackgroundColor: '#FFFFFF',
    pageFormat: pageFormat,
    // defaultFontFamily: 'Arial',
    drawTitle: false,
  });
  // for more options check OSMDOptions.ts
  await osmdInstance.load(mxmlData);
  debug('xml loaded', DEBUG);
  try {
    // TODO: use our mxml helpers to remove the non-wanted parts instead
    osmdInstance.sheet.instruments.forEach(instrument => {
      instrument.Visible = instrument.nameLabel.text === partName;
    });
    osmdInstance.render();

    // add meta data to SVG notes
    let time = 0;
    for (let i = 0; i < osmdInstance.graphic.MeasureList.length; i++) {
      for (let j = 0; j < osmdInstance.graphic.MeasureList[i].length; j++) {
        for (
          let k = 0;
          k < osmdInstance.graphic.MeasureList[i][j].staffEntries.length;
          k++
        ) {
          for (
            let l = 0;
            l <
            osmdInstance.graphic.MeasureList[i][j].staffEntries[k]
              .graphicalVoiceEntries.length;
            l++
          ) {
            for (
              let m = 0;
              m <
              osmdInstance.graphic.MeasureList[i][j].staffEntries[k]
                .graphicalVoiceEntries[l].notes.length;
              m++
            ) {
              let note =
                osmdInstance.graphic.MeasureList[i][j].staffEntries[k]
                  .graphicalVoiceEntries[l].notes[m];
              if (note.getSVGGElement && note.sourceNote.length) {
                let svgElm = note.getSVGGElement();
                if (svgElm) {
                  svgElm.setAttribute('data-measure', i);
                  svgElm.setAttribute('data-time-start', time);
                  time += note.sourceNote.length.realValue;
                  svgElm.setAttribute('data-time-end', time);
                }
              }
            }
          }
        }
      }
    }
    //osmdInstance.graphic.MeasureList[0][0].staffEntries[0].graphicalVoiceEntries[0].notes[0].getSVGGElement();
  } catch (ex) {
    console.log('renderError: ' + ex);
  }
  debug('rendered', DEBUG);
  let repeats = [];
  let upbeat = 0;
  let measureData = osmdInstance.sheet.sourceMeasures.map(measure => {
    let info = {};
    if (measure.RhythmPrinted) {
      info.timeSignature = {
        numerator: measure.activeTimeSignature.numerator,
        denominator: measure.activeTimeSignature.denominator,
      };
    }
    if (measure.firstRepetitionInstructions) {
      repeats = repeats.concat(measure.firstRepetitionInstructions);
    }
    if (measure.lastRepetitionInstructions) {
      repeats = repeats.concat(measure.lastRepetitionInstructions);
    }
    return info;
  });
  if (osmdInstance.sheet.sourceMeasures[0] && osmdInstance.sheet.sourceMeasures[0].duration.realValue < osmdInstance.sheet.sourceMeasures[0].activeTimeSignature.realValue) {
    upbeat = osmdInstance.sheet.sourceMeasures[0].duration.realValue;
  }
  let svgElement;
  // This loop supports all the pages you might possibly wish for, no?
  for (
    let pageNumber = 1;
    pageNumber < Number.POSITIVE_INFINITY;
    pageNumber++
  ) {
    svgElement = document.getElementById('osmdSvgPage' + pageNumber);
    if (!svgElement) {
      break;
    }
    // The important xmlns attribute is not serialized unless we set it here
    svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgElement.setAttribute('data-measure-list', JSON.stringify(measureData));
    svgElement.setAttribute('data-upbeat', upbeat);
    svgElement.setAttribute('data-repeats', JSON.stringify(repeats));
    markupStrings.push(svgElement.outerHTML);
  }
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild);
  }
  return markupStrings;
}

function debug(msg, debugEnabled) {
  if (debugEnabled) {
    console.log(msg);
  }
}
