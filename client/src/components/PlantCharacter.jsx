import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import beeGif from "../assets/animated_assets/bee.gif";
import butterflyGif from "../assets/animated_assets/butterfly.gif";
import kakaBackground from "../assets/KAKA_background.png";
import jadePlant from "../assets/jade_plant.png";
import autumnPot from "../assets/autumn_pot.png";
import pinkPot from "../assets/pink_pot.png";
import tuxedoPot from "../assets/tuxedo_pot.png";
import whitePot from "../assets/white_pot.png";

const expressionModules = import.meta.glob("../assets/face_expressions/**/*.png", {
  eager: true,
  import: "default"
});

const happyFace = expressionModules["../assets/face_expressions/happy/happy.png"];
const sadFace = expressionModules["../assets/face_expressions/sad/sad.png"];
const sleepFace = expressionModules["../assets/face_expressions/sleep/sleep.png"];
const cuteFaces = Object.entries(expressionModules)
  .filter(([path]) => path.includes("/cute/"))
  .map(([, src]) => src);

let cuteAudioContext = null;

const getCuteAudioContext = async () => {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!cuteAudioContext) {
    cuteAudioContext = new AudioContextClass();
  }

  if (cuteAudioContext.state === "suspended") {
    try {
      await cuteAudioContext.resume();
    } catch {
      return null;
    }
  }

  return cuteAudioContext;
};

export function PlantCharacter({ mood = "happy", potDesign = "floral", temporaryEmote, audioLevel = 1, onInteract }) {
  const isSleep = mood === "sleep";
  const isSad = mood === "sad";
  const isTuxedoPot = potDesign === "tuxedo";
  const potImage = getPotImage(potDesign);
  const motionPreset = getMotionPreset(temporaryEmote, isSad);
  const [cuteFaceIndex, setCuteFaceIndex] = useState(0);
  const [showCuteFace, setShowCuteFace] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unlockAudio = () => {
      getCuteAudioContext();
    };

    window.addEventListener("pointerdown", unlockAudio, true);
    window.addEventListener("keydown", unlockAudio, true);

    return () => {
      window.removeEventListener("pointerdown", unlockAudio, true);
      window.removeEventListener("keydown", unlockAudio, true);
    };
  }, []);

  useEffect(() => {
    if (mood !== "happy" || cuteFaces.length === 0) {
      setShowCuteFace(false);
      return;
    }

    let timeoutId;
    const intervalId = window.setInterval(() => {
      setCuteFaceIndex(Math.floor(Math.random() * cuteFaces.length));
      setShowCuteFace(true);
      playCuteSound(audioLevel);

      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setShowCuteFace(false);
      }, 1000);
    }, 7000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      setShowCuteFace(false);
    };
  }, [audioLevel, mood]);

  const activeFace = useMemo(() => {
    if (isSleep) return sleepFace;
    if (isSad) return sadFace;
    if (showCuteFace && cuteFaces.length > 0) return cuteFaces[cuteFaceIndex];
    return happyFace;
  }, [cuteFaceIndex, isSad, isSleep, showCuteFace]);

  return (
    <button
      type="button"
      onClick={onInteract}
      className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/15 p-6 backdrop-blur-lg"
      style={{
        backgroundImage: `url(${kakaBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(to_top,rgba(2,6,18,0.45),transparent)]" />
      <img
        src={beeGif}
        alt="Bee"
        className="critter critter-front critter-widget-bee critter-flip w-10 sm:w-12"
      />
      <img
        src={butterflyGif}
        alt="Butterfly"
        className="critter critter-front critter-widget-butterfly w-12 sm:w-14"
      />
      <div
        className="relative flex w-full max-w-[380px] flex-col items-center justify-center"
        style={{ transform: "translateY(-120px)" }}
      >
      <motion.div
        animate={{
          y: motionPreset.y,
          rotate: motionPreset.rotate
        }}
        transition={{
          duration: motionPreset.duration,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative flex w-full flex-col items-center justify-center"
      >
        <div className="relative mb-[-16px] h-[330px] w-full">
          <motion.img
            src={jadePlant}
            alt="KAKA jade plant"
            animate={{
              rotate: motionPreset.plantRotate ?? (isSad ? -4 : 0),
              scale: motionPreset.scale
            }}
            transition={{
              duration: motionPreset.duration,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-x-0 bottom-[-243px] z-20 mx-auto h-full w-auto object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.35)]"
          />
          <motion.img
            key={activeFace}
            src={activeFace}
            alt={`${mood} face`}
            initial={{ opacity: 0.85, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={`absolute z-30 h-auto w-[148px] -translate-x-1/2 object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.25)] ${
              isTuxedoPot ? "invert" : ""
            }`}
            style={{
              left: isTuxedoPot ? "calc(50% - 72px)" : "calc(50% - 75px)",
              top: isTuxedoPot ? "calc(66% + 225px)" : "calc(66% + 205px)"
            }}
          />
        </div>

        <div className="relative z-10 mt-[-18px]">
          <img
            src={potImage}
            alt={`${potDesign} pot`}
            className="h-auto w-[280px] object-contain drop-shadow-[0_18px_20px_rgba(0,0,0,0.35)]"
          />
        </div>
      </motion.div>
      </div>
    </button>
  );
}

const getPotImage = (potDesign) => {
  if (potDesign === "autumn") return autumnPot;
  if (potDesign === "tuxedo") return tuxedoPot;
  if (potDesign === "white") return whitePot;
  return pinkPot;
};

const getMotionPreset = (emote, isSad) => {
  if (emote === "dance_bounce") {
    return {
      y: [0, -10, 0, -7, 0],
      rotate: [0, -2, 2, -1, 0],
      scale: [1, 1.02, 1, 1.015, 1],
      duration: 3.2,
      plantRotate: [0, -1, 1, -1, 0]
    };
  }

  if (emote === "dance_sway") {
    return {
      y: [0, -4, 0],
      rotate: [0, -5, 5, -4, 0],
      scale: [1, 1.01, 1],
      duration: 4.2,
      plantRotate: [0, -3, 3, -2, 0]
    };
  }

  if (emote === "dance_twirl") {
    return {
      y: [0, -8, 0, -5, 0],
      rotate: [0, 4, -4, 3, 0],
      scale: [1, 1.025, 1, 1.018, 1],
      duration: 3.6,
      plantRotate: [0, 2, -2, 1, 0]
    };
  }

  return {
    y: [0, -5, 0],
    rotate: isSad ? -2 : 0,
    scale: 1,
    duration: 5.5,
    plantRotate: isSad ? -4 : 0
  };
};

const playCuteSound = async (volume = 1) => {
  if (volume <= 0) return;
  const audioContext = await getCuteAudioContext();
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const output = audioContext.createGain();
  output.gain.value = 1 * volume;
  output.connect(audioContext.destination);

  const patterns = [
    [{ t: 0, f: 880 }, { t: 0.08, f: 1174 }],
    [{ t: 0, f: 784 }, { t: 0.1, f: 988 }, { t: 0.18, f: 1318 }],
    [{ t: 0, f: 1046 }, { t: 0.12, f: 880 }],
    [{ t: 0, f: 659 }, { t: 0.09, f: 880 }, { t: 0.18, f: 1046 }],
    [{ t: 0, f: 740 }, { t: 0.07, f: 932 }, { t: 0.15, f: 1244 }],
    [{ t: 0, f: 988 }, { t: 0.08, f: 1318 }, { t: 0.16, f: 1568 }],
    [{ t: 0, f: 698 }, { t: 0.1, f: 784 }, { t: 0.2, f: 988 }]
  ];

  const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];

  selectedPattern.forEach((note, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const startTime = now + note.t;
    const duration = index === selectedPattern.length - 1 ? 0.16 : 0.12;

    oscillator.type = index % 2 === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(note.f, startTime);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(1 * volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  });
};
