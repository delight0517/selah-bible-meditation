import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const helpers = html.match(/function localDayKey\(date=new Date\(\)\)\{[^}]+\}\nfunction attendanceStreak\([\s\S]*?(?=\nfunction renderAttendance)/)?.[0];
assert.ok(helpers, 'attendance helpers must remain in index.html');
assert.match(html, /function recordAttendance\(\)[^{]*\{[^}]*shareMeditationAttendance\(\)/);
assert.doesNotMatch(html.match(/async function beginMeditation\([\s\S]*?\nfunction releaseMeditation/)?.[0] ?? '', /shareMeditationAttendance/);
assert.match(html, /attendanceDays:db\.attendanceDays/);
const sideStart = html.indexOf('<aside class="side">');
assert.ok(sideStart >= 0 && html.indexOf('<div class="card stat-card">', sideStart) < html.indexOf('<details class="fold">', sideStart), 'attendance card must be visible outside the collapsed review section');
const streak = vm.runInNewContext(`${helpers}; attendanceStreak`);
const day = offset => {
  const date = new Date('2026-09-30T12:00:00');
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString('sv-SE');
};
assert.equal(streak([day(-2), day(-1), day(0)], day(0)), 3);
assert.equal(streak([day(-2), day(-1)], day(0)), 2);
assert.equal(streak([day(-2), day(0)], day(0)), 1);
assert.equal(streak([day(-3)], day(0)), 0);
console.log('attendance streak checks passed');
