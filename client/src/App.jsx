import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";

const SceneExperience = lazy(() => import("./SceneExperience.jsx"));

function useFestivalAudio() {
  const audioRef = useRef(null);
  const settingsRef = useRef({ music: true, effects: true, master: 0.78 });

  const getAudio = useCallback(async () => {
    if (!audioRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      const context = new AudioContextClass();
      const master = context.createGain();
      const music = context.createGain();
      const effects = context.createGain();
      master.gain.value = settingsRef.current.master;
      music.gain.value = settingsRef.current.music ? 0.44 : 0.0001;
      effects.gain.value = settingsRef.current.effects ? 0.76 : 0.0001;
      music.connect(master);
      effects.connect(master);
      master.connect(context.destination);
      audioRef.current = { context, master, music, effects, musicNodes: [], musicTimer: null, musicStarted: false };
    }
    if (audioRef.current.context.state === "suspended") await audioRef.current.context.resume();
    return audioRef.current;
  }, []);

  const setMusicEnabled = useCallback((enabled) => {
    settingsRef.current.music = enabled;
    const audio = audioRef.current;
    if (audio) audio.music.gain.setTargetAtTime(enabled ? 0.44 : 0.0001, audio.context.currentTime, 0.12);
  }, []);

  const setEffectsEnabled = useCallback((enabled) => {
    settingsRef.current.effects = enabled;
    const audio = audioRef.current;
    if (audio) audio.effects.gain.setTargetAtTime(enabled ? 0.76 : 0.0001, audio.context.currentTime, 0.08);
  }, []);

  const setMasterVolume = useCallback((value) => {
    settingsRef.current.master = value;
    const audio = audioRef.current;
    if (audio) audio.master.gain.setTargetAtTime(value, audio.context.currentTime, 0.08);
  }, []);

  const startMusic = useCallback(async () => {
    const audio = await getAudio();
    if (!audio || audio.musicStarted) return;
    audio.musicStarted = true;
    const { context, music } = audio;
    // Original ambient bed: a warm tanpura-like drone and a slow, bell-like motif.
    [110, 164.81, 220].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();
      oscillator.type = index === 1 ? "triangle" : "sine";
      oscillator.frequency.value = frequency;
      filter.type = "lowpass";
      filter.frequency.value = 940;
      gain.gain.value = index === 0 ? 0.09 : 0.031;
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(music);
      oscillator.start();
      audio.musicNodes.push(oscillator, gain, filter);
    });
    const notes = [392, 440, 523.25, 587.33, 523.25, 440, 349.23, 392];
    let index = 0;
    const playBell = () => {
      if (!audioRef.current || context.state === "closed") return;
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const overtone = context.createOscillator();
      const gain = context.createGain();
      const overtoneGain = context.createGain();
      const frequency = notes[index % notes.length];
      oscillator.type = "sine";
      overtone.type = "sine";
      oscillator.frequency.value = frequency;
      overtone.frequency.value = frequency * 2.006;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.072, now + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.25);
      overtoneGain.gain.setValueAtTime(0.0001, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.016, now + 0.025);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
      oscillator.connect(gain); gain.connect(music);
      overtone.connect(overtoneGain); overtoneGain.connect(music);
      oscillator.start(now); overtone.start(now);
      oscillator.stop(now + 2.3); overtone.stop(now + 1.3);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); overtone.disconnect(); overtoneGain.disconnect(); };
      index += 1;
    };
    playBell();
    audio.musicTimer = window.setInterval(playBell, 1900);
  }, [getAudio]);

  const playIgnition = useCallback(async () => {
    const audio = await getAudio();
    if (!audio) return;
    const { context, effects } = audio;
    const now = context.currentTime;
    const length = Math.floor(context.sampleRate * 0.28);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.4);
    const strike = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const strikeGain = context.createGain();
    strike.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 1250;
    strikeGain.gain.setValueAtTime(0.0001, now);
    strikeGain.gain.exponentialRampToValueAtTime(0.14, now + 0.018);
    strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    strike.connect(filter); filter.connect(strikeGain); strikeGain.connect(effects);
    strike.start(now); strike.stop(now + 0.3);
    [660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(index ? 0.035 : 0.055, now + 0.055);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
      oscillator.connect(gain); gain.connect(effects);
      oscillator.start(now + 0.025); oscillator.stop(now + 1.2);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }, [getAudio]);

  const playRocket = useCallback(async () => {
    const audio = await getAudio();
    if (!audio) return;
    const { context, effects } = audio;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(290 + Math.random() * 90, now);
    oscillator.frequency.exponentialRampToValueAtTime(1180 + Math.random() * 280, now + 0.82);
    oscillator.frequency.exponentialRampToValueAtTime(720, now + 1.02);
    filter.type = "bandpass";
    filter.frequency.value = 1050;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.11);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.04);
    oscillator.connect(filter); filter.connect(gain); gain.connect(effects);
    oscillator.start(now); oscillator.stop(now + 1.06);
    oscillator.onended = () => { oscillator.disconnect(); filter.disconnect(); gain.disconnect(); };
  }, [getAudio]);

  const playFirework = useCallback(async () => {
    const audio = await getAudio();
    if (!audio) return;
    const { context, effects } = audio;
    const now = context.currentTime;
    const length = Math.floor(context.sampleRate * 1.45);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.6);
    }
    const noise = context.createBufferSource();
    const lowPass = context.createBiquadFilter();
    const boom = context.createGain();
    noise.buffer = buffer;
    lowPass.type = "lowpass";
    lowPass.frequency.setValueAtTime(2100, now);
    lowPass.frequency.exponentialRampToValueAtTime(320, now + 1.4);
    boom.gain.setValueAtTime(0.0001, now);
    boom.gain.exponentialRampToValueAtTime(0.24, now + 0.06);
    boom.gain.exponentialRampToValueAtTime(0.0001, now + 1.42);
    noise.connect(lowPass); lowPass.connect(boom); boom.connect(effects);
    noise.start(now); noise.stop(now + 1.46);
    const crackleLength = Math.floor(context.sampleRate * 0.62);
    const crackleBuffer = context.createBuffer(1, crackleLength, context.sampleRate);
    const crackleData = crackleBuffer.getChannelData(0);
    for (let i = 0; i < crackleLength; i += 1) crackleData[i] = (Math.random() * 2 - 1) * (Math.random() > 0.985 ? 0.95 : 0.12) * (1 - i / crackleLength);
    const crackle = context.createBufferSource();
    const highPass = context.createBiquadFilter();
    const crackleGain = context.createGain();
    crackle.buffer = crackleBuffer;
    highPass.type = "highpass";
    highPass.frequency.value = 1700;
    crackleGain.gain.setValueAtTime(0.0001, now + 0.18);
    crackleGain.gain.exponentialRampToValueAtTime(0.13, now + 0.24);
    crackleGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.82);
    crackle.connect(highPass); highPass.connect(crackleGain); crackleGain.connect(effects);
    crackle.start(now + 0.18); crackle.stop(now + 0.84);
  }, [getAudio]);

  useEffect(() => () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.musicTimer) window.clearInterval(audio.musicTimer);
    audio.musicNodes.forEach((node) => {
      try { if (node.stop) node.stop(); } catch {}
      try { node.disconnect(); } catch {}
    });
    audio.context.close().catch(() => {});
    audioRef.current = null;
  }, []);

  return { startMusic, playIgnition, playRocket, playFirework, setMusicEnabled, setEffectsEnabled, setMasterVolume };
}

function SceneError({ message }) {
  return <div className="scene-fallback"><div className="fallback-mark">✺</div><h1>The night is preparing.</h1><p>{message || "This browser could not start the 3D scene. Please try a current Chrome, Edge or Safari browser with hardware acceleration enabled."}</p></div>;
}

class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError?.(); }
  render() {
    return this.state.failed ? <SceneError /> : this.props.children;
  }
}

export default function App() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const [sender, setSender] = useState(query.get("from") || "Abhivocopedia");
  const [recipient, setRecipient] = useState(query.get("to") || "");
  const [wish, setWish] = useState(query.get("wish") || "May your home be filled with warmth, your heart with peace, and your days with new light.");
  const [startedAt, setStartedAt] = useState(null);
  const [phase, setPhase] = useState(0);
  const [musicOn, setMusicOn] = useState(true);
  const [effectsOn, setEffectsOn] = useState(true);
  const [volume, setVolume] = useState(0.78);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneFailed, setSceneFailed] = useState(false);
  const audio = useFestivalAudio();

  useEffect(() => {
    try {
      const probe = document.createElement("canvas");
      const context = probe.getContext("webgl2", { failIfMajorPerformanceCaveat: false });
      if (!context) setSceneFailed(true);
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      setSceneFailed(true);
    }
  }, []);

  useEffect(() => { audio.setMusicEnabled(musicOn); }, [musicOn, audio.setMusicEnabled]);
  useEffect(() => { audio.setEffectsEnabled(effectsOn); }, [effectsOn, audio.setEffectsEnabled]);
  useEffect(() => { audio.setMasterVolume(volume); }, [volume, audio.setMasterVolume]);

  const ignite = useCallback(() => {
    if (startedAt !== null) return;
    setStartedAt(performance.now());
    setPhase(1);
    void audio.startMusic();
    void audio.playIgnition();
  }, [startedAt, audio.startMusic, audio.playIgnition]);

  const handleRocket = useCallback(() => {
    if (effectsOn) void audio.playRocket();
  }, [effectsOn, audio.playRocket]);

  const handleBoom = useCallback(() => {
    if (effectsOn) void audio.playFirework();
  }, [effectsOn, audio.playFirework]);

  const handlePhase = useCallback((nextPhase) => setPhase(nextPhase), []);

  const skipToGreeting = () => {
    if (startedAt === null) {
      void audio.startMusic();
      setStartedAt(performance.now() - 51000);
    } else {
      setStartedAt(performance.now() - 51000);
    }
    setPhase(6);
  };

  const replay = () => {
    setStartedAt(null);
    setPhase(0);
    setSceneReady(true);
    setCopied(false);
  };

  const makeShareUrl = () => {
    const url = new URL(window.location.href);
    const cleanSender = sender.trim().slice(0, 48);
    const cleanRecipient = recipient.trim().slice(0, 48);
    const cleanWish = wish.trim().slice(0, 180);
    cleanSender ? url.searchParams.set("from", cleanSender) : url.searchParams.delete("from");
    cleanRecipient ? url.searchParams.set("to", cleanRecipient) : url.searchParams.delete("to");
    cleanWish ? url.searchParams.set("wish", cleanWish) : url.searchParams.delete("wish");
    return url.toString();
  };

  const shareGreeting = async () => {
    const url = makeShareUrl();
    const title = recipient ? `A Diwali wish for ${recipient}` : "A Diwali wish for you";
    const text = `${wish.trim()} — with warm wishes from ${sender.trim() || "someone special"}.`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2400);
        return;
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
    window.prompt("Copy your Diwali greeting link", url);
  };

  const phaseCopy = {
    1: "One small flame. A thousand possibilities.",
    2: "May warmth find its way into every corner.",
    3: "A home becomes brighter when light is shared.",
    4: "A little colour. A little wonder.",
    5: "Send your wishes a little closer to the stars.",
  };

  return (
    <main className="diwali-app">
      <div className="scene-shell">
        {!sceneFailed ? (
          <SceneErrorBoundary onError={() => setSceneFailed(true)}>
            <Suspense fallback={null}>
              <SceneExperience
                startAt={startedAt}
                onIgnite={ignite}
                onPhase={handlePhase}
                onLaunch={handleRocket}
                onBoom={handleBoom}
                onReady={() => setSceneReady(true)}
              />
            </Suspense>
          </SceneErrorBoundary>
        ) : <SceneError />}
      </div>

      {!sceneReady && !sceneFailed && <div className="scene-loader"><span className="loader-lamp">✺</span><span>SETTING THE COURTYARD AGLOW</span></div>}

      <header className="topbar">
        <a className="brand-lockup" href="#top" aria-label="Diwali Sky home">
          <span className="brand-symbol">✺</span>
          <span><strong>DIWALI SKY</strong><small>THE COURTYARD OF LIGHT</small></span>
        </a>
        <div className="top-controls">
          <button className={`sound-control ${effectsOn ? "is-on" : ""}`} onClick={() => setEffectsOn((value) => !value)} aria-label="Toggle sound effects" aria-pressed={effectsOn}><span>♫</span><i>FX</i></button>
          <button className={`sound-control ${musicOn ? "is-on" : ""}`} onClick={() => setMusicOn((value) => !value)} aria-label="Toggle background music" aria-pressed={musicOn}><span>♬</span><i>MUSIC</i></button>
          <button className={`settings-button ${settingsOpen ? "is-open" : ""}`} onClick={() => setSettingsOpen((value) => !value)} aria-label="Personalize greeting" aria-expanded={settingsOpen}>✧</button>
        </div>
      </header>

      {startedAt === null && sceneReady && !sceneFailed && (
        <div className="intro-hint" aria-live="polite">
          <span className="hint-line" />
          <span className="hint-label">TAP THE LONE DIYA TO BEGIN</span>
          <small>A small light can change the whole night</small>
        </div>
      )}

      {startedAt !== null && phase > 0 && phase < 6 && (
        <div className="chapter-caption" key={phase}>
          <span className="caption-star">✦</span>{phaseCopy[phase]}
        </div>
      )}

      {startedAt !== null && phase >= 6 && (
        <section className="final-greeting" aria-live="polite">
          <div className="final-eyebrow"><span /> A WISH SENT WITH LIGHT <span /></div>
          <h1>Happy <em>Diwali</em></h1>
          <p className="recipient-line">{recipient.trim() ? `For ${recipient.trim()}, with love` : "May light find you, wherever you are."}</p>
          <p className="wish-copy">{wish}</p>
          <div className="sender-signature"><span>WITH WARM WISHES FROM</span><strong>{sender.trim() || "Someone special"}</strong></div>
          <div className="final-actions">
            <button className="share-button" onClick={shareGreeting}><span>↗</span>{copied ? "LINK COPIED" : "SHARE THIS LIGHT"}</button>
            <button className="replay-button" onClick={replay}>REPLAY THE MOMENT ↺</button>
          </div>
        </section>
      )}

      {startedAt !== null && phase < 6 && <button className="skip-button" onClick={skipToGreeting}>SKIP TO GREETING ↗</button>}

      {settingsOpen && (
        <aside className="personalize-panel">
          <div className="panel-heading"><div><small>MAKE IT PERSONAL</small><h2>A little note.</h2></div><button onClick={() => setSettingsOpen(false)} aria-label="Close personalization">×</button></div>
          <label htmlFor="sender">SENDING THIS LIGHT FROM</label>
          <input id="sender" maxLength={48} value={sender} onChange={(event) => setSender(event.target.value)} placeholder="Your name" />
          <label htmlFor="recipient">THIS WISH IS FOR</label>
          <input id="recipient" maxLength={48} value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Someone special (optional)" />
          <label htmlFor="wish">YOUR DIWALI WISH</label>
          <textarea id="wish" rows={3} maxLength={180} value={wish} onChange={(event) => setWish(event.target.value)} />
          <label className="volume-label" htmlFor="volume">MASTER VOLUME <span>{Math.round(volume * 100)}%</span></label>
          <input id="volume" className="volume-slider" type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(Number(event.target.value))} />
          <p>Names and your message are included in the personal greeting link.</p>
          <div className="panel-buttons">
            <button className="panel-done" onClick={() => setSettingsOpen(false)}>SAVE GREETING</button>
            <button className="panel-share" onClick={shareGreeting}>SHARE LINK ↗</button>
          </div>
        </aside>
      )}

      <footer className="bottom-meta">
        <span>AN IMMERSIVE DIWALI EXPERIENCE</span><span className="bottom-divider"/><span>MADE OF LIGHT, SHARED WITH LOVE</span>
      </footer>
    </main>
  );
}
