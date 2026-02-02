import cron from 'node-cron';
import { dailyAccrualTick } from './engine';
import { runWeeklyDraw } from './draw';

export function startRewardCron() {
  // Daily at 00:00 UTC
  cron.schedule('0 0 * * *', () => {
    console.log('[rewards] daily accrual tick');
    dailyAccrualTick();
  }, { timezone: 'UTC' });

  // Weekly draw Monday 09:00 UTC
  cron.schedule('0 9 * * 1', () => {
    console.log('[rewards] weekly draw start');
    const res = runWeeklyDraw();
    console.log('[rewards] weekly draw done', res);
    // TODO: broadcast to TG/Discord from bot layer
  }, { timezone: 'UTC' });
}
