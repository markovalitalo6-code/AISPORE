import express from "express";
import { authRouter } from "./auth/router";
import { readonlyRouter } from "./routes/readonly";
import { rewardRouter } from "./routes/reward";
import rateLimit from "express-rate-limit";

const app = express();


// AISPORE_RATE_LIMITERS (v1 hardening - visible test)
const aisporePublicLimiter = rateLimit({
  windowMs: 10_000, // 10s
  limit: 5,         // 5 requests per 10s per IP
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());

// AISPORE_APPLY_RATE_LIMITERS
app.use(aisporePublicLimiter);
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

