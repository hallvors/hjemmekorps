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
  if (endlessPage) {
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
    osmdInstance.cursor.reset()
    const iterator = osmdInstance.cursor.Iterator;
    
    while(!iterator.EndReached){
       const voices = iterator.CurrentVoiceEntries;
       for(var i = 0; i < voices.length; i++){
          const v = voices[i];
          const notes = v.Notes;
          for(var j = 0; j < notes.length; j++){
                const note = notes[j];
                // make sure our note is not silent
                if((note != null) && (note.halfTone != 0)){
                    // add data- attributes to vf-note SVG element
                    if (note.getSVGGElement) {
                      let svgElm = note.getSVGGElement();
                      console.log(note, svgElm)
                      svgElm.setAttribute('data-numerator', note.graphicalNoteLength.numerator);
                      svgElm.setAttribute('data-denominator', note.graphicalNoteLength.denominator);
                    }
                   // this might be an alternative iteration..
                   // osmd.graphic.MeasureList[0][0].staffEntries[0].graphicalVoiceEntries[0].notes[0].getSVGGElement()
                }
           }
        }
        iterator.moveToNext()
    }
} catch (ex) {
    console.log('renderError: ' + ex);
  }
  debug('rendered', DEBUG);

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
