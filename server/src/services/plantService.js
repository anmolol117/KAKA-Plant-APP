import { randomUUID } from "node:crypto";
import { z } from "zod";
import { DEFAULT_SETTINGS } from "../lib/constants.js";
import {
  createReadingRecord,
  ensureFirestoreDefaults,
  fetchCareTrackerRecord,
  fetchHistoryRecords,
  fetchLatestReadingRecord,
  fetchPreferencesRecord,
  fetchSettingsRecord,
  updateCareTrackerRecord,
  updatePreferencesRecord
} from "../lib/firebase.js";

const sensorPayloadSchema = z.object({
  timestamp: z.union([z.number(), z.string(), z.date()]),
  soil_moisture: z.number().min(0).max(100),
  sunlight: z.number().min(0),
  temperature: z.number().min(-50).max(100),
  humidity: z.number().min(0).max(100)
});

const preferenceSchema = z.object({
  pot_design: z.string().min(1).optional(),
  sound_enabled: z.boolean().optional()
});

const careTrackerSchema = z.object({
  fertilizer_last_added_at: z.string().datetime()
});

const normalizeTimestamp = (value) => {
  if (typeof value === "number") {
    return new Date(value * 1000).toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
};

export const createReading = async (payload) => {
  const parsed = sensorPayloadSchema.parse(payload);
  const reading = {
    _id: randomUUID(),
    ...parsed,
    timestamp: normalizeTimestamp(parsed.timestamp)
  };

  await ensureFirestoreDefaults();
  return createReadingRecord(reading);
};

export const getLatestReading = async () => {
  await ensureFirestoreDefaults();
  return fetchLatestReadingRecord();
};

export const getHistory = async (type = "soil_moisture", range = "24h") => {
  await ensureFirestoreDefaults();
  return fetchHistoryRecords(type, range, getThresholdBoundsForMetric);
};

export const updatePreferences = async (payload) => {
  const parsed = preferenceSchema.parse(payload);
  await ensureFirestoreDefaults();
  return updatePreferencesRecord(parsed);
};

export const updateCareTracker = async (payload) => {
  const parsed = careTrackerSchema.parse(payload);
  await ensureFirestoreDefaults();
  return updateCareTrackerRecord(parsed);
};

export const getSettings = async () => {
  await ensureFirestoreDefaults();
  return fetchSettingsRecord();
};

export const getPreferences = async () => {
  await ensureFirestoreDefaults();
  return fetchPreferencesRecord();
};

export const getCareTracker = async () => {
  await ensureFirestoreDefaults();
  return fetchCareTrackerRecord();
};

export const evaluatePlantStatus = (reading, settings = DEFAULT_SETTINGS, now = new Date()) => {
  if (!reading) {
    return {
      mood: "sleep",
      isDaytime: false,
      statuses: {
        soil: "UNKNOWN",
        sunlight: "UNKNOWN",
        temperature: "UNKNOWN",
        humidity: "UNKNOWN"
      }
    };
  }

  const hour = now.getHours();
  const isDaytime = hour >= 6 && hour < 18;
  const isNight = hour >= 20 || hour < 6;

  const [minSoil, maxSoil] = settings.soil_range ?? DEFAULT_SETTINGS.soil_range;
  const soil =
    reading.soil_moisture < minSoil || reading.soil_moisture > maxSoil ? "ALERT" : "GOOD";
  const sunlight = isDaytime && reading.sunlight < settings.sunlight_threshold ? "LOW" : "GOOD";
  const [minTemp, maxTemp] = settings.temperature_range ?? DEFAULT_SETTINGS.temperature_range;
  const temperature =
    reading.temperature < minTemp || reading.temperature > maxTemp ? "ALERT" : "GOOD";
  const [minHumidity, maxHumidity] = settings.humidity_range ?? DEFAULT_SETTINGS.humidity_range;
  const humidity =
    reading.humidity < minHumidity || reading.humidity > maxHumidity ? "ALERT" : "GOOD";

  let mood = "happy";
  if (
    soil === "ALERT" ||
    sunlight === "LOW" ||
    temperature === "ALERT" ||
    humidity === "ALERT"
  ) {
    mood = "sad";
  } else if (isNight) {
    mood = "sleep";
  }

  return {
    mood,
    isDaytime,
    isNight,
    statuses: {
      soil,
      sunlight,
      temperature,
      humidity
    }
  };
};

export const getSuggestions = async (
  reading = null,
  settings = null,
  careTracker = null,
  now = new Date()
) => {
  const resolvedReading = reading ?? (await getLatestReading());
  const resolvedSettings = settings ?? (await getSettings());
  const resolvedCareTracker = careTracker ?? (await getCareTracker());
  const { statuses, isDaytime } = evaluatePlantStatus(resolvedReading, resolvedSettings, now);
  const suggestions = [];
  const fertilizerAgeDays =
    resolvedCareTracker?.fertilizer_last_added_at
      ? (now.getTime() - new Date(resolvedCareTracker.fertilizer_last_added_at).getTime()) /
        (24 * 60 * 60 * 1000)
      : 0;

  if (statuses.soil === "ALERT") {
    suggestions.push({
      id: "water",
      icon: "💧",
      message: "Soil moisture is outside the ideal 5% to 25% range. Adjust watering to bring it back into balance."
    });
  }

  if (statuses.sunlight === "LOW" && isDaytime) {
    suggestions.push({
      id: "sunlight",
      icon: "☀️",
      message: "Move KAKA closer to sunlight for stronger daytime growth."
    });
  }

  if (statuses.temperature === "ALERT") {
    suggestions.push({
      id: "temperature",
      icon: "🌡",
      message: "Temperature is outside the ideal 10C to 32C range. Adjust the environment to keep KAKA comfortable."
    });
  }

  if (statuses.humidity === "ALERT") {
    suggestions.push({
      id: "humidity",
      icon: "💨",
      message: "Humidity is outside the ideal 20% to 40% range. A small adjustment in airflow or moisture would help."
    });
  }

  if (fertilizerAgeDays >= resolvedSettings.fertilizer_interval_days) {
    suggestions.push({
      id: "fertilizer",
      icon: "🌿",
      message: "Add compost or fertilizer soon. Nutrition looks overdue."
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      id: "stable",
      icon: "✨",
      message: "Everything looks balanced right now. Keep the routine steady."
    });
  }

  return suggestions;
};

export const getThresholdBoundsForMetric = (type) => {
  if (type === "soil_moisture") {
    return {
      lowerThreshold: DEFAULT_SETTINGS.soil_range[0],
      upperThreshold: DEFAULT_SETTINGS.soil_range[1]
    };
  }

  if (type === "sunlight") {
    return {
      lowerThreshold: DEFAULT_SETTINGS.sunlight_threshold,
      upperThreshold: null
    };
  }

  if (type === "temperature") {
    return {
      lowerThreshold: DEFAULT_SETTINGS.temperature_range[0],
      upperThreshold: DEFAULT_SETTINGS.temperature_range[1]
    };
  }

  if (type === "humidity") {
    return {
      lowerThreshold: DEFAULT_SETTINGS.humidity_range[0],
      upperThreshold: DEFAULT_SETTINGS.humidity_range[1]
    };
  }

  return {
    lowerThreshold: null,
    upperThreshold: null
  };
};
