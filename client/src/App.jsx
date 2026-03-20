import { useEffect, useMemo, useRef, useState } from "react";
import { PlantCharacter } from "./components/PlantCharacter";
import { SuggestionsPanel } from "./components/SuggestionsPanel";
import { VitalCard } from "./components/VitalCard";
import { HistoryModal } from "./components/HistoryModal";
import { useKakaData } from "./hooks/useKakaData";
import { getTimeTheme, potOptions } from "./lib/theme";
import beeGif from "./assets/animated_assets/bee.gif";
import butterflyGif from "./assets/animated_assets/butterfly.gif";
import backgroundMusic from "./assets/sound_assets/background_music.mp3";
import popClickSound from "./assets/sound_assets/pop_click.mp3";
import snoringSound from "./assets/sound_assets/snoring.mp3";

const emotes = [
  { id: "dance_bounce", label: "Bounce" },
  { id: "dance_sway", label: "Sway" },
  { id: "dance_twirl", label: "Twirl" }
];

const welcomeMessages = [
  "Hiiiii Anmol. KAKA is ready to sparkle with you today.",
  "Welcome back, Anmol. KAKA has been waiting very patiently in the sunshine.",
  "Hello Anmol cutie. Let's check how your tiny green buddy is feeling today.",
  "Anmol, KAKA is awake, adorable, and very serious about plant happiness.",
  "A soft little welcome for Anmol from KAKA and one very loved plant friend.",
  "Anmol, your cozy plant corner is ready. KAKA is here to help and cheer.",
  "Tiny leaves, big feelings, and one very cute dashboard waiting for you, Anmol.",
  "KAKA says hello hello, Anmol. Let's keep your plant comfy, happy, and thriving.",
  "Welcome to your sweet little plant world, Anmol, where KAKA keeps watch.",
  "One cute companion, one precious plant, and lots of love for Anmol right here."
];

const backgroundCritters = [
  { src: beeGif, alt: "Bee", className: "critter critter-back critter-bee-1", size: "w-16 sm:w-20" },
  { src: butterflyGif, alt: "Butterfly", className: "critter critter-back critter-butterfly-1", size: "w-20 sm:w-24" },
  { src: beeGif, alt: "Bee", className: "critter critter-back critter-bee-2", size: "w-14 sm:w-16" },
  { src: butterflyGif, alt: "Butterfly", className: "critter critter-back critter-butterfly-2", size: "w-24 sm:w-28" }
];

const foregroundCritters = [
  { src: butterflyGif, alt: "Butterfly", className: "critter critter-front critter-butterfly-4", size: "w-20 sm:w-24" },
  { src: beeGif, alt: "Bee", className: "critter critter-front critter-bee-4", size: "w-14 sm:w-18" }
];

export default function App() {
  const { latest, status, preferences, careTracker, history, loading, error, savePreferences, saveCareTracker } = useKakaData();
  const [activeMetric, setActiveMetric] = useState(null);
  const [temporaryEmote, setTemporaryEmote] = useState(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [fertilizerConfirmOpen, setFertilizerConfirmOpen] = useState(false);
  const [careBookletOpen, setCareBookletOpen] = useState(false);
  const [lastFertilizedAt, setLastFertilizedAt] = useState(null);
  const [wakeUntil, setWakeUntil] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const musicRef = useRef(null);
  const snoreRef = useRef(null);
  const clickPoolRef = useRef([]);
  const clickIndexRef = useRef(0);
  const theme = useMemo(() => getTimeTheme(), []);
  const welcomeMessage = useMemo(
    () => welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)],
    []
  );
  const effectiveVolume = isMuted ? 0 : masterVolume;

  useEffect(() => {
    if (careTracker?.fertilizer_last_added_at) {
      setLastFertilizedAt(careTracker.fertilizer_last_added_at);
    } else {
      setLastFertilizedAt(null);
    }
  }, [careTracker]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedMute = window.localStorage.getItem("kaka-muted");
    const savedVolume = window.localStorage.getItem("kaka-master-volume");
    if (savedMute) {
      setIsMuted(savedMute === "true");
    }
    if (savedVolume) {
      setMasterVolume(Number(savedVolume));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("kaka-muted", String(isMuted));
    window.localStorage.setItem("kaka-master-volume", String(masterVolume));
  }, [isMuted, masterVolume]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const music = new Audio(backgroundMusic);
    music.preload = "auto";
    music.loop = true;
    music.volume = 0.14 * effectiveVolume;
    musicRef.current = music;

    const startMusic = () => {
      music.play().catch(() => {});
    };

    startMusic();
    document.addEventListener("click", startMusic, true);

    return () => {
      document.removeEventListener("click", startMusic, true);
      music.pause();
      music.currentTime = 0;
      musicRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = 0.14 * effectiveVolume;
    }
  }, [effectiveVolume]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const audioPool = Array.from({ length: 8 }, () => {
      const audio = new Audio(popClickSound);
      audio.preload = "auto";
      audio.volume = 0.8 * effectiveVolume;
      return audio;
    });
    clickPoolRef.current = audioPool;
    clickIndexRef.current = 0;

    const handleButtonClick = (event) => {
      if (!(event.target instanceof Element)) return;
      if (!event.target.closest("button")) return;

      if (status?.isNight) {
        setWakeUntil(Date.now() + 30000);
      }

      const currentPool = clickPoolRef.current;
      const clickAudio = currentPool[clickIndexRef.current];
      clickIndexRef.current = (clickIndexRef.current + 1) % currentPool.length;
      clickAudio.pause();
      clickAudio.currentTime = 0;
      clickAudio.play().catch(() => {});
    };

    document.addEventListener("click", handleButtonClick, true);
    return () => {
      document.removeEventListener("click", handleButtonClick, true);
      clickPoolRef.current = [];
    };
  }, [status?.isNight]);

  useEffect(() => {
    clickPoolRef.current.forEach((audio) => {
      audio.volume = 0.8 * effectiveVolume;
    });
  }, [effectiveVolume]);

  useEffect(() => {
    if (!wakeUntil) return;
    const timeoutMs = Math.max(0, wakeUntil - Date.now());
    const timeoutId = window.setTimeout(() => {
      setWakeUntil(null);
    }, timeoutMs);
    return () => window.clearTimeout(timeoutId);
  }, [wakeUntil]);

  const effectiveMood = useMemo(
    () => getEffectiveMood(status, wakeUntil),
    [status, wakeUntil]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const snoreAudio = snoreRef.current ?? new Audio(snoringSound);
    snoreAudio.preload = "auto";
    snoreAudio.loop = true;
    snoreAudio.volume = 0.18 * effectiveVolume;
    snoreRef.current = snoreAudio;
    const tryPlaySnore = () => {
      snoreAudio.play().catch(() => {});
    };

    if (effectiveMood === "sleep") {
      tryPlaySnore();
      document.addEventListener("click", tryPlaySnore, true);
    }

    return () => {
      document.removeEventListener("click", tryPlaySnore, true);
      snoreAudio.pause();
    };
  }, [effectiveMood]);

  useEffect(() => {
    if (snoreRef.current) {
      snoreRef.current.volume = 0.18 * effectiveVolume;
    }
  }, [effectiveVolume]);

  const triggerEmote = (emote) => {
    setTemporaryEmote(emote);
    playTone(emote, effectiveVolume);
    window.setTimeout(() => setTemporaryEmote(null), 7000);
  };

  const handleCharacterClick = () => {
    triggerEmote("dance_bounce");
  };

  const handleFertilizerUpdate = async () => {
    const today = new Date().toISOString();
    setLastFertilizedAt(today);
    await saveCareTracker({
      fertilizer_last_added_at: today
    });
    setFertilizerConfirmOpen(false);
  };

  const metrics = latest && status
    ? [
        { key: "soil_moisture", title: "Soil Moisture", unit: "%", value: latest.soil_moisture, status: status.statuses.soil },
        { key: "sunlight", title: "Sunlight", unit: "lx", value: latest.sunlight, status: status.statuses.sunlight },
        { key: "temperature", title: "Temperature", unit: "°C", value: latest.temperature, status: status.statuses.temperature },
        { key: "humidity", title: "Humidity", unit: "%", value: latest.humidity, status: status.statuses.humidity }
      ]
    : [];
  const primaryMetrics = metrics.slice(0, 2);
  const secondaryMetrics = metrics.slice(2, 4);
  const clientSuggestions = useMemo(
    () => buildSuggestions(status, lastFertilizedAt),
    [lastFertilizedAt, status]
  );

  return (
    <div
      className={`app-background-wave relative min-h-screen overflow-hidden bg-gradient-to-b ${theme.gradient} font-body text-slate-100`}
      style={{
        backgroundImage: `url(${theme.backgroundImage})`,
        backgroundSize: "108% 108%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className={`pointer-events-none absolute inset-0 ${theme.overlay}`} />
      <div className={`pointer-events-none absolute inset-0 ${theme.veil}`} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34vh] bg-[linear-gradient(to_top,rgba(12,24,38,0.36),transparent)]" />
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {backgroundCritters.map((critter) => (
          <img
            key={critter.className}
            src={critter.src}
            alt={critter.alt}
            className={`${critter.className} ${critter.size}`}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-[2rem] border border-white/10 bg-slate-950/30 p-6 shadow-card backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Smart plant app</p>
              <h1 className="font-display text-6xl text-white sm:text-7xl">KAKA</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                {welcomeMessage}
              </p>
            </div>
            <div className="min-w-[220px] rounded-[1.5rem] border border-sky-100/25 bg-sky-300/20 px-4 py-3 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Audio</p>
                <button
                  type="button"
                  onClick={() => setIsMuted((current) => !current)}
                  className="rounded-full border border-sky-100/30 bg-white/20 px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {isMuted ? "Unmute" : "Mute"}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(event) => setMasterVolume(Number(event.target.value))}
                className="w-full accent-white"
              />
            </div>
          </div>
        </header>

        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-8 text-center text-white shadow-card backdrop-blur-xl">Loading KAKA...</div>
        ) : error ? (
          <div className="rounded-[2rem] border border-rose-200/20 bg-rose-950/30 p-8 text-center text-rose-100 shadow-card backdrop-blur-xl">{error}</div>
        ) : (
          <main className="space-y-6">
            <div className="relative">
              <div className="absolute right-4 top-4 z-30 rounded-[1.5rem] border border-white/10 bg-slate-950/45 px-5 py-4 text-white shadow-card backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">Current mood</p>
                <p className="font-display text-3xl capitalize">{effectiveMood || "sleep"}</p>
              </div>
              <PlantCharacter
                mood={effectiveMood}
                potDesign={preferences?.pot_design}
                temporaryEmote={temporaryEmote}
                audioLevel={effectiveVolume}
                onInteract={handleCharacterClick}
              />
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-5 shadow-card backdrop-blur-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/55">Emotes</p>
                  <h2 className="font-display text-2xl text-white">Dancy Dancyyy</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomizeOpen(true)}
                    className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Customize
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {emotes.map((emote) => (
                  <button
                    key={emote.id}
                    type="button"
                    onClick={() => triggerEmote(emote.id)}
                    className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold capitalize text-white/90"
                  >
                    {emote.label}
                  </button>
                ))}
              </div>
            </div>
            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {primaryMetrics.map((metric) => (
                  <VitalCard
                    key={metric.key}
                    title={metric.title}
                    value={metric.value}
                    unit={metric.unit}
                    status={metric.status}
                    onClick={() => setActiveMetric(metric.key)}
                  />
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {secondaryMetrics.map((metric) => (
                  <VitalCard
                    key={metric.key}
                    title={metric.title}
                    value={metric.value}
                    unit={metric.unit}
                    status={metric.status}
                    onClick={() => setActiveMetric(metric.key)}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-950/30 p-6 shadow-card backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/55">Fertilizer</p>
                  <h2 className="font-display text-2xl text-white">Feeding tracker</h2>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    Last fed: <span className="font-bold text-white">{formatDate(lastFertilizedAt) || "Not saved yet"}</span>
                  </p>
                  <p className="text-sm leading-6 text-white/75">
                    Next feed: <span className="font-bold text-white">{formatDate(getNextFertilizerDate(lastFertilizedAt)) || "Tap the button to start tracking"}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFertilizerConfirmOpen(true)}
                  className="rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white"
                >
                  I gave fertilizer today
                </button>
              </div>
            </section>

            <SuggestionsPanel
              suggestions={clientSuggestions}
              onOpenBooklet={() => setCareBookletOpen(true)}
            />
          </main>
        )}
      </div>

      <HistoryModal
        open={Boolean(activeMetric)}
        title={metrics.find((metric) => metric.key === activeMetric)?.title || ""}
        data={activeMetric ? history[activeMetric] : []}
        onClose={() => setActiveMetric(null)}
      />

      <CustomizeModal
        open={customizeOpen}
        options={potOptions}
        selectedPot={preferences?.pot_design}
        onSelect={async (potId) => {
          await savePreferences({ pot_design: potId });
          setCustomizeOpen(false);
        }}
        onClose={() => setCustomizeOpen(false)}
      />

      <ConfirmFertilizerModal
        open={fertilizerConfirmOpen}
        onConfirm={handleFertilizerUpdate}
        onClose={() => setFertilizerConfirmOpen(false)}
      />

      <CareBookletModal
        open={careBookletOpen}
        onClose={() => setCareBookletOpen(false)}
      />

      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {foregroundCritters.map((critter) => (
          <img
            key={critter.className}
            src={critter.src}
            alt={critter.alt}
            className={`${critter.className} ${critter.size}`}
          />
        ))}
      </div>
    </div>
  );
}

function CustomizeModal({ open, options, selectedPot, onSelect, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/35 p-4">
      <div className="w-full max-w-2xl rounded-[2rem] border border-sky-100/25 bg-sky-300/18 p-6 shadow-card backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/55">Customize</p>
            <h2 className="font-display text-3xl text-white">Choose KAKA's outfit</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-sky-100/30 bg-white/18 px-4 py-2 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={`rounded-[1.25rem] border bg-white/10 p-3 text-left ${
                selectedPot === option.id ? "border-white/70" : "border-sky-100/20"
              }`}
            >
              <img
                src={option.image}
                alt={`${option.label} pot preview`}
                className="mb-3 h-24 w-full rounded-xl object-contain bg-black/10 p-2"
              />
              <p className="font-semibold text-white">{option.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmFertilizerModal({ open, onConfirm, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/35 p-4">
      <div className="w-full max-w-lg rounded-[2rem] border border-sky-100/25 bg-sky-300/18 p-6 shadow-card backdrop-blur-xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/55">Fertilizer</p>
          <h2 className="font-display text-3xl text-white">Confirm Feeding</h2>
          <p className="mt-3 text-sm leading-6 text-white/80">
            Are you sure you gave KAKA fertilizer today? This will update the last fed date and recalculate the next feed date.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-sky-100/30 bg-white/18 px-4 py-2 text-sm font-semibold text-white"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full border border-emerald-200/20 bg-emerald-400/20 px-4 py-2 text-sm font-semibold text-white"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}

function CareBookletModal({ open, onClose }) {
  if (!open) return null;

  const carePoints = [
    {
      title: "Give it plenty of sunlight",
      body: "Place your jade plant in a bright spot where it can receive at least 4–6 hours of indirect sunlight daily, as this helps it grow strong and healthy."
    },
    {
      title: "Water it carefully",
      body: "Water your jade plant only when the soil is completely dry, because overwatering can cause root rot and damage the plant."
    },
    {
      title: "Use well-draining soil",
      body: "Plant your jade in soil that drains well, such as cactus or succulent mix, so excess water does not stay around the roots."
    },
    {
      title: "Choose the right pot",
      body: "Use a pot with drainage holes at the bottom, as this allows extra water to escape and prevents soggy soil."
    },
    {
      title: "Avoid overwatering in winter",
      body: "Reduce watering during colder months since the plant grows more slowly and needs less moisture."
    },
    {
      title: "Maintain a warm environment",
      body: "Keep your jade plant in a warm place, ideally between 18–24°C, and protect it from frost or sudden temperature drops."
    },
    {
      title: "Feed it occasionally",
      body: "Fertilize your jade plant lightly during the growing season (spring and summer) using a balanced fertilizer once a month."
    },
    {
      title: "Clean the leaves gently",
      body: "Wipe the leaves with a soft cloth occasionally to remove dust and help the plant absorb more sunlight."
    },
    {
      title: "Prune for better growth",
      body: "Trim leggy or overgrown branches to maintain a nice shape and encourage fuller growth."
    },
    {
      title: "Watch for pests",
      body: "Check your plant regularly for pests like mealybugs and treat them early using neem oil or mild soap solution."
    },
    {
      title: "Repot when needed",
      body: "Repot your jade plant every 2–3 years or when it outgrows its pot, so it has enough space to continue growing."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-sky-950/35 p-4">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-[2rem] border border-sky-100/25 bg-sky-300/18 p-6 shadow-card backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/55">Guide</p>
            <h2 className="font-display text-3xl text-white">KAKA Care Booklet</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-sky-100/30 bg-white/18 px-4 py-2 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>

        <ol className="space-y-4 overflow-y-auto pr-3 pl-6 text-sm leading-6 text-white/85">
          {carePoints.map((point, index) => (
            <li key={index} className="border-b border-white/15 pb-3">
              <span className="font-semibold text-white">{point.title}</span>
              <p className="mt-1 text-white/80">{point.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

const playTone = (emote, volume = 1) => {
  if (typeof window === "undefined" || volume <= 0) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const frequencyMap = {
    dance_bounce: 620,
    dance_sway: 540,
    dance_twirl: 700
  };

  oscillator.frequency.value = frequencyMap[emote] || 440;
  oscillator.type = "triangle";
  gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08 * volume, audioContext.currentTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.28);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.3);
};

const getNextFertilizerDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  date.setDate(date.getDate() + 30);
  return date.toISOString();
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

const buildSuggestions = (status, lastFertilizedAt) => {
  if (!status?.statuses) {
    return [
      {
        id: "loading-state",
        icon: "✨",
        message: "All is well and KAKA is healthy."
      }
    ];
  }

  const items = [];
  const fertilizerDue = isFertilizerDue(lastFertilizedAt);

  if (status.statuses.soil === "ALERT") {
    items.push({
      id: "soil",
      icon: "💧",
      message: "Soil moisture is outside the ideal 5% to 25% range. Adjust watering to bring KAKA back into balance."
    });
  }

  if (status.statuses.sunlight === "LOW") {
    items.push({
      id: "sunlight",
      icon: "☀️",
      message: "Sunlight looks low. Move KAKA somewhere brighter for a while."
    });
  }

  if (status.statuses.temperature === "ALERT") {
    items.push({
      id: "temperature",
      icon: "🌡️",
      message: "Temperature is outside the ideal 10C to 32C range. Try making KAKA's space a bit more comfortable."
    });
  }

  if (status.statuses.humidity === "ALERT") {
    items.push({
      id: "humidity",
      icon: "💨",
      message: "Humidity is outside the ideal 20% to 40% range. A little adjustment in the air around KAKA would help."
    });
  }

  if (fertilizerDue) {
    items.push({
      id: "fertilizer",
      icon: "🌿",
      message: "Fertilizer time is due. KAKA would love a nutrient boost."
    });
  }

  if (items.length === 0) {
    return [
      {
        id: "healthy",
        icon: "✨",
        message: "All is well and KAKA is healthy."
      }
    ];
  }

  return items;
};

const isFertilizerDue = (dateString) => {
  if (!dateString) return false;
  return new Date(getNextFertilizerDate(dateString)).getTime() <= Date.now();
};

const getEffectiveMood = (status, wakeUntil) => {
  if (!status) return "sleep";
  if (!status.isNight) return status.mood;

  const isAwakeAtNight = wakeUntil && wakeUntil > Date.now();
  if (!isAwakeAtNight) return "sleep";

  const hasIssue =
    status.statuses?.soil === "ALERT" ||
    status.statuses?.sunlight === "LOW" ||
    status.statuses?.temperature === "ALERT" ||
    status.statuses?.humidity === "ALERT";

  return hasIssue ? "sad" : "happy";
};
