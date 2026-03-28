import morningBackground from "../assets/morning.webp";
import afternoonBackground from "../assets/afternoon.webp";
import eveningBackground from "../assets/evening.webp";
import nightBackground from "../assets/night.webp";
import autumnPot from "../assets/autumn_pot.png";
import pinkPot from "../assets/pink_pot.png";
import tuxedoPot from "../assets/tuxedo_pot.png";
import whitePot from "../assets/white_pot.png";

export const getTimeTheme = (date = new Date()) => {
  const hour = date.getHours();

  if (hour < 6) {
    return {
      name: "night",
      backgroundImage: nightBackground,
      gradient: "from-[#091528] via-[#152d5a] to-[#2d4478]",
      halo: "bg-[#a9c3ff]/18",
      orb: "bg-[#dce7ff]",
      veil: "bg-[radial-gradient(circle_at_top,rgba(157,184,255,0.08),transparent_38%)]",
      overlay: "bg-[linear-gradient(to_bottom,rgba(2,5,12,0.28),rgba(2,5,12,0.7))]"
    };
  }

  if (hour < 12) {
    return {
      name: "morning",
      backgroundImage: morningBackground,
      gradient: "from-[#f7e29c] via-[#f3c98b] to-[#e8a66a]",
      halo: "bg-[#fff1b8]/55",
      orb: "bg-[#ffd36e]",
      veil: "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_45%)]",
      overlay: "bg-[linear-gradient(to_bottom,rgba(7,16,30,0.18),rgba(7,16,30,0.4))]"
    };
  }

  if (hour < 17) {
    return {
      name: "afternoon",
      backgroundImage: afternoonBackground,
      gradient: "from-[#d9f0c7] via-[#98c98d] to-[#4f8a7b]",
      halo: "bg-[#f7ffb7]/35",
      orb: "bg-[#fff27a]",
      veil: "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_40%)]",
      overlay: "bg-[linear-gradient(to_bottom,rgba(5,18,30,0.24),rgba(7,24,29,0.45))]"
    };
  }

  if (hour < 20) {
    return {
      name: "evening",
      backgroundImage: eveningBackground,
      gradient: "from-[#f4b183] via-[#dd6e42] to-[#5c375e]",
      halo: "bg-[#ffb38a]/30",
      orb: "bg-[#ff9159]",
      veil: "bg-[radial-gradient(circle_at_top,rgba(255,184,120,0.16),transparent_42%)]",
      overlay: "bg-[linear-gradient(to_bottom,rgba(28,11,18,0.22),rgba(20,10,22,0.5))]"
    };
  }

  return {
    name: "night",
    backgroundImage: nightBackground,
    gradient: "from-[#091528] via-[#152d5a] to-[#2d4478]",
    halo: "bg-[#a9c3ff]/18",
    orb: "bg-[#dce7ff]",
    veil: "bg-[radial-gradient(circle_at_top,rgba(157,184,255,0.08),transparent_38%)]",
    overlay: "bg-[linear-gradient(to_bottom,rgba(2,5,12,0.28),rgba(2,5,12,0.7))]"
  };
};

export const potOptions = [
  { id: "pink", label: "Pink", image: pinkPot },
  { id: "autumn", label: "Autumn", image: autumnPot },
  { id: "tuxedo", label: "Tuxedo", image: tuxedoPot },
  { id: "white", label: "White", image: whitePot }
];
