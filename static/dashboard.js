const statValues = document.querySelectorAll(".stat-value");
const lastUpdated = document.getElementById("last-updated");
const insightList = document.getElementById("insight-list");
const sessionGrid = document.getElementById("session-grid");

const chartData = {
  line: [0.62, 0.66, 0.63, 0.68, 0.71, 0.74, 0.76, 0.79, 0.82, 0.84, 0.86, 0.88],
  bar: [42, 58, 64, 71, 69, 76, 83, 79],
  gauge: 0.87,
};

const formatValue = (value, suffix) => {
  const isFloat = value % 1 !== 0;
  return `${isFloat ? value.toFixed(1) : Math.round(value)}${suffix || ""}`;
};

const animateStatValue = (el, target) => {
  const suffix = el.dataset.suffix || "";
  const startValue = Number(el.textContent.replace(/[^\d.]/g, "")) || 0;
  const delta = target - startValue;
  const duration = 900;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const current = startValue + delta * progress;
    el.textContent = formatValue(current, suffix);
    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

const animateStats = () => {
  statValues.forEach((el) => {
    const target = Number(el.dataset.value);
    animateStatValue(el, target);
  });
};

const drawLineChart = (canvas) => {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const padding = 24;
  const points = chartData.line.map((value, index) => ({
    x: index,
    y: value,
  }));

  const maxY = 1.05;
  const minY = 0.4;
  const scaleX = (width - padding * 2) / (points.length - 1);
  const scaleY = (height - padding * 2) / (maxY - minY);

  ctx.strokeStyle = "rgba(111, 29, 39, 0.15)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = padding + i * ((height - padding * 2) / 3);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "#8a2230";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  points.forEach((point, index) => {
    const x = padding + index * scaleX;
    const y = height - padding - (point.y - minY) * scaleY;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.fillStyle = "#a72b3d";
  points.forEach((point, index) => {
    const x = padding + index * scaleX;
    const y = height - padding - (point.y - minY) * scaleY;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawBarChart = (canvas) => {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const data = chartData.bar;
  const padding = 20;
  const barWidth = (width - padding * 2) / data.length - 8;
  const maxVal = Math.max(...data);

  ctx.fillStyle = "rgba(111, 29, 39, 0.12)";
  ctx.fillRect(0, height - padding - 2, width, 2);

  data.forEach((value, index) => {
    const x = padding + index * (barWidth + 8);
    const barHeight = ((height - padding * 2) * value) / maxVal;
    ctx.fillStyle = "#6f1d27";
    ctx.fillRect(x, height - padding - barHeight, barWidth, barHeight);
    ctx.fillStyle = "rgba(167, 43, 61, 0.35)";
    ctx.fillRect(x, height - padding - barHeight, barWidth, 6);
  });
};

const drawGauge = (canvas) => {
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  const centerX = width / 2;
  const centerY = height * 0.65;
  const radius = Math.min(width, height) * 0.36;
  const value = chartData.gauge;

  ctx.lineWidth = 18;
  ctx.strokeStyle = "rgba(111, 29, 39, 0.15)";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, Math.PI, 0);
  ctx.stroke();

  ctx.strokeStyle = "#8a2230";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, Math.PI, Math.PI * (1 - value));
  ctx.stroke();

  ctx.fillStyle = "#3d0f15";
  ctx.font = "600 26px Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(value * 100)}%`, centerX, centerY - 10);

  ctx.fillStyle = "rgba(61, 15, 21, 0.7)";
  ctx.font = "14px Segoe UI, sans-serif";
  ctx.fillText("Composite Score", centerX, centerY + 18);
};

const sizeCanvas = (canvas) => {
  const ratio = window.devicePixelRatio || 1;
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
};

const renderCharts = () => {
  const line = document.getElementById("line-chart");
  const bar = document.getElementById("bar-chart");
  const gauge = document.getElementById("gauge-chart");

  [line, bar, gauge].forEach((canvas) => {
    sizeCanvas(canvas);
  });

  drawLineChart(line);
  drawBarChart(bar);
  drawGauge(gauge);
};

const updateTimestamp = () => {
  const now = new Date();
  lastUpdated.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

window.addEventListener("resize", () => {
  renderCharts();
});

const applyDashboardData = (payload) => {
  if (!payload) return;

  const { stats, charts, recent_questions, sessions, timestamp } = payload;

  if (stats) {
    const mapping = [
      stats.model_accuracy,
      stats.questions_asked,
      stats.avg_confidence,
      stats.active_simulations,
      stats.inference_latency_ms,
    ];
    statValues.forEach((el, index) => {
      const nextValue = mapping[index];
      if (nextValue !== undefined) {
        el.dataset.value = nextValue;
      }
    });
    animateStats();
  }

  if (charts) {
    if (Array.isArray(charts.line)) chartData.line = charts.line;
    if (Array.isArray(charts.bar)) chartData.bar = charts.bar;
    if (typeof charts.gauge === "number") chartData.gauge = charts.gauge;
    renderCharts();
  }

  if (insightList && Array.isArray(recent_questions)) {
    insightList.innerHTML = "";
    recent_questions.forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "insight-item";
      wrapper.innerHTML = `
        <strong>${item.question}</strong>
        <span class="insight-value">Confidence: ${item.confidence}% · ${item.time}</span>
      `;
      insightList.appendChild(wrapper);
    });
  }

  if (sessionGrid && Array.isArray(sessions)) {
    sessionGrid.innerHTML = "";
    sessions.forEach((entry) => {
      const card = document.createElement("div");
      card.className = "detail-card";
      card.innerHTML = `
        <p class="detail-label">${entry.title}</p>
        <p class="detail-value">${entry.count} messages</p>
        <p class="detail-meta">${entry.last_time}</p>
      `;
      card.addEventListener("click", () => {
        window.location.href = `/history/${entry.chat_id}`;
      });
      sessionGrid.appendChild(card);
    });
  }

  if (timestamp && lastUpdated) {
    const parsed = new Date(timestamp);
    lastUpdated.textContent = parsed.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    updateTimestamp();
  }
};

const fetchDashboardData = async () => {
  try {
    const response = await fetch("/api/dashboard");
    if (!response.ok) return;
    const payload = await response.json();
    applyDashboardData(payload);
  } catch (error) {
    updateTimestamp();
  }
};

animateStats();
renderCharts();
updateTimestamp();
fetchDashboardData();
setInterval(fetchDashboardData, 20000);
