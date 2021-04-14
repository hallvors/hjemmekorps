export const STANDARD_BPM = 80;

export function extractNoteMetaData(osmdInstance) {
  // add meta data to SVG notes
  let time = 0;
  let data = {};
  for (let i = 0; i < osmdInstance.graphic.MeasureList.length; i++) {
    for (let j = 0; j < osmdInstance.graphic.MeasureList[i].length; j++) {
      if (!osmdInstance.graphic.MeasureList[i][j]) {
        continue;
      }
      time = 0;
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
              let svgElm;
              try {
                svgElm = note.getSVGGElement();
              } catch (err) {
                // multi-measure rests have no notes
                //console.error(err);
              }
              if (svgElm) {
                data[svgElm.id] = {
                  measure: i,
                  timeStart: parseFloat(time).toFixed(3),
                };
                time += note.sourceNote.length.realValue;
                data[svgElm.id].timeEnd = parseFloat(time).toFixed(3);
              }
            }
          }
        }
      }
    }
  }
  return data;
}

export function extractMeasureData(osmdInstance) {
  let durationSoFar = 0;
  let repeats = [];
  let measureList = osmdInstance.sheet.sourceMeasures.map(measure => {
    // Choose some properties of this measure and prepare client-side code
    let info = {
      duration: measure.duration.realValue, // in measures (?)
      jumps: [],
      beats: [],
      start: durationSoFar,
      isReducedToMultiRest: measure.isReducedToMultiRest,
    };
    let graphicalMeasure = osmdInstance.graphic.getGraphicalMeasureFromSourceMeasureAndIndex(measure, 0);
    if (graphicalMeasure && graphicalMeasure.stave) {
      ['x', 'y', 'width', 'height'].forEach(prop => {
        info[prop] = graphicalMeasure.stave[prop];
        if (graphicalMeasure.multiRestElement) {
          info.numberOfMeasures = graphicalMeasure.multiRestElement.number_of_measures;
        }
      })
    }

    durationSoFar += info.duration;
    if (measure.RhythmPrinted) {
      // nice shortcut to "does the signature change here?"
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
    if (
      measure.tempoExpressions &&
      measure.tempoExpressions[0] &&
      measure.tempoExpressions[0].instantaneousTempo
    ) {
      info.metronome = {
        beatUnit: measure.tempoExpressions[0].instantaneousTempo.beatUnit,
        dotted: measure.tempoExpressions[0].instantaneousTempo.dotted,
        bpm: measure.tempoExpressions[0].instantaneousTempo.tempoInBpm,
      };
    }
    return info;
  });
  return { measureList, repeats };
}

export function extractUpbeatTime(osmdInstance) {
  if (
    osmdInstance.sheet.sourceMeasures[0] &&
    osmdInstance.sheet.sourceMeasures[0].duration.realValue <
      osmdInstance.sheet.sourceMeasures[0].activeTimeSignature.realValue
  ) {
    return osmdInstance.sheet.sourceMeasures[0].duration.realValue;
  }
  return null;
}

export function tempoUnitAsNumber(unit) {
  return {
    whole: 1,
    half: 2,
    quarter: 4,
    eight: 8,
    sixteenth: 16, // hopefully never..?
  }[unit];
}

export function numberToTempoUnit(number) {
  return {
    1: 'whole',
    2: 'half',
    4: 'quarter',
    8: 'eight',
    16: 'sixteenth', // will this ever be used..? :)
  }[number];
}
