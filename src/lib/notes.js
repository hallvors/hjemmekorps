// Define constants for Hertz values of piano notes
const A4Hz = 440.0;

const [
  _foo, // avoid off-by-one bug
  A0,
  Bb0,
  B0,
  C1,
  Db1,
  D1,
  Eb1,
  E1,
  F1,
  Gb1,
  G1,
  Ab1,
  A1,
  Bb1,
  B1,
  C2,
  Db2,
  D2,
  Eb2,
  E2,
  F2,
  Gb2,
  G2,
  Ab2,
  A2,
  Bb2,
  B2,
  C3,
  Db3,
  D3,
  Eb3,
  E3,
  F3,
  Gb3,
  G3,
  Ab3,
  A3,
  Bb3,
  B3,
  C4,
  Db4,
  D4,
  Eb4,
  E4,
  F4,
  Gb4,
  G4,
  Ab4,
  A4,
  Bb4,
  B4,
  C5,
  Db5,
  D5,
  Eb5,
  E5,
  F5,
  Gb5,
  G5,
  Ab5,
  A5,
  Bb5,
  B5,
  C6,
  Db6,
  D6,
  Eb6,
  E6,
  F6,
  Gb6,
  G6,
  Ab6,
  A6,
  Bb6,
  B6,
  C7,
  Db7,
  D7,
  Eb7,
  E7,
  F7,
  Gb7,
  G7,
  Ab7,
  A7,
  Bb7,
  B7,
  C8,
] = Array.from({ length: 122 }, (_, n) => A4Hz * Math.pow(2, (n - 49) / 12));

export const notes = {
  A0,
  'A#0': Bb0,
  Bb0,
  B0,
  C1,
  'C#1': Db1,
  Db1,
  D1,
  'D#1': Eb1,
  Eb1,
  E1,
  F1,
  'F#1': Gb1,
  Gb1,
  G1,
  'G#1': Ab1,
  Ab1,
  A1,
  'A#1': Bb1,
  Bb1,
  B1,
  C2,
  'C#2': Db2,
  Db2,
  D2,
  'D#2': Eb2,
  Eb2,
  E2,
  F2,
  'F#2': Gb2,
  Gb2,
  G2,
  'G#2': Ab2,
  Ab2,
  A2,
  'A#2': Bb2,
  Bb2,
  B2,
  C3,
  'C#3': Db3,
  Db3,
  D3,
  'D#3': Eb3,
  Eb3,
  E3,
  F3,
  'F#3': Gb3,
  Gb3,
  G3,
  'G#3': Ab3,
  Ab3,
  A3,
  'A#3': Bb3,
  Bb3,
  B3,
  C4,
  'C#4': Db4,
  Db4,
  D4,
  'D#4': Eb4,
  Eb4,
  E4,
  F4,
  'F#4': Gb4,
  Gb4,
  G4,
  'G#4': Ab4,
  Ab4,
  A4,
  'A#4': Bb4,
  Bb4,
  B4,
  C5,
  'C#5': Db5,
  Db5,
  D5,
  'D#5': Eb5,
  Eb5,
  E5,
  F5,
  'F#5': Gb5,
  Gb5,
  G5,
  'G#5': Ab5,
  Ab5,
  A5,
  'A#5': Bb5,
  Bb5,
  B5,
  C6,
  'C#6': Db6,
  Db6,
  D6,
  'D#6': Eb6,
  Eb6,
  E6,
  F6,
  'F#6': Gb6,
  Gb6,
  G6,
  'G#6': Ab6,
  Ab6,
  A6,
  'A#6': Bb6,
  Bb6,
  B6,
  C7,
  'C#7': Db7,
  Db7,
  D7,
  'D#7': Eb7,
  Eb7,
  E7,
  F7,
  'F#7': Gb7,
  Gb7,
  G7,
  'G#7': Ab7,
  Ab7,
  A7,
  'A#7': Bb7,
  Bb7,
  B7,
  C8,
};

const semitones = Object.keys(notes).filter(note => !note.includes('#'));

export const noteNames = Object.keys(notes);

export function getNotesMappedToOctave(scale, startingOctave) {
  const startIdx = noteNames.findIndex(
    name => name.startsWith(scale[0]) && name.endsWith(startingOctave)
  );
  const candidates = noteNames.slice(startIdx, startIdx + 17);
  return scale.map(nameWithoutOctave => {
    return candidates.find(
      nameWithOctave => nameWithOctave.replace(/\d+$/, '') === nameWithoutOctave
    );
  });
}

export function getNoteNameByPitch(pitchInHz) {
  // shortcut: b - keys are most used in our scores, hence semitones
  for (const note of semitones) {
    if (notes[note] === pitchInHz) {
      return note;
    }
  }
  // no hit? I don't think those decimals really matter..
  for (const note of semitones) {
    if (Math.floor(notes[note]) === Math.floor(pitchInHz)) {
      return note;
    }
  }
}

// For a list of notes - for example ['C4', 'Bb4', 'D4'], select
// a scale that contains these notes if available. Might return
// nothing. (TODO: support more scales..)
export function selectScaleByNotes(scales, notes) {
  for (const scale in scales) {
    if (
      notes.reduce(
        (state, currentNote) =>
          state &&
          scales[scale].notes.includes(currentNote.replace(/\d+$/, '')),
        true
      )
    ) {
      return scales[scale];
    }
  }
}

// gets for example ['C4', 'D4' .. ], ['C', 'D', 'E'...] and 'E3'
// should add notes at start of noteArray (yes, this modifies input - sue me)
// until  the first note is E3
export function prependNotesTo(noteArray, scale, newStartingNote) {
  const originalStartNoteParts = noteArray[0].match(/([A-Gb#]+)(\d+)/);
  const newStartNoteParts = newStartingNote.match(/([A-Gb#]+)(\d+)/);
  if (originalStartNoteParts) {
    const noteName = originalStartNoteParts[1];
    let octave = parseInt(originalStartNoteParts[2]);

    // check if the desired starting note is higher in the scale
    // than current starting note
    if (
      parseInt(newStartNoteParts[2]) > octave ||
      (parseInt(newStartNoteParts[2]) === octave &&
        scale.indexOf(newStartNoteParts[1]) >= scale.indexOf(noteName))
    ) {
      return;
    }

    let nextNoteIndex = scale.indexOf(noteName) - 1;
    if (nextNoteIndex === -1) {
      nextNoteIndex = scale.length - 1;
      octave--;
    }
    while (noteArray[0] !== newStartingNote && octave > -1) {
      noteArray.unshift(`${scale[nextNoteIndex]}${octave}`);
      nextNoteIndex--;
      if (nextNoteIndex === -1) {
        nextNoteIndex = scale.length - 1;
        octave--;
      }
    }
  }
}
export function appendNotesTo(noteArray, scale, newEndingNote) {
  const originalStartNoteParts =
    noteArray[noteArray.length - 1].match(/([A-Gb#]+)(\d+)/);
  const newEndingNoteParts = newEndingNote.match(/([A-Gb#]+)(\d+)/);
  if (originalStartNoteParts) {
    const noteName = originalStartNoteParts[1];
    let octave = parseInt(originalStartNoteParts[2]);
    // check if the desired starting note is earlier in the scale
    // than current starting note
    if (
      parseInt(newEndingNoteParts[2]) < octave ||
      (parseInt(newEndingNoteParts[2]) === octave &&
        scale.indexOf(newEndingNoteParts[1]) <= scale.indexOf(noteName))
    ) {
      return;
    }

    let nextNoteIndex = scale.indexOf(noteName) + 1;
    if (nextNoteIndex >= scale.length) {
      nextNoteIndex = 0;
      octave++;
    }
    while (noteArray[noteArray.length - 1] !== newEndingNote && octave < 12) {
      // random-ish octave limit to not run forever
      noteArray.push(`${scale[nextNoteIndex]}${octave}`);
      nextNoteIndex++;
      if (nextNoteIndex >= scale.length) {
        nextNoteIndex = 0;
        octave++;
      }
    }
  }
}

// given a note+octave value, move _offset_ steps up/down
// return the note name after transposing
export function transposeBySemiNotes(
  startNote,
  instrumentOffset,
  direction = 1
) {
  const start = semitones.indexOf(startNote);
  if (start === -1) {
    return null;
  }
  console.log(
    'transposing ' +
      startNote +
      ' ' +
      instrumentOffset +
      ' semitones to ' +
      semitones[start + instrumentOffset * direction] +
      '(' +
      notes[semitones[start + instrumentOffset * direction]] +
      ')'
  );
  return semitones[start + instrumentOffset * direction];
}

export function toSlashNotation(noteNameWithOctave) {
  if (!noteNameWithOctave) {
    return;
  }
  // Vexflow expects C/4, translate C4 to C/4 etc
  return `${noteNameWithOctave.replace(/\d+$/, '')}/${
    noteNameWithOctave.match(/\d+$/)[0]
  }`;
}
