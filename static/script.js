const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const notes = {
    'a': { freq: 261.63 },
    's': { freq: 293.66 },
    'd': { freq: 329.63 },
    'f': { freq: 349.23 },
    'j': { freq: 392.00 },
    'k': { freq: 440.00 },
    'l': { freq: 493.88 },
    ';': { freq: 523.25 }
};

const physicalKeys = {
    // High Octave (+1)
    'q': { base: 'a', rowShift: 1 },
    'w': { base: 's', rowShift: 1 },
    'e': { base: 'd', rowShift: 1 },
    'r': { base: 'f', rowShift: 1 },
    'u': { base: 'j', rowShift: 1 },
    'i': { base: 'k', rowShift: 1 },
    'o': { base: 'l', rowShift: 1 },
    'p': { base: ';', rowShift: 1 },
    // Base Octave (0)
    'a': { base: 'a', rowShift: 0 },
    's': { base: 's', rowShift: 0 },
    'd': { base: 'd', rowShift: 0 },
    'f': { base: 'f', rowShift: 0 },
    'j': { base: 'j', rowShift: 0 },
    'k': { base: 'k', rowShift: 0 },
    'l': { base: 'l', rowShift: 0 },
    ';': { base: ';', rowShift: 0 },
    // Low Octave (-1)
    'z': { base: 'a', rowShift: -1 },
    'x': { base: 's', rowShift: -1 },
    'c': { base: 'd', rowShift: -1 },
    'v': { base: 'f', rowShift: -1 },
    'n': { base: 'j', rowShift: -1 },
    'm': { base: 'k', rowShift: -1 },
    ',': { base: 'l', rowShift: -1 },
    '.': { base: ';', rowShift: -1 },
};

const notationSystems = {
    'cdef': ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'],
    'doremi': ['Do', 'Re', 'Mi', 'Fa', 'So', 'La', 'Ti', 'Do'],
    'sarega': ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Dha', 'Ni', 'Sa']
};
const octaves = ['4', '4', '4', '4', '4', '4', '4', '5'];
const noteKeys = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'];

let octaveShift = 0;

function updateNotation() {
    const system = document.getElementById('notation-select').value;
    const names = notationSystems[system];
    
    const rows = [
        { keys: ['q', 'w', 'e', 'r', 'u', 'i', 'o', 'p'], offset: 1 },
        { keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'], offset: 0 },
        { keys: ['z', 'x', 'c', 'v', 'n', 'm', ',', '.'], offset: -1 }
    ];

    rows.forEach(row => {
        row.keys.forEach((key, index) => {
            const keyElement = document.querySelector(`.key[data-key="${key}"]`);
            if (keyElement) {
                const label = names[index];
                const baseOctave = parseInt(octaves[index], 10);
                const currentOctave = baseOctave + octaveShift + row.offset;
                keyElement.querySelector('span').innerHTML = `${label}<sup>${currentOctave}</sup>`;
                keyElement.setAttribute('data-note', `${label}${currentOctave}`);
                
                if (row.offset === 0) {
                    notes[key].name = `${label}${currentOctave}`;
                }
            }
        });
    });
}

document.getElementById('notation-select').addEventListener('change', updateNotation);

// Theme Toggle
const themeToggleBtn = document.getElementById('theme-toggle');
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        themeToggleBtn.textContent = '🌙';
    } else {
        themeToggleBtn.textContent = '☀️';
    }
});

let trainingMode = false;
let currentTargetNote = null;
let currentTargetShift = 0;
let score = 0;

const startBtn = document.getElementById('start-btn');
const scoreDisplay = document.getElementById('score');
const messageDisplay = document.getElementById('message');

function playTone(frequency) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine'; // A smooth tone
    oscillator.frequency.value = frequency;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Envelope to avoid clicks
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.0);
    
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 1.0);
}

const activeTones = {};

function startTone(id, frequency) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (activeTones[id]) return;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.05);
    
    oscillator.start(audioCtx.currentTime);
    
    activeTones[id] = { oscillator, gainNode };
}

function stopTone(id) {
    if (activeTones[id]) {
        const { oscillator, gainNode } = activeTones[id];
        
        gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        oscillator.stop(audioCtx.currentTime + 0.1);
        delete activeTones[id];
    }
}

function handleKeyDownAction(inputKey) {
    const keyInfo = physicalKeys[inputKey];
    if (!keyInfo) return;
    
    if (activeTones[inputKey]) return; // Prevent re-trigger on hold
    
    const baseKey = keyInfo.base;
    const totalShift = octaveShift + keyInfo.rowShift;

    // Provide audio feedback
    const shiftMultiplier = Math.pow(2, totalShift);
    startTone(inputKey, notes[baseKey].freq * shiftMultiplier);
    
    // Visual feedback
    const keyElement = document.querySelector(`.key[data-key="${inputKey}"]`);
    if (keyElement) {
        keyElement.classList.add('active');
        const count = parseInt(keyElement.dataset.activeCount || '0') + 1;
        keyElement.dataset.activeCount = count;
    }
    
    // Game logic
    if (trainingMode && currentTargetNote) {
        if (baseKey === currentTargetNote && totalShift === currentTargetShift) {
            score++;
            scoreDisplay.textContent = score;
            messageDisplay.textContent = "Correct! Listen to the next note.";
            messageDisplay.className = "message correct";
            currentTargetNote = null;
            setTimeout(playRandomNote, 1000);
        } else {
            score = 0;
            scoreDisplay.textContent = score;
            messageDisplay.textContent = "Incorrect. Try again!";
            messageDisplay.className = "message incorrect";
            // Replay the target note so they can hear it again
            setTimeout(() => {
                if (currentTargetNote) {
                    const shiftMult = Math.pow(2, currentTargetShift);
                    playTone(notes[currentTargetNote].freq * shiftMult);
                }
            }, 500);
        }
    }
}

function handleKeyUpAction(inputKey) {
    const keyInfo = physicalKeys[inputKey];
    if (!keyInfo) return;
    
    stopTone(inputKey);
    
    const baseKey = keyInfo.base;
    const keyElement = document.querySelector(`.key[data-key="${inputKey}"]`);
    if (keyElement) {
        const count = Math.max(0, parseInt(keyElement.dataset.activeCount || '0') - 1);
        keyElement.dataset.activeCount = count;
        if (count === 0) {
            keyElement.classList.remove('active');
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
        if (octaveShift !== 1) {
            octaveShift = 1;
            updateNotation();
        }
    } else if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling
        if (octaveShift !== -1) {
            octaveShift = -1;
            updateNotation();
        }
    }

    const key = e.key.toLowerCase();
    if (physicalKeys[key]) {
        // Prevent default browser action for mapped keys
        if ([';', ',', '.'].includes(e.key)) e.preventDefault(); 
        
        if (!e.repeat) {
            handleKeyDownAction(key);
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift' && octaveShift === 1) {
        octaveShift = 0;
        updateNotation();
    } else if (e.code === 'Space' && octaveShift === -1) {
        octaveShift = 0;
        updateNotation();
    }
    
    const key = e.key.toLowerCase();
    if (physicalKeys[key]) {
        handleKeyUpAction(key);
    }
});

document.querySelectorAll('.key').forEach(keyElement => {
    const inputKey = keyElement.dataset.key;
    
    keyElement.addEventListener('mousedown', () => {
        handleKeyDownAction(inputKey);
    });
    
    keyElement.addEventListener('mouseup', () => {
        handleKeyUpAction(inputKey);
    });
    
    keyElement.addEventListener('mouseleave', () => {
        handleKeyUpAction(inputKey);
    });
});

function playRandomNote() {
    const randomKey = noteKeys[Math.floor(Math.random() * noteKeys.length)];
    currentTargetNote = randomKey;
    currentTargetShift = octaveShift;
    const shiftMultiplier = Math.pow(2, octaveShift);
    playTone(notes[randomKey].freq * shiftMultiplier);
    messageDisplay.textContent = "What note is this?";
    messageDisplay.className = "message";
}

startBtn.addEventListener('click', () => {
    trainingMode = true;
    score = 0;
    scoreDisplay.textContent = score;
    startBtn.textContent = "Restart Training";
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    // Small delay before starting
    setTimeout(playRandomNote, 500);
});

// Initialize notation on load
updateNotation();