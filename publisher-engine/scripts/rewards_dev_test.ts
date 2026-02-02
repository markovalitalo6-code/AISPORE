import { ensureUser, linkWallet, playSnakeCheckIn, topLeaderboard } from '../src/services/rewards/engine';
import { runWeeklyDraw } from '../src/services/rewards/draw';

const userId = 123;

console.log('--- rewards_dev_test ---');

ensureUser(userId);

const link = linkWallet(
  userId,
  'So11111111111111111111111111111111111111112',
  12000,   // tokensHeld
  45,      // walletAgeDays
  15,      // txCount
  0        // isBurned
);
console.log('linkWallet:', link);

const play = playSnakeCheckIn(userId);
console.log('playSnakeCheckIn:', play);

const lb = topLeaderboard(5);
console.log('leaderboard:', lb);

const winners = runWeeklyDraw();
console.log('weeklyDraw winners:', winners);
