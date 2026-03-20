import "dotenv/config";
import express from "express";
import cors from "cors";
import { apiRouter } from "./routes/api.js";

const app = express();
const port = Number(process.env.PORT || 4000);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/v1", apiRouter);

app.use((error, _req, res, _next) => {
  res.status(400).json({
    ok: false,
    message: error.message || "Unexpected server error"
  });
});

app.listen(port, () => {
  console.log(`KAKA backend listening on http://localhost:${port}`);
});
