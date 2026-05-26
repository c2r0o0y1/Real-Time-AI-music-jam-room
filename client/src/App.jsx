import React, { useEffect, useMemo, useRef, useState } from 'react';
import { requestMidiInputs } from './midi';
import { createSocket } from './websocket';
import { playBassNote, stopAllPlayback } from './audioEngine';
import { detectSimpleChord, midiNoteToName } from './musicTheory';
import { encodeAudioChunkBase64, listAudioInputDevices, startAudioInput, stopAudioInput } from './audioInput';
import AppHeader from './components/AppHeader';
import TransportBar from './components/TransportBar';
import SessionSetupPanel from './components/SessionSetupPanel';
import AudioInputPanel from './components/AudioInputPanel';
import AIBandPanel from './components/AIBandPanel';
import ArrangementView from './components/ArrangementView';
import MixerPanel from './components/MixerPanel';
import AIEngineStatus from './components/AIEngineStatus';
import UpcomingSegmentPanel from './components/UpcomingSegmentPanel';
import BufferHealthBar from './components/BufferHealthBar';
import AdvancedConnectionPanel from './components/AdvancedConnectionPanel';
import JamHistoryPanel from './components/JamHistoryPanel';
import EventLog from './components/EventLog';
import { startMidiInput } from './services/midiService';
import { connectAIEngine, disconnectAIEngine, sendToAIEngine, subscribeAIEngineStatus } from './services/aiEngineSocket';

const DEFAULT_WS_URL = 'ws://localhost:8000/ws/session/demo-session';
const MAX_LOG_EVENTS = 10;

const addRecent = (setter, event, max = MAX_LOG_EVENTS) => setter((prev) => [event, ...prev].slice(0, max));

const defaultBand = {
  bass: { label: 'AI Bass', enabled: true, volume: 0.7, muted: false, solo: false, status: 'Listening', clipCount: 0, color: '#40d99a' },
  drums: { label: 'AI Drums', enabled: true, volume: 0.65, muted: false, solo: false, status: 'Waiting', clipCount: 0, color: '#ffb84d' },
  piano: { label: 'AI Piano', enabled: false, volume: 0.5, muted: true, solo: false, status: 'Muted', clipCount: 0, color: '#57a3ff' },
  guitar: { label: 'AI Guitar', enabled: false, volume: 0.5, muted: true, solo: false, status: 'Muted', clipCount: 0, color: '#ff7b9e' },
  strings: { label: 'AI Strings', enabled: false, volume: 0.5, muted: true, solo: false, status: 'Muted', clipCount: 0, color: '#bb8cff' },
  synth_pad: { label: 'AI Synth Pad', enabled: false, volume: 0.5, muted: true, solo: false, status: 'Muted', clipCount: 0, color: '#67e3ff' },
  melody: { label: 'AI Melody', enabled: false, volume: 0.5, muted: true, solo: false, status: 'Muted', clipCount: 0, color: '#f06dff' },
};

function makeClip({ track, instrument, startTimeMs, durationMs, notes, source, name, muted = false, loopMs }) {
  return {
    id: `clip_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`,
    track,
    instrument,
    startTimeMs,
    durationMs,
    notes,
    source,
    name,
    muted,
    startPct: ((startTimeMs % loopMs) / loopMs) * 100,
    widthPct: Math.max(2, (durationMs / loopMs) * 100),
  };
}

function mapAiTrack(type) {
  const t = String(type || '').toLowerCase();
  if (t.includes('drum')) return { key: 'drums', label: 'AI Drums' };
  if (t.includes('piano')) return { key: 'piano', label: 'AI Piano' };
  if (t.includes('guitar')) return { key: 'guitar', label: 'AI Guitar' };
  if (t.includes('string')) return { key: 'strings', label: 'AI Strings' };
  if (t.includes('synth')) return { key: 'synth_pad', label: 'AI Synth Pad' };
  if (t.includes('melody')) return { key: 'melody', label: 'AI Melody' };
  return { key: 'bass', label: 'AI Bass' };
}

export default function App() {
  const [sessionMode, setSessionMode] = useState('stopped');
  const [inputSource, setInputSource] = useState('midi');
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [midiStatus, setMidiStatus] = useState('Not connected');
  const [midiInputStatus, setMidiInputStatus] = useState('MIDI Ready');
  const [midiInputDevices, setMidiInputDevices] = useState([]);
  const [lastSentMidiEvent, setLastSentMidiEvent] = useState(null);
  const [aiEngineConnectionStatus, setAiEngineConnectionStatus] = useState('offline');
  const [wsUrl, setWsUrl] = useState(DEFAULT_WS_URL);
  const [showAdvancedConnectionSettings, setShowAdvancedConnectionSettings] = useState(false);
  const [selectedInput, setSelectedInput] = useState('None');
  const [inputNames, setInputNames] = useState([]);

  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState('');
  const [selectedAudioDeviceName, setSelectedAudioDeviceName] = useState('None');
  const [audioStatus, setAudioStatus] = useState('Not Started');
  const [audioMonitoring, setAudioMonitoring] = useState(false);
  const [audioGain, setAudioGain] = useState(1);
  const [audioLevel, setAudioLevel] = useState(0);

  const [userInstrument, setUserInstrument] = useState('MIDI Keyboard');
  const [genre, setGenre] = useState('Pop');
  const [mood, setMood] = useState('Energetic');
  const [selectedKey, setSelectedKey] = useState('Auto Detect');
  const [timeSignature, setTimeSignature] = useState('4/4');

  const [bpm, setBpm] = useState(90);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [loopEnabled, setLoopEnabled] = useState(true);
  const [countInEnabled, setCountInEnabled] = useState(false);
  const [loopLengthBars, setLoopLengthBars] = useState(4);
  const [quantize, setQuantize] = useState('1/8');
  const [swing, setSwing] = useState(0);
  const [inputMonitoring, setInputMonitoring] = useState(true);
  const [aiMonitoring, setAiMonitoring] = useState(true);

  const [responsiveness, setResponsiveness] = useState(3);
  const [creativity, setCreativity] = useState(2);
  const [humanize, setHumanize] = useState(true);
  const [fallbackMode, setFallbackMode] = useState('Repeat Previous Pattern');
  const [generateEnabled, setGenerateEnabled] = useState(true);

  const [demoProgression, setDemoProgression] = useState('Am - F - C - G');
  const [aiBand, setAiBand] = useState(defaultBand);
  const [userVolume, setUserVolume] = useState(0.8);
  const [aiVolume, setAiVolume] = useState(0.7);

  const [activeNotes, setActiveNotes] = useState([]);
  const [recentMidiEvents, setRecentMidiEvents] = useState([]);
  const [recentAiEvents, setRecentAiEvents] = useState([]);
  const [clips, setClips] = useState([]);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [playheadMs, setPlayheadMs] = useState(0);
  const [currentBar, setCurrentBar] = useState(1);
  const [currentBeat, setCurrentBeat] = useState(1);

  const [musicContext, setMusicContext] = useState({
    chord: 'Listening...',
    key: 'Estimating...',
    confidence: 'Waiting...',
    detectedPitch: 'Waiting for backend...',
  });

  const [metrics, setMetrics] = useState({
    roundTripLatencyMs: null,
    lastResponseTime: null,
    playbackBufferHealth: 'Empty',
    playbackBufferSize: 0,
    midiSentCount: 0,
    aiReceivedCount: 0,
    missedDeadlineCount: 0,
    droppedCount: 0,
    audioChunksSent: 0,
    audioAvgChunkDurationMs: 0,
    lastAudioChunkSentTime: null,
    audioCaptureErrors: 0,
  });

  const [upcomingSegment, setUpcomingSegment] = useState({ startsInMs: 800, durationLabel: '1 bar / 2 sec', instruments: 'Bass, Drums', deadline: 'On Time', bufferReady: '1.2 sec' });

  const socketRef = useRef(null);
  const demoTimersRef = useRef([]);
  const lastAiEventAtRef = useRef(null);
  const clockStartRef = useRef(null);
  const lastAudioClipAtRef = useRef(0);
  const stopMidiRef = useRef(() => {});

  const isPlaying = sessionMode === 'playing' || sessionMode === 'recording' || sessionMode === 'demo';
  const isRecording = sessionMode === 'recording';
  const loopMs = loopLengthBars * 4 * (60000 / (bpm || 90));
  const aiBandRef = useRef(aiBand);
  const aiMonitoringRef = useRef(aiMonitoring);
  const aiVolumeRef = useRef(aiVolume);
  const isRecordingRef = useRef(isRecording);
  const sessionModeRef = useRef(sessionMode);
  const playheadMsRef = useRef(playheadMs);
  const loopMsRef = useRef(loopMs);

  useEffect(() => { aiBandRef.current = aiBand; }, [aiBand]);
  useEffect(() => { aiMonitoringRef.current = aiMonitoring; }, [aiMonitoring]);
  useEffect(() => { aiVolumeRef.current = aiVolume; }, [aiVolume]);
  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { sessionModeRef.current = sessionMode; }, [sessionMode]);
  useEffect(() => { playheadMsRef.current = playheadMs; }, [playheadMs]);
  useEffect(() => { loopMsRef.current = loopMs; }, [loopMs]);

  const recommendedAudioInstruments = new Set(['Guitar', 'Voice', 'Violin', 'Acoustic Piano', 'Drums', 'Other']);
  const recommendation = recommendedAudioInstruments.has(userInstrument) ? 'Recommended input: Audio Interface / Microphone' : '';

  const aiEngineStatus = useMemo(() => {
    if (wsStatus !== 'connected') return 'Offline';
    if (fallbackMode !== 'Repeat Previous Pattern') return 'Fallback';
    const last = lastAiEventAtRef.current;
    if (!last) return 'Waiting';
    return Date.now() - last < 1200 ? 'Generating' : 'Connected';
  }, [wsStatus, fallbackMode, metrics.aiReceivedCount]);

  const aiEngineStatusLabel = useMemo(() => {
    if (aiEngineConnectionStatus === 'connected') return 'AI Engine Connected';
    if (aiEngineConnectionStatus === 'connecting') return 'AI Engine Connecting';
    if (aiEngineConnectionStatus === 'error') return 'AI Engine Error';
    return 'AI Engine Offline';
  }, [aiEngineConnectionStatus]);

  const contextPayload = useMemo(() => ({
    input_source: inputSource,
    user_instrument: userInstrument,
    genre,
    mood,
    selected_key: selectedKey,
    time_signature: timeSignature,
    bpm,
    is_playing: isPlaying,
    is_recording: isRecording,
    session_mode: sessionMode,
    metronome_enabled: metronomeOn,
    count_in_enabled: countInEnabled,
    loop_enabled: loopEnabled,
    loop_length_bars: loopLengthBars,
    quantize,
    swing,
    input_monitoring: inputMonitoring,
    ai_monitoring: aiMonitoring,
    responsiveness,
    creativity,
    humanize,
    fallback_mode: fallbackMode,
    generate_enabled: generateEnabled,
    ai_band: Object.fromEntries(Object.entries(aiBand).map(([k, ch]) => [k, { enabled: ch.enabled, volume: ch.volume, muted: ch.muted, solo: ch.solo }])),
  }), [inputSource, userInstrument, genre, mood, selectedKey, timeSignature, bpm, isPlaying, isRecording, sessionMode, metronomeOn, countInEnabled, loopEnabled, loopLengthBars, quantize, swing, inputMonitoring, aiMonitoring, responsiveness, creativity, humanize, fallbackMode, generateEnabled, aiBand]);

  useEffect(() => {
    const unsub = subscribeAIEngineStatus((status) => setAiEngineConnectionStatus(status));
    return () => unsub();
  }, []);

  useEffect(() => {
    socketRef.current = createSocket({
      url: wsUrl,
      onStatusChange: setWsStatus,
      onMessage: (msg) => {
        const now = Date.now();
        if (!msg || typeof msg !== 'object') {
          setMetrics((m) => ({ ...m, droppedCount: m.droppedCount + 1 }));
          return;
        }

        if (msg.type === 'audio_features') {
          setMusicContext((prev) => ({
            ...prev,
            detectedPitch: msg.detected_pitch || prev.detectedPitch,
            chord: msg.detected_chord || prev.chord,
            key: msg.estimated_key || prev.key,
            confidence: typeof msg.confidence === 'number' ? `${Math.round(msg.confidence * 100)}%` : prev.confidence,
          }));
          addRecent(setRecentAiEvents, { ...msg, timestamp: now });
          return;
        }

        lastAiEventAtRef.current = now;
        setMetrics((m) => ({ ...m, aiReceivedCount: m.aiReceivedCount + 1, playbackBufferSize: Math.min(64, m.playbackBufferSize + 1), lastResponseTime: new Date(now).toLocaleTimeString(), roundTripLatencyMs: msg.received_timestamp ? Math.max(0, now - msg.received_timestamp) : m.roundTripLatencyMs }));

        if (msg.type === 'bass_note') {
          const track = mapAiTrack('bass');
          const channel = aiBandRef.current[track.key];
          if (aiMonitoringRef.current && channel?.enabled && !channel.muted) {
            playBassNote(msg.note, msg.velocity, msg.duration_ms, channel.volume * aiVolumeRef.current).catch(() => setMetrics((m) => ({ ...m, droppedCount: m.droppedCount + 1 })));
          }
          addRecent(setRecentAiEvents, { ...msg, timestamp: now });
          if (isRecordingRef.current || sessionModeRef.current === 'demo') {
            const clip = makeClip({ track: track.label, instrument: track.label.replace('AI ', ''), startTimeMs: playheadMsRef.current, durationMs: msg.duration_ms || 450, notes: [{ note: msg.note, velocity: msg.velocity, startOffsetMs: 0, durationMs: msg.duration_ms || 450 }], source: 'ai', name: `${track.label} Pattern`, muted: false, loopMs: loopMsRef.current });
            setClips((prev) => [clip, ...prev].slice(0, 200));
          }
          return;
        }

        if (msg.type === 'accompaniment_segment' && Array.isArray(msg.notes)) {
          const track = mapAiTrack(msg.track || 'bass');
          const maxOffset = Math.max(...msg.notes.map((n) => n.start_offset_ms || 0), 0);
          setUpcomingSegment({ startsInMs: maxOffset, durationLabel: `${Math.round((msg.segment_duration_ms || 1000) / 1000)} sec`, instruments: track.label.replace('AI ', ''), deadline: maxOffset > 180 ? 'Late' : 'On Time', bufferReady: `${((msg.segment_duration_ms || 1000) / 1000).toFixed(1)} sec` });
          msg.notes.forEach((n) => {
            if ((n.start_offset_ms || 0) > 180) setMetrics((m) => ({ ...m, missedDeadlineCount: m.missedDeadlineCount + 1 }));
            if (aiMonitoringRef.current && aiBandRef.current[track.key]?.enabled && !aiBandRef.current[track.key]?.muted) {
              window.setTimeout(() => playBassNote(n.note, n.velocity, n.duration_ms, aiBandRef.current[track.key].volume * aiVolumeRef.current).catch(() => setMetrics((m) => ({ ...m, droppedCount: m.droppedCount + 1 }))), n.start_offset_ms || 0);
            }
          });
          const clip = makeClip({ track: track.label, instrument: track.label.replace('AI ', ''), startTimeMs: playheadMsRef.current, durationMs: msg.segment_duration_ms || 1000, notes: msg.notes.map((n) => ({ note: n.note, velocity: n.velocity, startOffsetMs: n.start_offset_ms || 0, durationMs: n.duration_ms || 350 })), source: 'ai', name: `${track.label} Segment`, loopMs: loopMsRef.current });
          setClips((prev) => [clip, ...prev].slice(0, 200));
          addRecent(setRecentAiEvents, { ...msg, timestamp: now });
        }
      },
    });

    return () => {
      socketRef.current?.disconnect();
      stopMidiRef.current?.();
      demoTimersRef.current.forEach((id) => clearTimeout(id));
      stopAudioInput();
    };
  }, [wsUrl]);

  useEffect(() => () => {
    disconnectAIEngine();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const last = lastAiEventAtRef.current;
      let health = 'Empty';
      if (last) {
        const delta = now - last;
        if (delta <= 2000) health = 'Healthy';
        else if (delta <= 5000) health = 'Warning';
      }
      setMetrics((m) => ({ ...m, playbackBufferHealth: health }));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    clockStartRef.current = Date.now() - playheadMs;
    const tick = setInterval(() => {
      const elapsed = Date.now() - clockStartRef.current;
      const nextPlayhead = loopEnabled ? elapsed % loopMs : elapsed;
      const beatMs = 60000 / bpm;
      setPlayheadMs(nextPlayhead);
      setCurrentBeat(Math.floor((nextPlayhead % (beatMs * 4)) / beatMs) + 1);
      setCurrentBar(Math.floor(nextPlayhead / (beatMs * 4)) + 1);
    }, 40);
    return () => clearInterval(tick);
  }, [isPlaying, bpm, loopEnabled, loopMs]);

  useEffect(() => {
    if (inputSource !== 'audio') return;
    setMusicContext((prev) => ({ ...prev, chord: 'Waiting for backend...', key: 'Waiting for backend...', confidence: 'Waiting...' }));
  }, [inputSource]);

  useEffect(() => {
    const chord = detectSimpleChord(activeNotes);
    if (inputSource !== 'audio' && chord) setMusicContext((prev) => ({ ...prev, chord }));
  }, [activeNotes, inputSource]);

  const dispatchPerformanceEvent = (event, source = 'user') => {
    addRecent(setRecentMidiEvents, event);
    setActiveNotes((prev) => {
      if (event.type === 'note_on') return [...new Set([...prev, event.note])];
      if (event.type === 'note_off') return prev.filter((n) => n !== event.note);
      return prev;
    });

    if (isRecording || source === 'demo') {
      const clip = makeClip({ track: 'User MIDI', instrument: userInstrument, startTimeMs: playheadMs, durationMs: event.type === 'note_on' ? 320 : 90, notes: [{ note: event.note, velocity: event.velocity, startOffsetMs: 0, durationMs: event.type === 'note_on' ? 320 : 90 }], source, name: source === 'demo' ? 'Demo Chord Clip' : 'Live MIDI Clip', loopMs });
      setClips((prev) => [clip, ...prev].slice(0, 200));
    }

    const payload = { ...event, client_context: { ...contextPayload, input_source: source === 'demo' ? 'demo' : 'midi' } };
    if (socketRef.current?.isConnected()) {
      const sent = socketRef.current.sendJson(payload);
      setMetrics((m) => ({ ...m, midiSentCount: sent ? m.midiSentCount + 1 : m.midiSentCount, droppedCount: sent ? m.droppedCount : m.droppedCount + 1 }));
    }
  };

  const refreshAudioDevices = async () => {
    try {
      const devices = await listAudioInputDevices();
      setAudioDevices(devices);
      if (devices.length === 0) {
        setAudioStatus('No Device Found');
      }
      if (selectedAudioDeviceId && !devices.some((d) => d.deviceId === selectedAudioDeviceId)) {
        setSelectedAudioDeviceId('');
        setSelectedAudioDeviceName('None');
      }
    } catch (err) {
      setAudioStatus(`Error: ${err.message}`);
      setMetrics((m) => ({ ...m, audioCaptureErrors: m.audioCaptureErrors + 1 }));
    }
  };

  useEffect(() => {
    if (inputSource === 'audio') {
      refreshAudioDevices();
    }
  }, [inputSource]);

  const startAudio = async () => {
    setAudioStatus('Permission Needed');
    try {
      const info = await startAudioInput({
        deviceId: selectedAudioDeviceId || undefined,
        monitorEnabled: audioMonitoring,
        gain: audioGain,
        onLevel: (level) => setAudioLevel(level),
        onAudioChunk: (float32, sampleRate) => {
          const now = Date.now();
          const durationMs = Math.round((float32.length / sampleRate) * 1000);

          if (now - lastAudioClipAtRef.current > 250) {
            lastAudioClipAtRef.current = now;
            const clip = makeClip({ track: 'User Audio', instrument: `${userInstrument} Input`, startTimeMs: playheadMs, durationMs: 120, notes: [], source: 'audio', name: 'Audio Chunk', loopMs });
            setClips((prev) => [clip, ...prev].slice(0, 200));
          }

          setMetrics((m) => ({
            ...m,
            audioAvgChunkDurationMs: m.audioAvgChunkDurationMs === 0 ? durationMs : Math.round((m.audioAvgChunkDurationMs * 0.8) + (durationMs * 0.2)),
          }));

          if (!generateEnabled) return;
          if (!socketRef.current?.isConnected()) return;

          try {
            const audio_data = encodeAudioChunkBase64(float32);
            const payload = {
              type: 'audio_chunk',
              timestamp: now,
              sample_rate: sampleRate,
              channels: 1,
              format: 'pcm16_base64',
              duration_ms: durationMs,
              audio_data,
              client_context: { ...contextPayload, input_source: 'audio' },
            };
            const sent = socketRef.current.sendJson(payload);
            if (sent) {
              setMetrics((m) => ({ ...m, audioChunksSent: m.audioChunksSent + 1, lastAudioChunkSentTime: new Date(now).toLocaleTimeString() }));
            }
          } catch {
            setMetrics((m) => ({ ...m, audioCaptureErrors: m.audioCaptureErrors + 1 }));
          }
        },
      });

      const dev = audioDevices.find((d) => d.deviceId === selectedAudioDeviceId);
      setSelectedAudioDeviceName(dev?.label || 'Default Input');
      setAudioStatus(`Listening @ ${info.sampleRate}Hz`);
    } catch (err) {
      setAudioStatus(`Error: ${err.message}`);
      setMetrics((m) => ({ ...m, audioCaptureErrors: m.audioCaptureErrors + 1 }));
    }
  };

  const stopAudio = async () => {
    await stopAudioInput();
    setAudioStatus('Not Started');
    setAudioLevel(0);
  };

  const handleConnectMidi = async () => {
    const result = await requestMidiInputs((event) => dispatchPerformanceEvent(event, 'user'), setMidiStatus);
    setInputNames(result.inputNames);
    setSelectedInput(result.selectedInputName || 'None');
  };

  const updateMidiLocalActivity = (message) => {
    const normalizedEvent = {
      type: message.event,
      note: message.note,
      velocity: message.velocity,
      timestamp: message.timestamp,
    };

    addRecent(setRecentMidiEvents, normalizedEvent);
    setLastSentMidiEvent(message);

    setActiveNotes((prev) => {
      if (message.event === 'note_on') return [...new Set([...prev, message.note])];
      if (message.event === 'note_off') return prev.filter((n) => n !== message.note);
      return prev;
    });

    const laneEvent = makeClip({
      track: 'User MIDI',
      instrument: userInstrument,
      startTimeMs: playheadMs,
      durationMs: message.event === 'note_on' ? 320 : 90,
      notes: [{ note: message.note, velocity: message.velocity, startOffsetMs: 0, durationMs: message.event === 'note_on' ? 320 : 90 }],
      source: 'user',
      name: 'MIDI Event',
      loopMs,
    });
    setClips((prev) => [laneEvent, ...prev].slice(0, 200));
  };

  const sendMidiMessageToBackend = (message) => {
    const sent = sendToAIEngine(message);
    updateMidiLocalActivity(message);

    setMetrics((m) => ({
      ...m,
      midiSentCount: sent ? m.midiSentCount + 1 : m.midiSentCount,
      droppedCount: sent ? m.droppedCount : m.droppedCount + 1,
    }));
  };

  const startMidiHotPath = async () => {
    stopMidiRef.current?.();
    stopMidiRef.current = await startMidiInput({
      onMidiEvent: (message) => sendMidiMessageToBackend(message),
      onStatusChange: ({ status, devices }) => {
        setMidiInputDevices(devices || []);
        if (status === 'ready') setMidiInputStatus('MIDI Ready');
        else if (status === 'no_device') setMidiInputStatus('No MIDI Device');
        else if (status === 'not_supported') setMidiInputStatus('MIDI Not Supported');
        else setMidiInputStatus('MIDI Error');
      },
      onError: (error) => {
        if (String(error?.message || '').includes('not supported')) {
          setMidiInputStatus('Web MIDI is not supported in this browser. Try Chrome or Edge.');
        } else {
          setMidiInputStatus('MIDI Error');
        }
      },
    });
  };

  const sendManualMidi = (event, note, velocity) => {
    const message = {
      type: 'midi_event',
      event,
      note,
      velocity,
      timestamp: Date.now(),
    };
    sendMidiMessageToBackend(message);
  };

  const sendCNote = () => {
    sendManualMidi('note_on', 60, 100);
    setTimeout(() => sendManualMidi('note_off', 60, 0), 180);
  };

  const sendChord = (notes) => {
    notes.forEach((n) => sendManualMidi('note_on', n, 100));
    setTimeout(() => notes.forEach((n) => sendManualMidi('note_off', n, 0)), 280);
  };

  const canSendManualMidi = aiEngineConnectionStatus === 'connected';

  const startLiveJam = () => setSessionMode('playing');
  const stopSession = () => {
    setSessionMode('stopped');
    stopAllPlayback();
    demoTimersRef.current.forEach((id) => clearTimeout(id));
    demoTimersRef.current = [];
  };
  const toggleRecord = () => setSessionMode((prev) => (prev === 'recording' ? 'playing' : 'recording'));

  const progressionMap = {
    'Am - F - C - G': [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]],
    'C - G - Am - F': [[48, 52, 55], [55, 59, 62], [57, 60, 64], [53, 57, 60]],
    'Dm - G - C - Am': [[50, 53, 57], [55, 59, 62], [48, 52, 55], [57, 60, 64]],
    '12-Bar Blues': [[48, 52, 55], [48, 52, 55], [53, 57, 60], [48, 52, 55]],
    'ii - V - I Jazz': [[50, 53, 57], [55, 59, 62], [48, 52, 55], [48, 52, 55]],
  };

  const runDemoJam = () => {
    setSessionMode('demo');
    setInputSource('demo');
    demoTimersRef.current.forEach((id) => clearTimeout(id));
    demoTimersRef.current = [];
    const chords = progressionMap[demoProgression] || progressionMap['Am - F - C - G'];
    const chordMs = Math.round((60000 / bpm) * 2);
    chords.forEach((notes, chordIndex) => {
      notes.forEach((note) => {
        const startAt = chordIndex * chordMs;
        const onId = setTimeout(() => dispatchPerformanceEvent({ type: 'note_on', note, velocity: 96, timestamp: Date.now() }, 'demo'), startAt);
        const offId = setTimeout(() => dispatchPerformanceEvent({ type: 'note_off', note, velocity: 0, timestamp: Date.now() }, 'demo'), startAt + chordMs - 80);
        demoTimersRef.current.push(onId, offId);
      });
    });
  };

  const onUpdateChannel = (channelKey, patch) => {
    setAiBand((prev) => {
      const next = { ...prev, [channelKey]: { ...prev[channelKey], ...patch } };
      if ('muted' in patch && patch.muted) next[channelKey].status = 'Muted';
      else if ('enabled' in patch && !patch.enabled) next[channelKey].status = 'Waiting';
      else next[channelKey].status = 'Listening';
      return next;
    });
  };

  const lanes = [
    { key: 'user_midi', label: 'User MIDI', muted: false, volume: userVolume, status: inputSource === 'midi' ? 'Listening' : 'Waiting', color: '#4f85ff' },
    { key: 'user_audio', label: 'User Audio', muted: false, volume: audioGain / 2, status: audioStatus.startsWith('Listening') ? 'Listening' : 'Waiting', color: '#7ad3ff' },
    ...Object.entries(aiBand).map(([key, ch]) => ({ key, label: ch.label, muted: ch.muted, volume: ch.volume, status: ch.status, color: ch.color })),
  ];

  const arrangementClips = clips.map((clip) => ({ ...clip, startPct: ((clip.startTimeMs % loopMs) / loopMs) * 100, widthPct: Math.max(2, (clip.durationMs / loopMs) * 100) }));

  const audioSignalLabel = audioLevel < 0.08 ? 'Low' : audioLevel > 0.85 ? 'Clipping' : 'Healthy';

  return (
    <div className="jam-app">
      <AppHeader sessionMode={sessionMode} midiStatus={midiStatus} latencyMs={metrics.roundTripLatencyMs} bufferHealth={metrics.playbackBufferHealth} aiEngineStatus={aiEngineStatus} onToggleSettings={() => setShowAdvancedConnectionSettings((v) => !v)} />

      <TransportBar sessionMode={sessionMode} bpm={bpm} selectedKey={selectedKey} timeSignature={timeSignature} metronomeOn={metronomeOn} loopEnabled={loopEnabled} countInEnabled={countInEnabled} onStartLiveJam={startLiveJam} onStop={stopSession} onRecord={toggleRecord} onDemoJam={runDemoJam} onBpm={(v) => setBpm(Math.min(240, Math.max(40, Number.isFinite(v) ? v : 90)))} onKey={setSelectedKey} onTimeSignature={setTimeSignature} onMetronome={() => setMetronomeOn((v) => !v)} onLoop={() => setLoopEnabled((v) => !v)} onCountIn={() => setCountInEnabled((v) => !v)} />

      <div className="layout-grid">
        <aside className="left-sidebar">
          <SessionSetupPanel inputSource={inputSource} userInstrument={userInstrument} genre={genre} mood={mood} selectedKey={selectedKey} timeSignature={timeSignature} onInputSource={setInputSource} onUserInstrument={setUserInstrument} onGenre={setGenre} onMood={setMood} onKey={setSelectedKey} onTimeSignature={setTimeSignature} />

          {recommendation ? <section className="panel"><p className="small">{recommendation}</p></section> : null}

          {inputSource === 'midi' || inputSource === 'demo' ? (
            <section className="panel">
              <h2>Live MIDI Input</h2>
              <div className="row wrap">
                <button className="btn" onClick={() => { setAiEngineConnectionStatus('connecting'); connectAIEngine(wsUrl); }}>Connect AI Engine</button>
                <button className="btn secondary" onClick={startMidiHotPath}>Start MIDI Input</button>
              </div>
              <button className="btn" onClick={handleConnectMidi}>Connect MIDI</button>
              <p className="small">{aiEngineStatusLabel}</p>
              <p className="small">{midiInputStatus}</p>
              <p className="small">Input: {selectedInput}</p>
              <p className="small">Devices: {inputNames.length ? inputNames.join(', ') : 'No MIDI input found.'}</p>
              <p className="small">MIDI Inputs: {midiInputDevices.length ? midiInputDevices.join(', ') : 'None detected'}</p>
              <p className="small">Active Notes: {activeNotes.length ? activeNotes.map((n) => `${n}(${midiNoteToName(n)})`).join(', ') : 'None'}</p>
              <div className="row wrap">
                <button className="btn secondary" onClick={sendCNote} disabled={!canSendManualMidi}>Send C Note</button>
                <button className="btn secondary" onClick={() => sendChord([60, 64, 67])} disabled={!canSendManualMidi}>Send C Major Chord</button>
                <button className="btn secondary" onClick={() => sendChord([57, 60, 64])} disabled={!canSendManualMidi}>Send A Minor Chord</button>
              </div>
              {lastSentMidiEvent ? (
                <p className="small">Last Sent: {lastSentMidiEvent.event} n={lastSentMidiEvent.note} v={lastSentMidiEvent.velocity}</p>
              ) : null}
              <label>Demo Progression
                <select value={demoProgression} onChange={(e) => setDemoProgression(e.target.value)}>
                  <option>Am - F - C - G</option><option>C - G - Am - F</option><option>Dm - G - C - Am</option><option>12-Bar Blues</option><option>ii - V - I Jazz</option>
                </select>
              </label>
            </section>
          ) : null}

          {inputSource === 'audio' ? (
            <AudioInputPanel
              devices={audioDevices}
              selectedDeviceId={selectedAudioDeviceId}
              audioStatus={audioStatus}
              monitoring={audioMonitoring}
              gain={audioGain}
              level={audioLevel}
              onSelectDevice={(id) => setSelectedAudioDeviceId(id)}
              onRefresh={refreshAudioDevices}
              onStart={startAudio}
              onStop={stopAudio}
              onMonitoring={() => setAudioMonitoring((v) => !v)}
              onGain={setAudioGain}
            />
          ) : null}

          <section className="panel">
            <h2>Production Controls</h2>
            <label>Quantize
              <select value={quantize} onChange={(e) => setQuantize(e.target.value)}><option>Off</option><option>1/4</option><option>1/8</option><option>1/16</option></select>
            </label>
            <label>Swing: {swing}%<input type="range" min="0" max="60" value={swing} onChange={(e) => setSwing(Number(e.target.value))} /></label>
            <label>Loop Length (bars)
              <select value={loopLengthBars} onChange={(e) => setLoopLengthBars(Number(e.target.value))}><option value={1}>1</option><option value={2}>2</option><option value={4}>4</option><option value={8}>8</option></select>
            </label>
            <label className="toggle"><input type="checkbox" checked={inputMonitoring} onChange={() => setInputMonitoring((v) => !v)} />Input monitoring</label>
            <label className="toggle"><input type="checkbox" checked={aiMonitoring} onChange={() => setAiMonitoring((v) => !v)} />AI monitoring</label>
          </section>
        </aside>

        <main className="center-workspace">
          <ArrangementView lanes={lanes} clips={arrangementClips} selectedClipId={selectedClipId} onSelectClip={setSelectedClipId} onLaneMute={(k) => { if (aiBand[k]) onUpdateChannel(k, { muted: !aiBand[k].muted }); }} onLaneVolume={(k, v) => (k === 'user_midi' ? setUserVolume(v) : (k === 'user_audio' ? setAudioGain(v * 2) : onUpdateChannel(k, { volume: v })))} playheadPct={Math.min(100, (playheadMs / Math.max(loopMs, 1)) * 100)} />

          <JamHistoryPanel clips={clips} selectedClipId={selectedClipId} onSelectClip={setSelectedClipId} onRename={(id, name) => setClips((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)))} onDelete={(id) => setClips((prev) => prev.filter((c) => c.id !== id))} onDuplicate={(id) => setClips((prev) => {
            const clip = prev.find((c) => c.id === id);
            if (!clip) return prev;
            const dup = { ...clip, id: `clip_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`, name: `${clip.name} Copy`, startTimeMs: clip.startTimeMs + clip.durationMs };
            return [dup, ...prev];
          })} onMute={(id) => setClips((prev) => prev.map((c) => (c.id === id ? { ...c, muted: !c.muted } : c)))} />
        </main>

        <aside className="right-sidebar">
          <AIBandPanel channels={aiBand} onUpdateChannel={onUpdateChannel} />

          <MixerPanel userVolume={userVolume} aiVolume={aiVolume} muteAi={false} soloAi={false} onUserVolume={setUserVolume} onAiVolume={setAiVolume} onMuteAi={() => {}} onSoloAi={() => {}} />

          <section className="panel">
            <h2>Music Context</h2>
            <p className="small">Input Source: {inputSource === 'audio' ? 'Audio' : inputSource === 'demo' ? 'Demo Jam' : 'MIDI'}</p>
            <p className="small">Audio Device: {selectedAudioDeviceName}</p>
            <p className="small">Signal Level: {Math.round(audioLevel * 100)}% ({audioSignalLabel})</p>
            <p className="small">Detected Chord: {inputSource === 'audio' ? musicContext.chord : detectSimpleChord(activeNotes)}</p>
            <p className="small">Estimated Key: {inputSource === 'audio' ? musicContext.key : selectedKey}</p>
            <p className="small">Tempo: {bpm}</p>
            <p className="small">Confidence: {musicContext.confidence}</p>
          </section>

          <section className="panel">
            <h2>AI Controls</h2>
            <label>Responsiveness: {responsiveness}<input type="range" min="1" max="5" value={responsiveness} onChange={(e) => setResponsiveness(Number(e.target.value))} /></label>
            <label>Creativity: {creativity}<input type="range" min="1" max="5" value={creativity} onChange={(e) => setCreativity(Number(e.target.value))} /></label>
            <label className="toggle"><input type="checkbox" checked={humanize} onChange={() => setHumanize((v) => !v)} />Humanize</label>
            <label>Fallback Mode
              <select value={fallbackMode} onChange={(e) => setFallbackMode(e.target.value)}><option>Repeat Previous Pattern</option><option>Extend Current Chord</option><option>Rule-Based Bassline</option><option>Silence Only If Needed</option></select>
            </label>
            <label className="toggle"><input type="checkbox" checked={generateEnabled} onChange={() => setGenerateEnabled((v) => !v)} />Enable AI accompaniment</label>
            <div className="small">Bar {currentBar}, Beat {currentBeat}</div>
          </section>

          <AIEngineStatus status={aiEngineStatus} />
          <BufferHealthBar health={metrics.playbackBufferHealth} />
          <UpcomingSegmentPanel segment={upcomingSegment} />
          <section className="panel">
            <h2>Audio Metrics</h2>
            <p className="small">Audio stream: {audioStatus}</p>
            <p className="small">Audio chunks sent: {metrics.audioChunksSent}</p>
            <p className="small">Avg chunk: {metrics.audioAvgChunkDurationMs} ms</p>
            <p className="small">Last audio chunk sent: {metrics.lastAudioChunkSentTime || '--'}</p>
            <p className="small">Audio capture errors: {metrics.audioCaptureErrors}</p>
            {!generateEnabled ? <p className="small">AI generation disabled.</p> : null}
            {wsStatus !== 'connected' ? <p className="small">AI Engine Offline — audio is not being analyzed.</p> : null}
          </section>
        </aside>
      </div>

      <div className="bottom-drawer">
        <EventLog title="Event Logs" events={recentMidiEvents} />
        <EventLog title="AI Response Logs" events={recentAiEvents} />
        <AdvancedConnectionPanel open={showAdvancedConnectionSettings} wsUrl={wsUrl} wsStatus={wsStatus} onWsUrl={setWsUrl} onConnect={() => socketRef.current?.connect(wsUrl)} onDisconnect={() => socketRef.current?.disconnect()} onToggle={() => setShowAdvancedConnectionSettings((v) => !v)} onTestBass={() => playBassNote(36, 80, 500, aiVolume)} />
      </div>
    </div>
  );
}
