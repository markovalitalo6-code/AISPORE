import { ensureUser, linkWallet, playSnakeCheckIn, topLeaderboard } from '../src/services/rewards/engine';
import { runWeeklyDraw } from '../src/services/rewards/draw';
import db from '../src/services/rewards/db';

const userId = 123;

console.log('--- rewards_dev_draw_test ---');

ensureUser(userId);
linkWallet(userId, 'So11111111111111111111111111111111111111112', 12000, 45, 15, 0);

// Simuloidaan että käyttäjä on pelannut tarpeeksi
db.prepare('UPDATE users SET totalPlays = 12 WHERE userId = ?').run(userId);

// Varmistetaan että on tikettejä tällä viikolla
playSnakeCheckIn(userId);

console.log('leaderboard before draw:', topLeaderboard(5));

const res = runWeeklyDraw();
console.log('draw result:', res);

console.log('leaderboard after draw:', topLeaderboard(5));
