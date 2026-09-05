(function attachMoodAnalytics(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MOOD_ANALYTICS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createMoodAnalytics() {
  "use strict";

  function parseDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function toYmd(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function daysEndingAt(endDate, length, offset = 0) {
    const end = parseDate(endDate);
    return Array.from({ length }, (_, index) => {
      const date = new Date(end);
      date.setDate(end.getDate() - offset - (length - index - 1));
      return toYmd(date);
    });
  }

  function average(values) {
    return values.length ? values.reduce((sum, value) => sum + Number(value), 0) / values.length : null;
  }

  function pearson(a, b) {
    if (a.length < 3 || b.length !== a.length) return null;
    const avgA = average(a);
    const avgB = average(b);
    let numerator = 0;
    let denomA = 0;
    let denomB = 0;
    a.forEach((value, index) => {
      const da = value - avgA;
      const db = b[index] - avgB;
      numerator += da * db;
      denomA += da * da;
      denomB += db * db;
    });
    const denominator = Math.sqrt(denomA * denomB);
    return denominator ? numerator / denominator : null;
  }

  function consecutiveStreak(entries, dates, predicate = () => true) {
    let current = 0;
    let best = 0;
    dates.forEach((date) => {
      if (entries[date] && predicate(entries[date])) current += 1;
      else current = 0;
      best = Math.max(best, current);
    });
    return { current, best };
  }

  function dateRange(startValue, endValue) {
    const start = parseDate(startValue);
    const end = parseDate(endValue);
    const days = Math.max(0, Math.round((end - start) / 86400000));
    return Array.from({ length: days + 1 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return toYmd(date);
    });
  }

  function metricTrend(entries, currentDays, previousDays, getter, positiveDirection = "up") {
    const current = average(currentDays.map((date) => entries[date]).filter(Boolean).map(getter));
    const previous = average(previousDays.map((date) => entries[date]).filter(Boolean).map(getter));
    if (current === null || previous === null) return { current, previous, delta: null, direction: "insufficient", improving: null };
    const delta = Number((current - previous).toFixed(1));
    return {
      current: Number(current.toFixed(1)),
      previous: Number(previous.toFixed(1)),
      delta,
      direction: delta > 0 ? "up" : delta < 0 ? "down" : "steady",
      improving: delta === 0 ? null : positiveDirection === "up" ? delta > 0 : delta < 0
    };
  }

  function buildWeeklyInsights(entries, selectedDate, moodScore, completedNamajCount, prayerCount = 5) {
    const currentDays = daysEndingAt(selectedDate, 7);
    const previousDays = daysEndingAt(selectedDate, 7, 7);
    const logged = currentDays.map((date) => entries[date]).filter(Boolean);
    const values = {
      mood: logged.map((entry) => moodScore(entry.mood)),
      stress: logged.map((entry) => Number(entry.stress)),
      energy: logged.map((entry) => Number(entry.energy)),
      namaj: logged.map((entry) => completedNamajCount(entry.namaj) / prayerCount)
    };
    const savedDates = Object.keys(entries).sort();
    const allDates = savedDates.length && savedDates[0] <= selectedDate ? dateRange(savedDates[0], selectedDate) : [];
    const checkins = consecutiveStreak(entries, allDates);
    const positive = consecutiveStreak(entries, allDates, (entry) => moodScore(entry.mood) >= 4);
    const perfectNamaj = consecutiveStreak(entries, allDates, (entry) => completedNamajCount(entry.namaj) === prayerCount);
    return {
      sampleSize: logged.length,
      correlations: [
        { pair: "Mood + stress", value: pearson(values.mood, values.stress) },
        { pair: "Mood + energy", value: pearson(values.mood, values.energy) },
        { pair: "Namaj + mood", value: pearson(values.namaj, values.mood) }
      ],
      streaks: { checkins, positive, perfectNamaj },
      trends: {
        mood: metricTrend(entries, currentDays, previousDays, (entry) => moodScore(entry.mood), "up"),
        stress: metricTrend(entries, currentDays, previousDays, (entry) => Number(entry.stress), "down"),
        energy: metricTrend(entries, currentDays, previousDays, (entry) => Number(entry.energy), "up")
      }
    };
  }

  return { average, buildWeeklyInsights, consecutiveStreak, dateRange, daysEndingAt, metricTrend, pearson };
});
