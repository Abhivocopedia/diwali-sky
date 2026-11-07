import React, { useCallback, useEffect, useRef, useState } from "react";
import GrandFireworks from "grand-fireworks-js";

const PALETTES = {
  gold: ["#ffd166", "#fff0b3", "#ff9f43", "#f7c873"],
  festive: ["#ff4d6d", "#ffd166", "#06d6a0", "#4cc9f0", "#c77dff"],
  sapphire: ["#80ffdb", "#64dfdf", "#5390d9", "#6930c3", "#ffffff"]
};

function MusicBed({ enabled, volume }) {
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const stop = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    const ctx = audioRef.current?.ctx;
    if (ctx && ctx.state !== "closed") {
      const now = ctx.currentTime;
      audioRef.current.nodes.forEach((node) => {
        try {
          if (node.gain) node.gain.gain.setTargetAtTime(0, now, 0.12);
          if (node.stop) node.stop(now + 0.5);
        } catch {}
      });
      ctx.close().catch(() => {});
    }
    audioRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (audioRef.current) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    await ctx.resume();
    const master = ctx.createGain();
    master.gain.value = Math.max(0, Math.min(1, volume)) * 0.22;
    master.connect(ctx.destination);

    // A soft, original ambient bed: tanpura-like drone + gentle bell notes.
    const nodes = [];
    [110, 164.81, 220].forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = index === 1 ? "triangle" : "sine";
      osc.frequency.value = frequency;
      filter.type = "lowpass";
      filter.frequency.value = 850;
      gain.gain.value = index === 0 ? 0.16 : 0.055;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start();
      nodes.push(osc, gain, filter);
    });

    audioRef.current = { ctx, master, nodes };
    const scale = [440, 523.25, 659.25, 587.33, 523.25, 493.88, 392, 440];
    let note = 0;
    const playBell = () => {
      if (!audioRef.current) return;
      const time = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const overtone = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      osc.type = "sine";
      overtone.type = "sine";
      osc.frequency.value = scale[note % scale.length];
      overtone.frequency.value = scale[note % scale.length] * 2.01;
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(0.11, time + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.4);
      overtoneGain.gain.setValueAtTime(0.0001, time);
      overtoneGain.gain.exponentialRampToValueAtTime(0.025, time + 0.02);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, time + 1.1);
      osc.connect(gain); gain.connect(master);
      overtone.connect(overtoneGain); overtoneGain.connect(master);
      osc.start(time); overtone.start(time);
      osc.stop(time + 2.5); overtone.stop(time + 1.2);
      nodes.push(osc, gain, overtone, overtoneGain);
      note += 1;
    };
    playBell();
    timerRef.current = window.setInterval(playBell, 1750);
  }, [volume]);

  useEffect(() => {
    if (enabled) start();
    else stop();
    return stop;
  }, [enabled, start, stop]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.master.gain.setTargetAtTime(volume * 0.22, audioRef.current.ctx.currentTime, 0.08);
  }, [volume]);

  return null;
}

function Diya({ className = "" }) {
  return <div className={`diya ${className}`} aria-hidden="true"><span className="diya-flame" /><span className="diya-bowl" /><span className="diya-glow" /></div>;
}

export default function App() {
  const engineRef = useRef(null);
  const [started, setStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [volume, setVolume] = useState(0.55);
  const [palette, setPalette] = useState("gold");
  const [message, setMessage] = useState("Wishing you a luminous Diwali");
  const [showPanel, setShowPanel] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const engine = new GrandFireworks({
      baseStyle: "cinematic",
      performance: {
        preset: "high",
        fps: 60,
        maxDpr: 1.7,
        pauseWhenHidden: true,
        pauseWhenOffscreen: true,
        respectReducedMotion: true
      },
      show: {
        intensity: 0.78,
        interval: [850, 1500],
        palettes: PALETTES.gold,
        groupedSalvos: true,
        minShellScale: 0.72,
        maxShellScale: 1.18
      },
      visuals: {
        trails: true,
        trailFade: 0.105,
        bloom: 1.55,
        rocketExhaust: true,
        explosionFlashes: true,
        flashAlpha: 0.3,
        secondaryCrackle: true,
        pyroBurn: true,
        sphereBurst: true,
        shimmerChance: 0.22,
        sparkleChance: 0.16,
        starChance: 0.14,
        windStrength: 0.035,
        groupedSalvos: true
      },
      sound: {
        enabled: false,
        volume: 0.62,
        stereo: true,
        boomStyle: "mixed",
        boomVariation: 0.28,
        whistleChance: 0.12,
        maxVoices: 28,
        ambience: 0.002
      },
      finale: {
        enabled: false,
        type: "super-grand-finale",
        trails: 12,
        trailFlight: 1150,
        trailSpread: 360,
        burstScale: 1.05,
        particleScale: 0.9,
        finishDelay: 700,
        maxDuration: 10500
      }
    });
    engineRef.current = engine;
    return () => {
      try { engine.destroy(); } catch { try { engine.stop(true); } catch {} }
      engineRef.current = null;
    };
  }, []);

  const beginShow = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (soundOn) {
      try { engine.enableSound(); } catch {}
    }
    if (!started) {
      engine.start();
      setStarted(true);
    } else if (isPaused) {
      engine.resume?.();
      setIsPaused(false);
    }
    engine.launch(3);
  };

  const launchAt = (event) => {
    if (!started) beginShow();
    const engine = engineRef.current;
    if (!engine) return;
    const x = event.clientX;
    const y = event.clientY;
    const width = window.innerWidth;
    const height = window.innerHeight;
    try {
      engine.launchTo({
        x: width * (0.18 + Math.random() * 0.64),
        y: height + 8,
        targetX: x,
        targetY: y,
        duration: 850 + Math.random() * 550,
        radius: 82 + Math.random() * 55
      });
    } catch {
      engine.placeburst({ x, y, radius: 115 });
    }
  };

  const changePalette = (next) => {
    setPalette(next);
    engineRef.current?.setOptions({ show: { palettes: PALETTES[next] } });
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    if (next && started) {
      try { engineRef.current?.enableSound(); } catch {}
      try { engineRef.current?.setMuted(false); } catch {}
    } else {
      try { engineRef.current?.setMuted(true); } catch {}
    }
  };

  const finale = () => {
    if (!started) beginShow();
    try {
      if (soundOn) engineRef.current?.enableSound();
      engineRef.current?.launchFinale();
    } catch {}
  };

  const togglePause = () => {
    if (!started) return;
    if (isPaused) engineRef.current?.resume?.();
    else engineRef.current?.pause?.();
    setIsPaused(!isPaused);
  };

  const sendWish = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (!started) beginShow();
    const clean = message.trim().slice(0, 28).toUpperCase();
    if (clean) {
      try { engine.launchText(clean, { colors: PALETTES[palette], fontSize: 68, exclusive: true }); }
      catch { engine.launchFinale(); }
    }
  };

  return (
    <main className="app" onClick={launchAt}>
      <div className="sky-grain" />
      <div className="stars" aria-hidden="true">
        {Array.from({ length: 46 }, (_, i) => <i key={i} style={{ "--x": `${(i * 37 + 11) % 100}%`, "--y": `${(i * 61 + 7) % 68}%`, "--d": `${1.4 + (i % 4) * 0.8}s`, "--s": `${1 + (i % 3)}px` }} />)}
      </div>
      <div className="moon" aria-hidden="true"><span /></div>
      <div className="horizon-glow" aria-hidden="true" />
      <div className="temple-line" aria-hidden="true">
        <div className="temple temple-left"><b /><b /><b /><b /><b /></div>
        <div className="temple temple-center"><b /><b /><b /><b /><b /><b /><b /></div>
        <div className="temple temple-right"><b /><b /><b /><b /><b /></div>
      </div>

      <header className="topbar" onClick={(e) => e.stopPropagation()}>
        <a className="brand" href="#" aria-label="Diwali Sky home"><span className="brand-mark">✦</span><span>DIWALI <em>SKY</em></span></a>
        <div className="top-actions">
          <span className="live-dot" /> <span className="top-label">A NIGHT OF LIGHT</span>
          <button className="icon-button" onClick={() => setShowPanel(!showPanel)} aria-label="Open experience settings"><span className="sliders">☷</span></button>
        </div>
      </header>

      <section className="hero" onClick={(e) => e.stopPropagation()}>
        <div className="eyebrow"><span /> THE FESTIVAL OF LIGHTS <span /></div>
        <h1>Let the sky<br /><i>tell a story.</i></h1>
        <p className="hero-copy">A little light, a lot of wonder.<br />Make this Diwali unforgettable.</p>
        <div className="hero-cta">
          <button className="primary-button" onClick={beginShow}><span className="button-star">✦</span>{started ? "KEEP THE SKY ALIVE" : "LIGHT UP THE SKY"}<span className="button-arrow">↗</span></button>
          <span className="tap-hint">OR TAP ANYWHERE IN THE SKY</span>
        </div>
        <div className="wish-line"><span className="wish-rule" /> शुभ दीपावली <span className="wish-rule" /></div>
      </section>

      <div className="bottom-scene" aria-hidden="true">
        <div className="rangoli rangoli-left"><span /><span /><span /><span /><span /><span /></div>
        <div className="rangoli rangoli-right"><span /><span /><span /><span /><span /><span /></div>
        <Diya className="diya-left" /><Diya className="diya-right" />
        <div className="ground" />
      </div>

      <footer className="footer" onClick={(e) => e.stopPropagation()}>
        <div className="footer-left"><span className="footer-spark">✧</span><span>MADE FOR MOMENTS THAT GLOW</span></div>
        <div className="footer-center">HAPPY DIWALI <span>✦</span></div>
        <div className="footer-controls">
          <button className={`control-chip ${soundOn ? "active" : ""}`} onClick={toggleSound} title="Toggle firework sound"><span>{soundOn ? "♫" : "♪̸"}</span> SOUND</button>
          <button className={`control-chip ${musicOn ? "active" : ""}`} onClick={() => setMusicOn(!musicOn)} title="Toggle ambient music"><span>♬</span> MUSIC</button>
          <button className="control-chip finale-chip" onClick={finale}><span>✹</span> FINALE</button>
        </div>
      </footer>

      {showPanel && <aside className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head"><div><small>YOUR EXPERIENCE</small><h2>Make it yours.</h2></div><button onClick={() => setShowPanel(false)} aria-label="Close settings">×</button></div>
        <label className="field-label">FIREWORK COLOUR</label>
        <div className="palette-row">
          <button className={palette === "gold" ? "selected" : ""} onClick={() => changePalette("gold")}><i className="swatch gold" /> GOLDEN HOUR</button>
          <button className={palette === "festive" ? "selected" : ""} onClick={() => changePalette("festive")}><i className="swatch festive" /> FESTIVE</button>
          <button className={palette === "sapphire" ? "selected" : ""} onClick={() => changePalette("sapphire")}><i className="swatch sapphire" /> SAPPHIRE</button>
        </div>
        <label className="field-label" htmlFor="volume">MUSIC VOLUME <span>{Math.round(volume * 100)}%</span></label>
        <input id="volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        <label className="field-label" htmlFor="wish">WRITE A SKY MESSAGE</label>
        <div className="wish-input"><input id="wish" maxLength="28" value={message} onChange={(e) => setMessage(e.target.value)} /><button onClick={sendWish}>LAUNCH ↗</button></div>
        <div className="panel-actions">
          <button onClick={togglePause} disabled={!started}>{isPaused ? "RESUME SHOW" : "PAUSE SHOW"}</button>
          <button onClick={() => { engineRef.current?.clear(); }}>CLEAR SKY</button>
        </div>
        <p className="panel-note">Audio begins after your first interaction. Your browser controls autoplay permissions.</p>
      </aside>}

      <div className="music-mount"><MusicBed enabled={musicOn && started} volume={volume} /></div>
      <div className="interaction-note" onClick={(e) => e.stopPropagation()}>{started ? "TAP THE SKY TO LAUNCH A FIREWORK" : "YOUR SKY IS WAITING"}</div>
    </main>
  );
}
