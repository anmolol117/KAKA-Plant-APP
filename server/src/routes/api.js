import { Router } from "express";
import {
  createReading,
  evaluatePlantStatus,
  getCareTracker,
  getHistory,
  getLatestReading,
  getPreferences,
  getSettings,
  getSuggestions,
  updateCareTracker,
  updatePreferences
} from "../services/plantService.js";
import { broadcast, registerClient, unregisterClient } from "../services/streamService.js";

export const apiRouter = Router();

apiRouter.post("/sensor-data", async (req, res, next) => {
  try {
    const settings = await getSettings();
    const careTracker = await getCareTracker();
    const reading = await createReading(req.body);
    const status = evaluatePlantStatus(reading, settings);
    const suggestions = await getSuggestions(reading, settings, careTracker);

    broadcast("reading", {
      reading,
      status,
      suggestions
    });

    res.status(201).json({
      ok: true,
      reading
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/latest", async (_req, res, next) => {
  try {
    const [reading, settings, preferences, careTracker] = await Promise.all([
      getLatestReading(),
      getSettings(),
      getPreferences(),
      getCareTracker()
    ]);
    const status = evaluatePlantStatus(reading, settings);
    res.json({
      reading,
      status,
      preferences,
      care_tracker: careTracker
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/history", async (req, res, next) => {
  try {
    const { type, range } = req.query;
    const history = await getHistory(type, range);
    res.json({
      type,
      range,
      history
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/suggestions", async (_req, res, next) => {
  try {
    const [reading, settings, careTracker] = await Promise.all([
      getLatestReading(),
      getSettings(),
      getCareTracker()
    ]);
    res.json({
      suggestions: await getSuggestions(reading, settings, careTracker)
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/settings", async (_req, res, next) => {
  try {
    const [settings, preferences, careTracker] = await Promise.all([
      getSettings(),
      getPreferences(),
      getCareTracker()
    ]);
    res.json({
      settings,
      preferences,
      care_tracker: careTracker
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/preferences", async (req, res, next) => {
  try {
    const preferences = await updatePreferences(req.body);
    broadcast("preferences", preferences);
    res.json({
      ok: true,
      preferences
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/care-tracker", async (req, res, next) => {
  try {
    const careTracker = await updateCareTracker(req.body);
    broadcast("care-tracker", careTracker);
    res.json({
      ok: true,
      care_tracker: careTracker
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  registerClient(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  req.on("close", () => {
    unregisterClient(res);
    res.end();
  });
});
