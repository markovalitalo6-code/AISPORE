import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
const REF_PATH = path.join(process.cwd(), DATA_DIR, 'referrals.json');
const USERS_PATH = path.join(process.cwd(), DATA_DIR, 'users.json');

function readJson(p){ try { return JSON.parse(fs.readFileSync(p,'utf8')||'{}'); } catch { return {}; } }
function writeJson(p,obj){ fs.writeFileSync(p, JSON.stringify(obj,null,2)); }

export function ensureStores(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if(!fs.existsSync(REF_PATH)) writeJson(REF_PATH,{});
  if(!fs.existsSync(USERS_PATH)) writeJson(USERS_PATH,{});
}

export function getMyCode(userId){
  return `ref_${userId}`;
}

export function getMyLink(userId){
  const base = process.env.REF_BASE_URL || `https://t.me/${process.env.BOT_USERNAME}`;
  return `${base}?start=${getMyCode(userId)}`;
}

export function recordReferral(newUserId, refCode){
  const refs = readJson(REF_PATH);
  refs[newUserId] = { refCode, ts: Date.now() };
  writeJson(REF_PATH, refs);
}

export function upsertUser(userId, payload={}){
  const users = readJson(USERS_PATH);
  users[userId] = { ...(users[userId]||{}), ...payload, updated: Date.now() };
  writeJson(USERS_PATH, users);
}

export function statsFor(userId){
  const refs = readJson(REF_PATH);
  const myCode = getMyCode(userId);
  const joined = Object.values(refs).filter(r => r.refCode === myCode).length;
  return { myCode, joined };
}
