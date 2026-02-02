import dotenv from "dotenv";
import { Bot, InputFile } from "grammy";
import path from "path";
import { promises as fs } from "fs";

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID as string;

if (!BOT_TOKEN) {
  console.error("Missing TELEGRAM_BOT_TOKEN in .env");
  process.exit(1);
}
if (!CHAT_ID) {
  console.error("Missing TELEGRAM_CHAT_ID in .env");
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

const IMAGE_DIR = path.resolve(process.cwd(), "data", "tg_images");

const CAPTIONS: string[] = [
  "AISPORE is germinating quietly… early holders know what's coming. 🍄",
  "We're wiring AI, memes and incentives together. This is not just another chat. 🧬",
  "Every day the engine learns a bit more. Early holders capture that edge. ⚙️",
  "If you want pure flips, there are thousands of other coins. Here we build long game value. ⏳",
  "Founding Players are the core memory of AISPORE. Your badge will matter later. 🎖️",
  "AI + community + fair incentives. We’re testing a new kind of meme ecosystem. 🚀",
];

function pickRandomCaption(): string {
  return CAPTIONS[Math.floor(Math.random() * CAPTIONS.length)];
}

async function pickRandomImage(): Promise<string | null> {
  try {
    const entries = await fs.readdir(IMAGE_DIR);
    const files = entries.filter((f) =>
      f.toLowerCase().match(/\.(png|jpe?g|webp)$/)
    );
    if (!files.length) return null;

    const chosen = files[Math.floor(Math.random() * files.length)];
    return path.join(IMAGE_DIR, chosen);
  } catch (err) {
    console.error("Error reading image directory:", err);
    return null;
  }
}

export async function runOnce(): Promise<void> {
  console.log("=== TG AUTPOST: runOnce() ===");
  console.log("Using CHAT_ID:", CHAT_ID);
  console.log("Image dir:", IMAGE_DIR);

  const filePath = await pickRandomImage();
  if (!filePath) {
    console.log("No images found for TG autopost.");
    return;
  }

  const caption = pickRandomCaption();

  try {
    await bot.api.sendPhoto(CHAT_ID, new InputFile(filePath), {
      caption,
    });
    console.log("TG autopost sent successfully.");
  } catch (err) {
    console.error("Error sending TG autopost:", err);
  }
}

if (require.main === module) {
  runOnce()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("runOnce() failed:", err);
      process.exit(1);
    });
}
