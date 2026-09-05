const test = require("node:test");
const assert = require("node:assert/strict");
const analytics = require("../analytics.js");

const moodScores = { heavy: 1, tender: 2, steady: 3, bright: 4, peaceful: 5 };
const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const entries = {};
for (let day = 1; day <= 14; day += 1) {
  const recent = day > 7;
  const score = recent ? 4 + (day % 2) : 2 + (day % 2);
  const mood = Object.keys(moodScores).find((key) => moodScores[key] === score);
  entries[`2025-01-${String(day).padStart(2, "0")}`] = {
    mood,
    stress: 6 - score,
    energy: score,
    namaj: Object.fromEntries(prayers.map((prayer, index) => [prayer, index < score]))
  };
}

const insights = analytics.buildWeeklyInsights(
  entries,
  "2025-01-14",
  (mood) => moodScores[mood],
  (namaj) => prayers.filter((prayer) => namaj[prayer]).length,
  prayers.length
);

test("weekly correlations use the seven-day window", () => {
  assert.equal(insights.sampleSize, 7);
  assert.ok(Math.abs(insights.correlations[0].value + 1) < 0.000001);
  assert.ok(Math.abs(insights.correlations[1].value - 1) < 0.000001);
});

test("check-in and positive mood streaks are calculated", () => {
  assert.equal(insights.streaks.checkins.best, 14);
  assert.equal(insights.streaks.positive.current, 7);
  assert.equal(insights.streaks.perfectNamaj.current, 0);
  assert.equal(insights.streaks.perfectNamaj.best, 1);
});

test("trend summaries compare this week with the previous week", () => {
  assert.equal(insights.trends.mood.direction, "up");
  assert.equal(insights.trends.mood.improving, true);
  assert.equal(insights.trends.stress.direction, "down");
  assert.equal(insights.trends.stress.improving, true);
  assert.equal(insights.trends.energy.delta, 1.9);
});

test("correlation requires three paired observations", () => {
  assert.equal(analytics.pearson([1, 2], [2, 1]), null);
});
