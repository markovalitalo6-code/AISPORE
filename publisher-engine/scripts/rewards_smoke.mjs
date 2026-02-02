import { ensureUser, linkWallet, playSnakeCheckIn, topLeaderboard } from '../dist/services/rewards/engine.js';
console.log('If you are running TS directly, ignore this smoke test unless you have dist build.');

const id = 123;
ensureUser(id);
linkWallet(id, 'So11111111111111111111111111111111111111112', 12000, 45, 15, 0);
console.log(playSnakeCheckIn(id));
console.log(topLeaderboard(5));
