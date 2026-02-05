import express from "express";
import { authRouter } from "./auth/router";
import { readonlyRouter } from "./routes/readonly";
import { rewardRouter } from "./routes/reward";

const app = express();
app.use(express.json());

// AUTH
app.use("/auth", authRouter);

// READ-ONLY ROUTES (health, calc, raffle)
app.use("/", readonlyRouter);
app.use("/reward", rewardRouter);

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`AISPORE API listening on http://localhost:${port}`);
});

