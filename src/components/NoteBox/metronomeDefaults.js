// The default behaviour of the metronome is to beat
// noisily on every opportunity. For some meters, this
// is not expected, particularly the faster ones.
// If a meter is NOT mentioned here, every _denominator_
// gets a beat.
// structure: object[timeDenominator][timeNumerator]
// data for 6/8 is hence in object['8']['6']

let defaults = {
  nthBeatSounded: 1,
  dotted: false,
};

let specialMeters = {
  '8': {
    '6': {
      nthBeatSounded: 2, // 3 beats per meter
    },
    '4': {
      nthBeatSounded: 2,
    },
  },
};

export function getMetronomeDefault(numerator, denominator) {
  if (specialMeters[denominator] && specialMeters[denominator][numerator]) {
    return Object.assign(
      { beatUnitNumber: denominator },
      defaults,
      specialMeters[denominator][numerator]
    );
  }
  return Object.assign({ beatUnitNumber: denominator }, defaults);
}
