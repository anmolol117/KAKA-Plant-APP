import { DEFAULT_PREFERENCES, DEFAULT_SETTINGS } from "./constants.js";

const now = Date.now();

const buildSeed = (index) => {
  const timestamp = new Date(now - (36 - index) * 30 * 60 * 1000).toISOString();
  return {
    _id: `seed-${index}`,
    timestamp,
    soil_moisture: 52 - (index % 10) * 2,
    sunlight: index % 8 < 5 ? 340 + index * 3 : 110 + index * 2,
    temperature: 23 + (index % 6),
    humidity: 56 + (index % 9)
  };
};

export const store = {
  readings: Array.from({ length: 36 }, (_, index) => buildSeed(index)),
  settings: { ...DEFAULT_SETTINGS },
  preferences: { ...DEFAULT_PREFERENCES },
  fertilizerLastAddedAt: new Date(now - 34 * 24 * 60 * 60 * 1000).toISOString()
};
