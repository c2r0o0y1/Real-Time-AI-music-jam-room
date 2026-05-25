let audioContext = null;
let mediaStream = null;
let sourceNode = null;
let analyserNode = null;
let gainNode = null;
let monitorNode = null;
let processorNode = null;

function ensureContext() {
  if (!audioContext) audioContext = new window.AudioContext();
  return audioContext;
}

export async function listAudioInputDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    throw new Error('mediaDevices API is not supported in this browser.');
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((d) => d.kind === 'audioinput');
}

export function floatTo16BitPCM(float32Array) {
  const pcm = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i += 1) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return pcm;
}

export function encodeAudioChunkBase64(float32Array) {
  const pcm16 = floatTo16BitPCM(float32Array);
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return window.btoa(binary);
}

export async function startAudioInput({ deviceId, onAudioChunk, onLevel, monitorEnabled = false, gain = 1 }) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Audio capture is not supported in this browser.');
  }

  await stopAudioInput();

  const constraints = {
    audio: deviceId ? { deviceId: { exact: deviceId }, channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false } : true,
  };

  mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  const ctx = ensureContext();
  if (ctx.state === 'suspended') await ctx.resume();

  sourceNode = ctx.createMediaStreamSource(mediaStream);
  analyserNode = ctx.createAnalyser();
  analyserNode.fftSize = 1024;

  gainNode = ctx.createGain();
  gainNode.gain.value = gain;

  sourceNode.connect(gainNode);
  gainNode.connect(analyserNode);

  if (monitorEnabled) {
    monitorNode = ctx.createGain();
    monitorNode.gain.value = 1;
    gainNode.connect(monitorNode);
    monitorNode.connect(ctx.destination);
  }

  // Prototype path: ScriptProcessorNode is deprecated; replace with AudioWorklet for production latency.
  processorNode = ctx.createScriptProcessor(4096, 1, 1);
  analyserNode.connect(processorNode);
  processorNode.connect(ctx.destination);

  const levelData = new Float32Array(analyserNode.fftSize);
  let lastLevelAt = 0;

  processorNode.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0);
    const copy = new Float32Array(input.length);
    copy.set(input);

    if (typeof onAudioChunk === 'function') onAudioChunk(copy, ctx.sampleRate);

    const now = performance.now();
    if (now - lastLevelAt > 50) {
      analyserNode.getFloatTimeDomainData(levelData);
      let sumSq = 0;
      for (let i = 0; i < levelData.length; i += 1) sumSq += levelData[i] * levelData[i];
      const rms = Math.sqrt(sumSq / levelData.length);
      if (typeof onLevel === 'function') onLevel(Math.min(1, rms * 3));
      lastLevelAt = now;
    }
  };

  return {
    sampleRate: ctx.sampleRate,
    channels: 1,
  };
}

export async function stopAudioInput() {
  if (processorNode) {
    processorNode.onaudioprocess = null;
    processorNode.disconnect();
    processorNode = null;
  }
  if (monitorNode) {
    monitorNode.disconnect();
    monitorNode = null;
  }
  if (analyserNode) {
    analyserNode.disconnect();
    analyserNode = null;
  }
  if (gainNode) {
    gainNode.disconnect();
    gainNode = null;
  }
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
}
