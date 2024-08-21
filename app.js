let audioContext;
let instrumentSelect = document.getElementById('instrumentSelect');
let pitchControl = document.getElementById('pitchControl');
let pitchValue = document.getElementById('pitchValue');

document.addEventListener('DOMContentLoaded', loadSettings);

instrumentSelect.addEventListener('change', () => {
    saveSettings();
});
pitchControl.addEventListener('input', () => {
    pitchValue.textContent = pitchControl.value;
    saveSettings();
});
document.getElementById('playButton').addEventListener('click', playSound);
document.getElementById('addSyllableButton').addEventListener('click', addSyllable);
document.getElementById('downloadButton').addEventListener('click', downloadEditedSound);

function createSound(instrumentType, frequency) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    let oscillator = audioContext.createOscillator();
    let gainNode = audioContext.createGain();
    let duration = 1; // 音の長さ（秒）

    switch (instrumentType) {
        case 'windows7-error':
            // Windows 7 エラー音風
            oscillator = audioContext.createOscillator();
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(600, audioContext.currentTime + duration);
            break;
        case 'windows8-start':
            // Windows 8 起動音風
            oscillator = audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(880, audioContext.currentTime + duration);
            break;
        case 'pikachu':
            // ピカチュートーン
            oscillator = audioContext.createOscillator();
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(1000, audioContext.currentTime + duration);
            break;
        case 'windowsxp-error':
            // Windows XP エラー音風
            oscillator = audioContext.createOscillator();
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(500, audioContext.currentTime + duration);
            break;
        case 'windows7-start':
            // Windows 7 起動音風
            oscillator = audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(1000, audioContext.currentTime + duration);
            break;
        case 'windows11-start':
            // Windows 11 起動音風
            oscillator = audioContext.createOscillator();
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(800, audioContext.currentTime + duration);
            break;
        case 'drum':
            // ドラム風音
            oscillator = audioContext.createBufferSource();
            let buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
            let data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() - 0.5) * 2; // ランダムなドラム音
            }
            oscillator.buffer = buffer;
            break;
        case 'other':
            // その他の音
            oscillator = audioContext.createOscillator();
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.linearRampToValueAtTime(900, audioContext.currentTime + duration);
            break;
        default:
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            break;
    }

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    return { oscillator, gainNode };
}

function playSound() {
    let instrumentType = instrumentSelect.value;
    let frequency = 440 * Math.pow(2, (pitchControl.value) / 12); // 標準A440からの調整

    if (audioContext) {
        let { oscillator, gainNode } = createSound(instrumentType, frequency);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 1); // 1秒間再生
    }
}

function addSyllable() {
    let newIndex = syllableSelect.options.length + 1;
    let newOption = document.createElement("option");
    newOption.value = `syllable${newIndex}`;
    newOption.text = `音節 ${newIndex}`;
    syllableSelect.add(newOption);

    // 新しい音節を選択
    syllableSelect.value = newOption.value;
    saveSettings();
}

function saveSettings() {
    localStorage.setItem('instrument', instrumentSelect.value);
    localStorage.setItem('syllable', syllableSelect.value);
    localStorage.setItem('pitch', pitchControl.value);
}

function loadSettings() {
    let savedInstrument = localStorage.getItem('instrument');
    let savedSyllable = localStorage.getItem('syllable');
    let savedPitch = localStorage.getItem('pitch');

    if (savedInstrument) {
        instrumentSelect.value = savedInstrument;
    }
    
    if (savedSyllable) {
        syllableSelect.value = savedSyllable;
    }

    if (savedPitch) {
        pitchControl.value = savedPitch;
        pitchValue.textContent = savedPitch;
    }
}

function downloadEditedSound() {
    if (!audioContext) return;

    let instrumentType = instrumentSelect.value;
    let frequency = 440 * Math.pow(2, (pitchControl.value) / 12); // 標準A440からの調整
    let { oscillator, gainNode } = createSound(instrumentType, frequency);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1); // 1秒間の音を生成

    oscillator.onended = () => {
        let renderedBuffer = audioContext.createBufferSource().buffer; // 一時的なバッファを使用
        let wavArrayBuffer = bufferToWave(renderedBuffer);
        let audioBlob = new Blob([new Uint8Array(wavArrayBuffer)], { type: 'audio/wav' });
        let url = URL.createObjectURL(audioBlob);
        let a = document.createElement('a');
        a.href = url;
        a.download = 'edited_sound.wav';
        a.click();
    };
}

function bufferToWave(buffer) {
    let length = buffer.length * buffer.numberOfChannels * 2 + 44;
    let view = new DataView(new ArrayBuffer(length));
    let channels = [];
    let offset = 0;
    let pos = 0;

    // RIFF Chunk Descriptor
    writeString(view, pos, 'RIFF'); pos += 4;
    view.setUint32(pos, length - 8, true); pos += 4;
    writeString(view, pos, 'WAVE'); pos += 4;

    // fmt sub-chunk
    writeString(view, pos, 'fmt '); pos += 4;
    view.setUint32(pos, 16, true); pos += 4;
    view.setUint16(pos, 1, true); pos += 2;
    view.setUint16(pos, buffer.numberOfChannels, true); pos += 2;
    view.setUint32(pos, buffer.sampleRate, true); pos += 4;
    view.setUint32(pos, buffer.sampleRate * 4, true); pos += 4;
    view.setUint16(pos, buffer.numberOfChannels * 2, true); pos += 2;
    view.setUint16(pos, 16, true); pos += 2;

    // data sub-chunk
    writeString(view, pos, 'data'); pos += 4;
    view.setUint32(pos, length - pos - 4, true); pos += 4;

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    let sampleCount = buffer.length;
    let bytesPerSample = 2;

    for (let i = 0; i < sampleCount; i++) {
        for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
            let sample = channels[channel][i] * 0x7FFF;
            view.setInt16(pos, sample, true);
            pos += bytesPerSample;
        }
    }

    return view.buffer;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
