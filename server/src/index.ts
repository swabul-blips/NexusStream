import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT ?? 8787);
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";

app.use(
  cors({
    origin: [WEB_ORIGIN, /^http:\/\/127\.0\.0\.1:3000$/],
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "NexusStream API",
    hints: {
      health: "/health",
      streams: "/api/streams",
      predictions: "/api/predictions",
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "nexus-stream-api", ts: new Date().toISOString() });
});

type StreamMeta = {
  slug: string;
  title: string;
  broadcaster: string;
  tagline: string;
  peakViewers: number;
  live: boolean;
};

const streams: StreamMeta[] = [
  {
    slug: "genesis-night",
    title: "Genesis Night — Signal Ops",
    broadcaster: "NxStream Labs",
    tagline: "Latency-sharp streams with on-chain settlement.",
    peakViewers: 12840,
    live: true,
  },
  {
    slug: "cyber-cipher",
    title: "Cyber Cipher DJ Set",
    broadcaster: "CipherZero",
    tagline: "Neon audio + live prediction rails.",
    peakViewers: 9331,
    live: false,
  },
];

app.get("/api/stream/:slug", (req, res) => {
  const found = streams.find((s) => s.slug === req.params.slug);
  if (!found) {
    res.status(404).json({ error: "Stream not found" });
    return;
  }
  res.json(found);
});

app.get("/api/streams", (_req, res) => {
  res.json(streams);
});

type PredictionCard = {
  id: string;
  question: string;
  cutoff: string;
  yesOdds: string;
  noOdds: string;
  volumeSol: string;
};

const predictions: PredictionCard[] = [
  {
    id: "p1",
    question: "Will this set break 10k concurrent viewers?",
    cutoff: "45:00",
    yesOdds: "1.9x",
    noOdds: "2.1x",
    volumeSol: "128.4",
  },
  {
    id: "p2",
    question: "First drop hits before the 12 minute mark?",
    cutoff: "12:00",
    yesOdds: "1.4x",
    noOdds: "3.0x",
    volumeSol: "54.2",
  },
];

app.get("/api/predictions", (_req, res) => {
  res.json(predictions);
});

/** Lightweight analytics hook for dashboard experiments */
app.post("/api/predictions/note", (req, res) => {
  const body = req.body as { marketId?: string; side?: string };
  res.json({ ok: true, received: body });
});

app.listen(PORT, () => {
  console.log(`NexusStream API listening on http://localhost:${PORT}`);
});
