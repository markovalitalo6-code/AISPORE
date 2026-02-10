import express from "express";
import { authRouter } from "./auth/router";
import { readonlyRouter } from "./routes/readonly";
import { rewardRouter } from "./routes/reward";
import rateLimit from "express-rate-limit";

const app = express();

// AISPORE_RATE_LIMITERS (v1 hardening)
app.set("trust proxy", 1);
const publicLimiter = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
const adminLimiter  = rateLimit({ windowMs: 60_000, max: 30,  standardHeaders: true, legacyHeaders: false });
app.use(publicLimiter);
app.use("/reward/lock", adminLimiter);

app.use(express.json());

// AUTH
app.use("/auth", authRouter);

// READ-ONLY ROUTES (health, whoami, calc, raffle)
app.use("/", readonlyRouter);

// REWARD ROUTES (lock + reads)
app.use("/", rewardRouter);

const port = Number(process.env.PORT ?? 3100);
app.listen(port, () => {
  console.log(`AISPORE API listening on http://localhost:${port}`);
});

