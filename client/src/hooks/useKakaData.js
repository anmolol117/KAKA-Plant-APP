import { useEffect, useState } from "react";
import { apiBase, fetchJson } from "../lib/api";

const initialState = {
  latest: null,
  status: null,
  preferences: null,
  careTracker: null,
  settings: null,
  suggestions: [],
  history: {
    soil_moisture: [],
    sunlight: [],
    temperature: [],
    humidity: []
  },
  loading: true,
  error: null
};

export const useKakaData = () => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [latestRes, settingsRes, suggestionsRes, soilRes, lightRes, tempRes, humidityRes] =
          await Promise.all([
            fetchJson("/latest"),
            fetchJson("/settings"),
            fetchJson("/suggestions"),
            fetchJson("/history?type=soil_moisture&range=24h"),
            fetchJson("/history?type=sunlight&range=24h"),
            fetchJson("/history?type=temperature&range=24h"),
            fetchJson("/history?type=humidity&range=24h")
          ]);

        if (!mounted) return;

        setState({
          latest: latestRes.reading,
          status: latestRes.status,
          preferences: settingsRes.preferences,
          careTracker: settingsRes.care_tracker,
          settings: settingsRes.settings,
          suggestions: suggestionsRes.suggestions,
          history: {
            soil_moisture: soilRes.history,
            sunlight: lightRes.history,
            temperature: tempRes.history,
            humidity: humidityRes.history
          },
          loading: false,
          error: null
        });
      } catch (error) {
        if (!mounted) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: error.message
        }));
      }
    };

    load();

    const events = new EventSource(`${apiBase}/stream`);
    events.addEventListener("reading", (event) => {
      const payload = JSON.parse(event.data);
      setState((current) => ({
        ...current,
        latest: payload.reading,
        status: payload.status,
        suggestions: payload.suggestions,
        history: {
          ...current.history,
          soil_moisture: [...current.history.soil_moisture, formatPoint(payload.reading, "soil_moisture", current.settings)].slice(-48),
          sunlight: [...current.history.sunlight, formatPoint(payload.reading, "sunlight", current.settings)].slice(-48),
          temperature: [...current.history.temperature, formatPoint(payload.reading, "temperature", current.settings)].slice(-48),
          humidity: [...current.history.humidity, formatPoint(payload.reading, "humidity", current.settings)].slice(-48)
        }
      }));
    });

    events.addEventListener("preferences", (event) => {
      const preferences = JSON.parse(event.data);
      setState((current) => ({
        ...current,
        preferences
      }));
    });

    events.addEventListener("care-tracker", (event) => {
      const careTracker = JSON.parse(event.data);
      setState((current) => ({
        ...current,
        careTracker
      }));
    });

    return () => {
      mounted = false;
      events.close();
    };
  }, []);

  const savePreferences = async (updates) => {
    const response = await fetchJson("/preferences", {
      method: "POST",
      body: JSON.stringify(updates)
    });

    setState((current) => ({
      ...current,
      preferences: response.preferences
    }));
  };

  const saveCareTracker = async (updates) => {
    const response = await fetchJson("/care-tracker", {
      method: "POST",
      body: JSON.stringify(updates)
    });

    setState((current) => ({
      ...current,
      careTracker: response.care_tracker
    }));
  };

  return {
    ...state,
    savePreferences,
    saveCareTracker
  };
};

const formatPoint = (reading, key, settings = {}) => {
  const thresholds = getThresholdsForMetric(key, settings);

  return {
    timestamp: reading.timestamp,
    value: reading[key],
    lowerThreshold: thresholds.lowerThreshold,
    upperThreshold: thresholds.upperThreshold
  };
};

const getThresholdsForMetric = (key, settings = {}) => {
  if (key === "soil_moisture") {
    return {
      lowerThreshold: settings.soil_range?.[0] ?? null,
      upperThreshold: settings.soil_range?.[1] ?? null
    };
  }

  if (key === "sunlight") {
    return {
      lowerThreshold: settings.sunlight_threshold ?? null,
      upperThreshold: null
    };
  }

  if (key === "temperature") {
    return {
      lowerThreshold: settings.temperature_range?.[0] ?? null,
      upperThreshold: settings.temperature_range?.[1] ?? null
    };
  }

  if (key === "humidity") {
    return {
      lowerThreshold: settings.humidity_range?.[0] ?? null,
      upperThreshold: settings.humidity_range?.[1] ?? null
    };
  }

  return {
    lowerThreshold: null,
    upperThreshold: null
  };
};
