import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { DEFAULT_PREFERENCES, DEFAULT_SETTINGS, RANGE_TO_HOURS } from "./constants.js";

const firebaseAdminApp = getApps().length > 0 ? getApp() : initializeApp({
  credential: cert(getServiceAccount())
});

export const db = getFirestore(firebaseAdminApp);

const settingsRef = db.collection("settings").doc("default");
const preferencesRef = db.collection("user_preferences").doc("default");
const careTrackerRef = db.collection("care_tracker").doc("default");
const readingsCollection = db.collection("plant_readings");

export const ensureFirestoreDefaults = async () => {
  await Promise.all([
    ensureDocument(settingsRef, DEFAULT_SETTINGS),
    ensureDocument(preferencesRef, DEFAULT_PREFERENCES),
    ensureDocument(careTrackerRef, {
      fertilizer_last_added_at: null
    })
  ]);
};

export const createReadingRecord = async (reading) => {
  const docRef = await readingsCollection.add({
    ...reading,
    created_at: FieldValue.serverTimestamp()
  });

  return {
    ...reading,
    _id: docRef.id
  };
};

export const fetchLatestReadingRecord = async () => {
  const snapshot = await readingsCollection.orderBy("timestamp", "desc").limit(1).get();
  const document = snapshot.docs[0];
  if (!document) return null;
  return normalizeReading(document.id, document.data());
};

export const fetchHistoryRecords = async (type = "soil_moisture", range = "24h", thresholdResolver) => {
  const hours = RANGE_TO_HOURS[range] ?? 24;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const snapshot = await readingsCollection
    .where("timestamp", ">=", cutoff)
    .orderBy("timestamp", "asc")
    .get();

  return snapshot.docs
    .map((document) => normalizeReading(document.id, document.data()))
    .map((reading) => {
      const thresholds = thresholdResolver(type);

      return {
        timestamp: reading.timestamp,
        value: reading[type],
        lowerThreshold: thresholds.lowerThreshold,
        upperThreshold: thresholds.upperThreshold
      };
    })
    .filter((point) => typeof point.value === "number");
};

export const fetchSettingsRecord = async () => {
  await ensureDocument(settingsRef, DEFAULT_SETTINGS);
  const snapshot = await settingsRef.get();
  const normalized = normalizeSettings(snapshot.data());

  if (JSON.stringify(snapshot.data()) !== JSON.stringify(normalized)) {
    await settingsRef.set(normalized);
  }

  return normalized;
};

export const fetchPreferencesRecord = async () => {
  await ensureDocument(preferencesRef, DEFAULT_PREFERENCES);
  const snapshot = await preferencesRef.get();
  return snapshot.data();
};

export const updatePreferencesRecord = async (preferences) => {
  await preferencesRef.set(preferences, { merge: true });
  const snapshot = await preferencesRef.get();
  return snapshot.data();
};

export const fetchCareTrackerRecord = async () => {
  await ensureDocument(careTrackerRef, {
    fertilizer_last_added_at: null
  });
  const snapshot = await careTrackerRef.get();
  return snapshot.data();
};

export const updateCareTrackerRecord = async (payload) => {
  await careTrackerRef.set(payload, { merge: true });
  const snapshot = await careTrackerRef.get();
  return snapshot.data();
};

const ensureDocument = async (reference, defaults) => {
  const snapshot = await reference.get();
  if (!snapshot.exists) {
    await reference.set(defaults);
  }
};

const normalizeSettings = (settings = {}) => ({
  soil_range: DEFAULT_SETTINGS.soil_range,
  sunlight_threshold: DEFAULT_SETTINGS.sunlight_threshold,
  temperature_range: DEFAULT_SETTINGS.temperature_range,
  humidity_range: DEFAULT_SETTINGS.humidity_range,
  fertilizer_interval_days:
    settings.fertilizer_interval_days ?? DEFAULT_SETTINGS.fertilizer_interval_days
});

const normalizeReading = (id, data) => ({
  _id: id,
  timestamp: data.timestamp,
  soil_moisture: data.soil_moisture,
  sunlight: data.sunlight,
  temperature: data.temperature,
  humidity: data.humidity
});

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    return normalizeServiceAccount(parsed);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  return normalizeServiceAccount({
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey
  });
}

function normalizeServiceAccount(serviceAccount) {
  return {
    projectId: serviceAccount.projectId ?? serviceAccount.project_id,
    clientEmail: serviceAccount.clientEmail ?? serviceAccount.client_email,
    privateKey: (serviceAccount.privateKey ?? serviceAccount.private_key)?.replace(/\\n/g, "\n")
  };
}
