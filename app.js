const STORAGE_KEY = "moodGarden.entries.v1";
const moodAnalytics = window.MOOD_ANALYTICS;

const moods = [
  { id: "heavy", name: "Heavy", color: "#d98880", score: 1 },
  { id: "tender", name: "Tender", color: "#d8aa58", score: 2 },
  { id: "steady", name: "Steady", color: "#8fb68f", score: 3 },
  { id: "bright", name: "Bright", color: "#6e9eb3", score: 4 },
  { id: "peaceful", name: "Peaceful", color: "#c7b7ef", score: 5 },
];

const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const els = {
  todayLabel: document.querySelector("#todayLabel"),
  checkinTab: document.querySelector("#checkinTab"),
  dashboardTab: document.querySelector("#dashboardTab"),
  checkinPage: document.querySelector("#checkinPage"),
  dashboardPage: document.querySelector("#dashboardPage"),
  dateButton: document.querySelector("#dateButton"),
  dateInput: document.querySelector("#dateInput"),
  prevDayBtn: document.querySelector("#prevDayBtn"),
  nextDayBtn: document.querySelector("#nextDayBtn"),
  moodGrid: document.querySelector("#moodGrid"),
  stressRange: document.querySelector("#stressRange"),
  energyRange: document.querySelector("#energyRange"),
  stressValue: document.querySelector("#stressValue"),
  energyValue: document.querySelector("#energyValue"),
  namajCount: document.querySelector("#namajCount"),
  namajPills: document.querySelector("#namajPills"),
  saveState: document.querySelector("#saveState"),
  saveBtn: document.querySelector("#saveBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  importInput: document.querySelector("#importInput"),
  monthCount: document.querySelector("#monthCount"),
  commonMood: document.querySelector("#commonMood"),
  avgStress: document.querySelector("#avgStress"),
  avgEnergy: document.querySelector("#avgEnergy"),
  calendarHead: document.querySelector("#calendarHead"),
  calendarGrid: document.querySelector("#calendarGrid"),
  weekRange: document.querySelector("#weekRange"),
  weeklyPreview: document.querySelector("#weeklyPreview"),
  dashboardMonth: document.querySelector("#dashboardMonth"),
  dashboardCount: document.querySelector("#dashboardCount"),
  moodPie: document.querySelector("#moodPie"),
  trendChart: document.querySelector("#trendChart"),
  scatterChart: document.querySelector("#scatterChart"),
  weeklyChart: document.querySelector("#weeklyChart"),
  correlationGrid: document.querySelector("#correlationGrid"),
  weeklyInsightRange: document.querySelector("#weeklyInsightRange"),
  weeklySample: document.querySelector("#weeklySample"),
  streakCards: document.querySelector("#streakCards"),
  trendSummary: document.querySelector("#trendSummary"),
  weeklyCorrelations: document.querySelector("#weeklyCorrelations"),
  namajReportMonth: document.querySelector("#namajReportMonth"),
  namajReportCards: document.querySelector("#namajReportCards"),
  prayerChart: document.querySelector("#prayerChart"),
};

let entries = loadEntries();
let selectedDate = toYmd(new Date());
let draft = getBlankDraft();

function loadEntries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toYmd(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromYmd(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value, style = "long") {
  const date = fromYmd(value);
  return new Intl.DateTimeFormat("en", {
    weekday: style === "long" ? "long" : undefined,
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatMonth(value) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(fromYmd(value));
}

function getBlankDraft() {
  return {
    mood: "steady",
    stress: 3,
    energy: 3,
    namaj: Object.fromEntries(prayers.map((prayer) => [prayer, false])),
  };
}

function moodById(id) {
  return moods.find((mood) => mood.id === id) || moods[2];
}

function moodScore(id) {
  return moodById(id).score;
}

function loadDraftForDate() {
  const blank = getBlankDraft();
  draft = entries[selectedDate]
    ? { ...blank, ...entries[selectedDate], namaj: { ...blank.namaj, ...entries[selectedDate].namaj } }
    : blank;
}

function selectDate(value) {
  selectedDate = value;
  loadDraftForDate();
  render();
}

function shiftDate(days) {
  const date = fromYmd(selectedDate);
  date.setDate(date.getDate() + days);
  selectDate(toYmd(date));
}

function setPage(page) {
  const isDashboard = page === "dashboard";
  els.checkinTab.classList.toggle("isActive", !isDashboard);
  els.dashboardTab.classList.toggle("isActive", isDashboard);
  els.checkinPage.classList.toggle("isActive", !isDashboard);
  els.dashboardPage.classList.toggle("isActive", isDashboard);
}

function renderMoodButtons() {
  els.moodGrid.innerHTML = "";
  moods.forEach((mood) => {
    const button = document.createElement("button");
    button.className = "moodButton";
    button.type = "button";
    button.setAttribute("aria-pressed", String(draft.mood === mood.id));
    button.innerHTML = `
      <span class="moodDot" style="background:${mood.color}"></span>
      <span class="moodName">${mood.name}</span>
    `;
    button.addEventListener("click", () => {
      draft.mood = mood.id;
      els.saveState.textContent = "Unsaved changes";
      renderMoodButtons();
    });
    els.moodGrid.appendChild(button);
  });
}

function completedNamajCount(namaj = {}) {
  return prayers.filter((prayer) => Boolean(namaj[prayer])).length;
}

function renderNamajPills() {
  const completed = completedNamajCount(draft.namaj);
  els.namajCount.textContent = `${completed} / 5 completed`;
  els.namajPills.innerHTML = "";
  prayers.forEach((prayer) => {
    const button = document.createElement("button");
    button.className = "namajPill";
    button.type = "button";
    button.setAttribute("aria-pressed", String(Boolean(draft.namaj[prayer])));
    button.textContent = prayer;
    button.addEventListener("click", () => {
      draft.namaj[prayer] = !draft.namaj[prayer];
      els.saveState.textContent = "Unsaved changes";
      renderNamajPills();
    });
    els.namajPills.appendChild(button);
  });
}

function renderSelectedDay() {
  const isToday = selectedDate === toYmd(new Date());
  els.todayLabel.textContent = isToday ? "Today" : "Daily check-in";
  els.dateButton.textContent = formatDate(selectedDate);
  els.dateInput.value = selectedDate;
  els.stressRange.value = draft.stress;
  els.energyRange.value = draft.energy;
  els.stressValue.textContent = draft.stress;
  els.energyValue.textContent = draft.energy;
  els.saveState.textContent = entries[selectedDate] ? "Saved" : "Not saved yet";
  renderNamajPills();
}

function monthEntries(dateValue) {
  const date = fromYmd(dateValue);
  const year = date.getFullYear();
  const month = date.getMonth();
  return Object.entries(entries)
    .filter(([key]) => {
      const entryDate = fromYmd(key);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month;
    })
    .sort(([a], [b]) => a.localeCompare(b));
}

function average(values) {
  if (!values.length) return "—";
  return (values.reduce((sum, value) => sum + Number(value), 0) / values.length).toFixed(1);
}

function getMonthStats() {
  const monthData = monthEntries(selectedDate);
  const counts = new Map(moods.map((mood) => [mood.id, 0]));
  monthData.forEach(([, entry]) => {
    counts.set(entry.mood, (counts.get(entry.mood) || 0) + 1);
  });
  const common = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return { monthData, counts, common };
}

function renderSummary() {
  const { monthData, common } = getMonthStats();
  els.monthCount.textContent = `${monthData.length} day${monthData.length === 1 ? "" : "s"}`;
  els.avgStress.textContent = average(monthData.map(([, entry]) => entry.stress));
  els.avgEnergy.textContent = average(monthData.map(([, entry]) => entry.energy));
  els.commonMood.textContent = common && common[1] > 0 ? moodById(common[0]).name : "—";
}

function renderCalendar() {
  const selected = fromYmd(selectedDate);
  const year = selected.getFullYear();
  const month = selected.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const offset = (first.getDay() + 6) % 7;

  els.calendarHead.textContent = formatMonth(selectedDate);
  els.calendarGrid.innerHTML = "";

  for (let i = 0; i < offset; i += 1) {
    const blank = document.createElement("span");
    blank.className = "dayCell isEmpty";
    els.calendarGrid.appendChild(blank);
  }

  for (let day = 1; day <= last.getDate(); day += 1) {
    const date = `${year}-${pad(month + 1)}-${pad(day)}`;
    const entry = entries[date];
    const mood = moodById(entry?.mood);
    const button = document.createElement("button");
    button.className = `dayCell${date === selectedDate ? " isSelected" : ""}`;
    button.type = "button";
    button.textContent = day;
    button.style.background = entry ? mood.color : "rgba(255, 255, 255, 0.46)";
    button.style.color = entry ? "#ffffff" : "";
    button.addEventListener("click", () => selectDate(date));
    els.calendarGrid.appendChild(button);
  }
}

function renderWeeklyPreview() {
  const selected = fromYmd(selectedDate);
  const start = new Date(selected);
  start.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toYmd(date);
  });
  const logged = days.map((date) => entries[date]).filter(Boolean);
  const avgMood = average(logged.map((entry) => moodScore(entry.mood)));
  const avgStress = average(logged.map((entry) => entry.stress));
  const avgEnergy = average(logged.map((entry) => entry.energy));

  els.weekRange.textContent = `${formatDate(days[0], "short")} - ${formatDate(days[6], "short")}`;
  els.weeklyPreview.innerHTML = `
    <div class="weekOutcomeStats">
      <div><span class="statLabel">Avg mood</span><strong>${avgMood}</strong></div>
      <div><span class="statLabel">Stress</span><strong>${avgStress}</strong></div>
      <div><span class="statLabel">Energy</span><strong>${avgEnergy}</strong></div>
    </div>
    <div class="weekDots">
      ${days.map((date) => {
        const entry = entries[date];
        const mood = entry ? moodById(entry.mood) : null;
        return `
          <button class="weekDot" type="button" data-date="${date}" style="background:${mood ? mood.color : "rgba(255,255,255,.5)"}">
            <span>${fromYmd(date).getDate()}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;

  els.weeklyPreview.querySelectorAll(".weekDot").forEach((button) => {
    button.addEventListener("click", () => selectDate(button.dataset.date));
  });
}

function renderMoodPie(monthData, counts) {
  const total = monthData.length;
  if (!total) {
    els.moodPie.innerHTML = `
      <div class="pieChart emptyPie"></div>
      <div class="pieLegend"><span class="panelSub">Save entries to build the monthly mood pie.</span></div>
    `;
    return;
  }

  let cursor = 0;
  const stops = moods.map((mood) => {
    const count = counts.get(mood.id) || 0;
    const start = cursor;
    const end = cursor + (count / total) * 100;
    cursor = end;
    return `${mood.color} ${start}% ${end}%`;
  }).join(", ");

  els.moodPie.innerHTML = `
    <div class="pieChart" style="background:conic-gradient(${stops})"></div>
    <div class="pieLegend">
      ${moods.map((mood) => {
        const count = counts.get(mood.id) || 0;
        const percent = Math.round((count / total) * 100);
        return `
          <div class="pieLegendRow">
            <span><span class="chip" style="background:${mood.color}"></span>${mood.name}</span>
            <strong>${percent}%</strong>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function pointPath(values, width, height, padX, padY) {
  if (!values.length) return "";
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;
  return values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : padX + (index / (values.length - 1)) * usableW;
      const y = padY + ((5 - value) / 4) * usableH;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function renderTrendChart(monthData) {
  if (!monthData.length) {
    els.trendChart.innerHTML = `<p class="panelSub">Save a few days to see the trend graph.</p>`;
    return;
  }

  const width = 520;
  const height = 200;
  const padX = 30;
  const padY = 18;
  const stressValues = monthData.map(([, entry]) => Number(entry.stress));
  const energyValues = monthData.map(([, entry]) => Number(entry.energy));
  const stressPath = pointPath(stressValues, width, height, padX, padY);
  const energyPath = pointPath(energyValues, width, height, padX, padY);

  const points = (values, className) => values
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : padX + (index / (values.length - 1)) * (width - padX * 2);
      const y = padY + ((5 - value) / 4) * (height - padY * 2);
      return `<circle class="${className}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4"></circle>`;
    })
    .join("");

  els.trendChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Stress and energy trend">
      <line class="chartAxis" x1="${padX}" y1="${padY}" x2="${padX}" y2="${height - padY}"></line>
      <line class="chartAxis" x1="${padX}" y1="${height - padY}" x2="${width - padX}" y2="${height - padY}"></line>
      <path class="chartLineStress" d="${stressPath}"></path>
      <path class="chartLineEnergy" d="${energyPath}"></path>
      ${points(stressValues, "chartPointStress")}
      ${points(energyValues, "chartPointEnergy")}
    </svg>
    <div class="legend">
      <span><span class="chip" style="background:var(--rose)"></span>Stress</span>
      <span><span class="chip" style="background:var(--sky)"></span>Energy</span>
    </div>
  `;
}

function renderScatterChart(monthData) {
  if (!monthData.length) {
    els.scatterChart.innerHTML = `<p class="panelSub">Save days to see mood and stress together.</p>`;
    return;
  }

  const width = 520;
  const height = 220;
  const pad = 34;
  const points = monthData.map(([date, entry]) => {
    const x = pad + ((Number(entry.stress) - 1) / 4) * (width - pad * 2);
    const y = pad + ((5 - moodScore(entry.mood)) / 4) * (height - pad * 2);
    const radius = 5 + Number(entry.energy);
    const mood = moodById(entry.mood);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" fill="${mood.color}"><title>${date}: ${mood.name}, stress ${entry.stress}, energy ${entry.energy}</title></circle>`;
  }).join("");

  els.scatterChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Mood and stress scatter chart">
      <line class="chartAxis" x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}"></line>
      <line class="chartAxis" x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}"></line>
      ${points}
      <text class="axisLabel" x="${width / 2}" y="${height - 6}">Stress</text>
      <text class="axisLabel" x="4" y="22">Mood</text>
    </svg>
    <div class="legend"><span>Dot size reflects energy</span></div>
  `;
}

function weekIndexInMonth(dateValue) {
  const date = fromYmd(dateValue);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  return Math.floor((offset + date.getDate() - 1) / 7);
}

function renderWeeklyChart(monthData) {
  const weekBuckets = new Map();
  monthData.forEach(([date, entry]) => {
    const week = weekIndexInMonth(date) + 1;
    const bucket = weekBuckets.get(week) || { mood: [], stress: [], energy: [] };
    bucket.mood.push(moodScore(entry.mood));
    bucket.stress.push(Number(entry.stress));
    bucket.energy.push(Number(entry.energy));
    weekBuckets.set(week, bucket);
  });

  if (!weekBuckets.size) {
    els.weeklyChart.innerHTML = `<p class="panelSub">Save entries to compare weekly outcomes.</p>`;
    return;
  }

  const rows = [...weekBuckets.entries()].map(([week, bucket]) => ({
    week,
    mood: Number(average(bucket.mood)),
    stress: Number(average(bucket.stress)),
    energy: Number(average(bucket.energy)),
  }));

  els.weeklyChart.innerHTML = `
    <div class="weeklyBars">
      ${rows.map((row) => `
        <div class="weeklyBarGroup">
          <span class="weekLabel">W${row.week}</span>
          <div class="verticalBars">
            <span class="verticalBar moodBar" style="height:${row.mood * 32}px"></span>
            <span class="verticalBar stressBar" style="height:${row.stress * 32}px"></span>
            <span class="verticalBar energyBar" style="height:${row.energy * 32}px"></span>
          </div>
        </div>
      `).join("")}
    </div>
    <div class="legend">
      <span><span class="chip" style="background:var(--lavender)"></span>Mood</span>
      <span><span class="chip" style="background:var(--rose)"></span>Stress</span>
      <span><span class="chip" style="background:var(--sky)"></span>Energy</span>
    </div>
  `;
}

function pearson(a, b) {
  if (a.length < 3 || b.length < 3) return null;
  const avgA = a.reduce((sum, value) => sum + value, 0) / a.length;
  const avgB = b.reduce((sum, value) => sum + value, 0) / b.length;
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
  const denom = Math.sqrt(denomA * denomB);
  return denom ? numerator / denom : null;
}

function describeCorrelation(value) {
  if (value === null) return "Needs at least 3 logged days";
  const strength = Math.abs(value);
  const direction = value > 0 ? "positive" : value < 0 ? "negative" : "flat";
  if (strength >= 0.7) return `Strong ${direction} pattern`;
  if (strength >= 0.4) return `Moderate ${direction} pattern`;
  if (strength >= 0.2) return `Light ${direction} pattern`;
  return "No clear pattern yet";
}

function renderCorrelations(monthData) {
  const moodScores = monthData.map(([, entry]) => moodScore(entry.mood));
  const stressValues = monthData.map(([, entry]) => Number(entry.stress));
  const energyValues = monthData.map(([, entry]) => Number(entry.energy));
  const namajValues = monthData.map(([, entry]) => completedNamajCount(entry.namaj) / prayers.length);
  const correlations = [
    { pair: "Mood + stress", value: pearson(moodScores, stressValues) },
    { pair: "Mood + energy", value: pearson(moodScores, energyValues) },
    { pair: "Stress + energy", value: pearson(stressValues, energyValues) },
    { pair: "Namaj + mood", value: pearson(namajValues, moodScores) },
    { pair: "Namaj + stress", value: pearson(namajValues, stressValues) },
    { pair: "Namaj + energy", value: pearson(namajValues, energyValues) },
  ];

  els.correlationGrid.innerHTML = "";
  correlations.forEach((item) => {
    const card = document.createElement("div");
    card.className = "correlationCard";
    card.innerHTML = `
      <span class="correlationPair">${item.pair}</span>
      <strong class="correlationValue">${item.value === null ? "—" : item.value.toFixed(2)}</strong>
      <span class="correlationText">${describeCorrelation(item.value)}</span>
    `;
    els.correlationGrid.appendChild(card);
  });

}

function trendSentence(label, trend) {
  if (trend.delta === null) return `${label} needs entries in both weeks.`;
  if (trend.direction === "steady") return `${label} held steady at ${trend.current}.`;
  const direction = trend.direction === "up" ? "increased" : "decreased";
  const outcome = trend.improving ? "a helpful shift" : "worth watching";
  return `${label} ${direction} by ${Math.abs(trend.delta).toFixed(1)} to ${trend.current} — ${outcome}.`;
}

function renderWeeklyIntelligence() {
  const insights = moodAnalytics.buildWeeklyInsights(entries, selectedDate, moodScore, completedNamajCount, prayers.length);
  els.weeklySample.textContent = `${insights.sampleSize} logged day${insights.sampleSize === 1 ? "" : "s"}`;
  els.weeklyInsightRange.textContent = `7 days ending ${formatDate(selectedDate, "short")} vs previous 7 days`;
  const streaks = [
    ["Check-ins", insights.streaks.checkins.current, insights.streaks.checkins.best],
    ["Bright / peaceful", insights.streaks.positive.current, insights.streaks.positive.best],
    ["All 5 Namaj", insights.streaks.perfectNamaj.current, insights.streaks.perfectNamaj.best]
  ];
  els.streakCards.innerHTML = streaks.map(([label, current, best]) => `<div class="insightCard"><span>${label}</span><strong>${current} day${current === 1 ? "" : "s"}</strong><small>Current · best ${best}</small></div>`).join("");
  els.trendSummary.innerHTML = [
    trendSentence("Mood", insights.trends.mood),
    trendSentence("Stress", insights.trends.stress),
    trendSentence("Energy", insights.trends.energy)
  ].map((text) => `<div class="insightCard narrative"><span>${text}</span></div>`).join("");
  els.weeklyCorrelations.innerHTML = insights.correlations.map((item) => `<div class="insightCard"><span>${item.pair}</span><strong>${item.value === null ? "—" : item.value.toFixed(2)}</strong><small>${describeCorrelation(item.value)}</small></div>`).join("");
}

function currentMonthDays() {
  const date = fromYmd(selectedDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const last = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: last }, (_, index) => `${year}-${pad(month + 1)}-${pad(index + 1)}`);
}

function longestNamajStreak(days) {
  let current = 0;
  let best = 0;
  days.forEach((date) => {
    const entry = entries[date];
    if (entry && completedNamajCount(entry.namaj) === prayers.length) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  });
  return best;
}

function renderNamajReport() {
  const days = currentMonthDays();
  const loggedDays = days.filter((date) => entries[date]);
  const possible = days.length * prayers.length;
  const completed = days.reduce((sum, date) => sum + completedNamajCount(entries[date]?.namaj), 0);
  const completion = possible ? Math.round((completed / possible) * 100) : 0;
  const loggedCompletion = loggedDays.length
    ? Math.round((completed / (loggedDays.length * prayers.length)) * 100)
    : 0;
  const perfectDays = days.filter((date) => completedNamajCount(entries[date]?.namaj) === prayers.length).length;
  const streak = longestNamajStreak(days);

  els.namajReportMonth.textContent = formatMonth(selectedDate);
  els.namajReportCards.innerHTML = `
    <div class="reportCard"><span>Monthly completion</span><strong>${completion}%</strong></div>
    <div class="reportCard"><span>Logged-day completion</span><strong>${loggedCompletion}%</strong></div>
    <div class="reportCard"><span>Perfect days</span><strong>${perfectDays}</strong></div>
    <div class="reportCard"><span>Best streak</span><strong>${streak} day${streak === 1 ? "" : "s"}</strong></div>
    <div class="reportCard"><span>Total completed</span><strong>${completed} / ${possible}</strong></div>
  `;

  const prayerCounts = prayers.map((prayer) => {
    const count = days.filter((date) => Boolean(entries[date]?.namaj?.[prayer])).length;
    return { prayer, count, percent: days.length ? Math.round((count / days.length) * 100) : 0 };
  });
  els.prayerChart.innerHTML = `
    ${prayerCounts.map((item) => `
      <div class="prayerRow">
        <span>${item.prayer}</span>
        <div class="barTrack"><div class="barFill prayerFill" style="width:${item.percent}%"></div></div>
        <strong>${item.percent}%</strong>
      </div>
    `).join("")}
  `;
}

function renderDashboard() {
  const { monthData, counts } = getMonthStats();
  els.dashboardMonth.textContent = formatMonth(selectedDate);
  els.dashboardCount.textContent = `${monthData.length} logged day${monthData.length === 1 ? "" : "s"}`;
  renderMoodPie(monthData, counts);
  renderTrendChart(monthData);
  renderScatterChart(monthData);
  renderWeeklyChart(monthData);
  renderCorrelations(monthData);
  renderWeeklyIntelligence();
  renderNamajReport();
}

function render() {
  renderSelectedDay();
  renderMoodButtons();
  renderSummary();
  renderCalendar();
  renderWeeklyPreview();
  renderDashboard();
}

function saveDay() {
  entries[selectedDate] = {
    mood: draft.mood,
    stress: Number(draft.stress),
    energy: Number(draft.energy),
    namaj: { ...draft.namaj },
    savedAt: new Date().toISOString(),
  };
  persist();
  render();
}

function clearDay() {
  delete entries[selectedDate];
  persist();
  loadDraftForDate();
  render();
}

function exportJson() {
  const payload = {
    app: "Mahera's Mood",
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `maheras-mood-${toYmd(new Date())}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(reader.result);
      const imported = parsed.entries && typeof parsed.entries === "object" ? parsed.entries : parsed;
      entries = { ...entries, ...imported };
      persist();
      loadDraftForDate();
      render();
    } catch {
      window.alert("That JSON file could not be imported.");
    }
  });
  reader.readAsText(file);
}

els.checkinTab.addEventListener("click", () => setPage("checkin"));
els.dashboardTab.addEventListener("click", () => setPage("dashboard"));
els.prevDayBtn.addEventListener("click", () => shiftDate(-1));
els.nextDayBtn.addEventListener("click", () => shiftDate(1));
els.dateButton.addEventListener("click", () => {
  if (typeof els.dateInput.showPicker === "function") {
    els.dateInput.showPicker();
  } else {
    els.dateInput.focus();
  }
});
els.dateInput.addEventListener("change", () => selectDate(els.dateInput.value));
els.stressRange.addEventListener("input", () => {
  draft.stress = Number(els.stressRange.value);
  els.stressValue.textContent = draft.stress;
  els.saveState.textContent = "Unsaved changes";
});
els.energyRange.addEventListener("input", () => {
  draft.energy = Number(els.energyRange.value);
  els.energyValue.textContent = draft.energy;
  els.saveState.textContent = "Unsaved changes";
});
els.saveBtn.addEventListener("click", saveDay);
els.clearBtn.addEventListener("click", clearDay);
els.exportBtn.addEventListener("click", exportJson);
els.importInput.addEventListener("change", () => importJson(els.importInput.files[0]));

loadDraftForDate();
render();
