import fs from 'fs';
import path from 'path';
let createCanvas, loadImage;

try {
  ({ createCanvas, loadImage } = await import('canvas'));
} catch {}

const BADGE_DIR = path.join(process.cwd(), 'assets', 'badges');

function ensureDir() {
  if (!fs.existsSync(BADGE_DIR)) fs.mkdirSync(BADGE_DIR, { recursive: true });
}

export async function ensureBadge(username){
  ensureDir();
  const safe = String(username||'user').replace(/[^a-zA-Z0-9_]/g,'_');
  const outPath = path.join(BADGE_DIR, `badge_${safe}.png`);

  if (fs.existsSync(outPath)) return outPath;

  if (createCanvas){
    const W=900, H=300;
    const canvas = createCanvas(W,H);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#101318';
    ctx.fillRect(0,0,W,H);
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 6;
    ctx.strokeRect(12,12,W-24,H-24);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText('AI SPORE — WELCOME BADGE', 40, 120);
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText(`@${username}`, 40, 200);
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
    return outPath;
  }

  const onePx = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync(outPath, onePx);
  return outPath;
}
