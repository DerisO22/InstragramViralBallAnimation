// Musical note frequencies (in Hz) - Extended range
export const noteFrequencies = {
    'C4': 261.63,
    'Db4': 277.18,
    'D4': 293.66,
    'Eb4': 311.13,
    'E4': 329.63,
    'F4': 349.23,
    'Gb4': 369.99,
    'G4': 392.00,
    'Ab4': 415.30,
    'A4': 440.00,
    'Bb4': 466.16,
    'B4': 493.88,
    'C5': 523.25,
    'Db5': 554.37,
    'D5': 587.33,
    'Eb5': 622.25,
    'E5': 659.25,
    'F5': 698.46,
    'Gb5': 739.99,
    'G5': 783.99,
    'Ab5': 830.61,
    'A5': 880.00,
    'Bb5': 932.33,
    'B5': 987.77
};

// Instruments
export const instruments = {
    piano: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.3,
        release: 1.0,
        waveform: 'triangle',
        harmonics: [1, 0.5, 0.25, 0.125]
    },
    guitar: {
        attack: 0.02,
        decay: 0.5,
        sustain: 0.4,
        release: 1.5,
        waveform: 'sawtooth',
        harmonics: [1, 0.7, 0.4, 0.2, 0.1]
    },
    bell: {
        attack: 0.01,
        decay: 2.0,
        sustain: 0.1,
        release: 3.0,
        waveform: 'sine',
        harmonics: [1, 0.6, 0.4, 0.3, 0.2, 0.15, 0.1]
    },
    organ: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.8,
        release: 0.5,
        waveform: 'square',
        harmonics: [1, 0.8, 0.6, 0.4, 0.2]
    },
    flute: {
        attack: 0.2,
        decay: 0.3,
        sustain: 0.6,
        release: 0.8,
        waveform: 'sine',
        harmonics: [1, 0.3, 0.1, 0.05]
    },
    synth: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.5,
        release: 1.0,
        waveform: 'sawtooth',
        harmonics: [1, 0.8, 0.6, 0.4, 0.3, 0.2, 0.1]
    }
};