// js/charts.js
// Grafici di crescita con riferimenti OMS (versione robusta)

/*
  NOTA:
  - Usiamo curve OMS MASCHI 0–5 anni come riferimento demo (peso/altezza per età).
  - p3 ≈ -2SD, p50 = mediana, p97 ≈ +2SD.
  - Per un uso reale andrebbero usate tabelle distinte maschi/femmine complete.
*/

// ---------- UTILITA' DI BASE ----------

function interpolateWho(refTable, ageMonths) {
  if (ageMonths == null || Number.isNaN(ageMonths)) return null;
  const keys = Object.keys(refTable)
    .map((k) => parseInt(k, 10))
    .sort((a, b) => a - b);
  if (!keys.length) return null;

  if (ageMonths <= keys[0]) return refTable[keys[0]];
  if (ageMonths >= keys[keys.length - 1]) return refTable[keys[keys.length - 1]];

  if (refTable[ageMonths]) return refTable[ageMonths];

  let lower = keys[0];
  let upper = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (ageMonths >= keys[i] && ageMonths <= keys[i + 1]) {
      lower = keys[i];
      upper = keys[i + 1];
      break;
    }
  }

  const t = (ageMonths - lower) / (upper - lower);
  const a = refTable[lower];
  const b = refTable[upper];

  return {
    p3: a.p3 + (b.p3 - a.p3) * t,
    p50: a.p50 + (b.p50 - a.p50) * t,
    p97: a.p97 + (b.p97 - a.p97) * t,
  };
}

function monthsBetween(birthDateStr, visitDateStr) {
  if (!birthDateStr || !visitDateStr) return null;
  const b = new Date(birthDateStr);
  const v = new Date(visitDateStr);
  if (Number.isNaN(b.getTime()) || Number.isNaN(v.getTime())) return null;

  const diffMs = v.getTime() - b.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays / 30.4375;
}

function buildProjection(points, monthsToProject = 6) {
  if (!points || points.length < 2) return [];

  const sorted = points.slice().sort((a, b) => a.x - b.x);
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];

  const dx = last.x - prev.x;
  if (dx <= 0) return [];

  const slope = (last.y - prev.y) / dx;
  const projection = [];
  const maxAge = last.x + monthsToProject;

  for (let x = Math.ceil(last.x) + 1; x <= maxAge; x += 1) {
    const y = last.y + slope * (x - last.x);
    if (y <= 0) continue;
    projection.push({ x, y: Number(y.toFixed(2)) });
  }

  return projection;
}

// ---------- TABELLE OMS SINTETICHE (MASCHI 0–5 ANNI) ----------

// Peso per età (kg) ~ maschi
const WHO_WEIGHT_REF = {
  0:  { p3: 2.5, p50: 3.3, p97: 4.4 },
  1:  { p3: 3.4, p50: 4.5, p97: 5.8 },
  2:  { p3: 4.3, p50: 5.6, p97: 7.1 },
  3:  { p3: 5.0, p50: 6.4, p97: 8.0 },
  4:  { p3: 5.6, p50: 7.0, p97: 8.7 },
  5:  { p3: 6.0, p50: 7.5, p97: 9.3 },
  6:  { p3: 6.4, p50: 7.9, p97: 9.8 },
  7:  { p3: 6.7, p50: 8.3, p97: 10.3 },
  8:  { p3: 6.9, p50: 8.6, p97: 10.7 },
  9:  { p3: 7.1, p50: 8.9, p97: 11.0 },
  10: { p3: 7.4, p50: 9.2, p97: 11.4 },
  11: { p3: 7.6, p50: 9.4, p97: 11.7 },
  12: { p3: 7.7, p50: 9.6, p97: 12.0 },
  13: { p3: 7.9, p50: 9.9, p97: 12.3 },
  14: { p3: 8.1, p50: 10.1, p97: 12.6 },
  15: { p3: 8.3, p50: 10.3, p97: 12.8 },
  16: { p3: 8.4, p50: 10.5, p97: 13.1 },
  17: { p3: 8.6, p50: 10.7, p97: 13.4 },
  18: { p3: 8.8, p50: 10.9, p97: 13.7 },
  19: { p3: 8.9, p50: 11.1, p97: 13.9 },
  20: { p3: 9.1, p50: 11.3, p97: 14.2 },
  21: { p3: 9.2, p50: 11.5, p97: 14.5 },
  22: { p3: 9.4, p50: 11.8, p97: 14.7 },
  23: { p3: 9.5, p50: 12.0, p97: 15.0 },
  24: { p3: 9.7, p50: 12.2, p97: 15.3 },
  30: { p3: 10.5, p50: 13.3, p97: 16.9 },
  36: { p3: 11.3, p50: 14.3, p97: 18.3 },
  48: { p3: 12.7, p50: 16.3, p97: 21.2 },
  60: { p3: 14.1, p50: 18.3, p97: 24.2 },
};

// Altezza per età (cm) ~ maschi
const WHO_HEIGHT_REF = {
  0:  { p3: 46.1, p50: 49.9, p97: 53.7 },
  1:  { p3: 50.8, p50: 54.7, p97: 58.6 },
  2:  { p3: 54.4, p50: 58.4, p97: 62.4 },
  3:  { p3: 57.3, p50: 61.4, p97: 65.5 },
  4:  { p3: 59.7, p50: 63.9, p97: 68.0 },
  5:  { p3: 61.7, p50: 65.9, p97: 70.1 },
  56: { p3: 98.8, p50: 107.8, p97: 116.7 },
  60: { p3: 99.9, p50: 109.4, p97: 118.9 },
};

// ---------- MODULO CHARTS ----------

const Charts = (function () {
  let weightChart = null;
  let heightChart = null;

  function destroyCharts() {
    if (weightChart) {
      weightChart.destroy();
      weightChart = null;
    }
    if (heightChart) {
      heightChart.destroy();
      heightChart = null;
    }
  }

  function buildWeightRef(maxAge) {
    const p3 = [];
    const p50 = [];
    const p97 = [];
    for (let m = 0; m <= maxAge; m += 1) {
      const ref = interpolateWho(WHO_WEIGHT_REF, m);
      if (!ref) continue;
      p3.push({ x: m, y: Number(ref.p3.toFixed(2)) });
      p50.push({ x: m, y: Number(ref.p50.toFixed(2)) });
      p97.push({ x: m, y: Number(ref.p97.toFixed(2)) });
    }
    return { p3, p50, p97 };
  }

  function buildHeightRef(maxAge) {
    const p3 = [];
    const p50 = [];
    const p97 = [];
    for (let m = 0; m <= maxAge; m += 1) {
      const ref = interpolateWho(WHO_HEIGHT_REF, m);
      if (!ref) continue;
      p3.push({ x: m, y: Number(ref.p3.toFixed(2)) });
      p50.push({ x: m, y: Number(ref.p50.toFixed(2)) });
      p97.push({ x: m, y: Number(ref.p97.toFixed(2)) });
    }
    return { p3, p50, p97 };
  }

  function update(child) {
    // 1. controlla che Chart.js sia caricato
    if (typeof Chart === "undefined") {
      console.error("Chart.js non è caricato (Chart è undefined).");
      return;
    }

    // 2. prendi i canvas ADESSO (così siamo sicuri che esistano)
    const weightCanvas = document.getElementById("weightChart");
    const heightCanvas = document.getElementById("heightChart");
    if (!weightCanvas && !heightCanvas) {
      // nessun grafico presente nel DOM
      return;
    }

    if (!child || !child.visite || !child.visite.length || !child.dataNascita) {
      destroyCharts();
      return;
    }

    const weightPoints = [];
    const heightPoints = [];

    child.visite.forEach((v) => {
      const ageMonths = monthsBetween(child.dataNascita, v.data);
      if (ageMonths == null || ageMonths < 0) return;

      const peso = parseFloat(v.peso);
      if (!Number.isNaN(peso)) {
        weightPoints.push({
          x: Number(ageMonths.toFixed(2)),
          y: peso,
        });
      }

      const altezza = parseFloat(v.altezza);
      if (!Number.isNaN(altezza)) {
        heightPoints.push({
          x: Number(ageMonths.toFixed(2)),
          y: altezza,
        });
      }
    });

    if (!weightPoints.length && !heightPoints.length) {
      destroyCharts();
      return;
    }

    const maxAgeVisits = Math.max(
      weightPoints.length ? Math.max(...weightPoints.map((p) => p.x)) : 0,
      heightPoints.length ? Math.max(...heightPoints.map((p) => p.x)) : 0
    );
    const maxAge = Math.min(60, Math.max(12, Math.ceil(maxAgeVisits) + 6));

    const weightProjection = buildProjection(weightPoints);
    const heightProjection = buildProjection(heightPoints);

    const weightRefs = buildWeightRef(maxAge);
    const heightRefs = buildHeightRef(maxAge);

    destroyCharts();

    // --- GRAFICO PESO ---
    if (weightCanvas && weightPoints.length) {
      weightChart = new Chart(weightCanvas.getContext("2d"), {
        type: "line",
        data: {
          datasets: [
            {
              label: "_3° percentile (OMS ~ -2SD)",
              data: weightRefs.p3,
              borderWidth: 1,
              tension: 0.2,
              pointRadius: 0,
              hideFromLegend: true,
            },
            {
              label: "_50° percentile (OMS)",
              data: weightRefs.p50,
              borderWidth: 1.5,
              tension: 0.2,
              pointRadius: 0,
              hideFromLegend: true,
            },
            {
              label: "_97° percentile (OMS ~ +2SD)",
              data: weightRefs.p97,
              borderWidth: 1,
              tension: 0.2,
              pointRadius: 0,
              hideFromLegend: true,
            },
            {
              label: "Peso bambino",
              data: weightPoints,
              borderWidth: 2,
              tension: 0,
              pointRadius: 3,
              hideFromLegend: false,
            },
            {
              label: "Proiezione (demo)",
              data: weightProjection,
              borderWidth: 1.5,
              borderDash: [6, 4],
              tension: 0,
              pointRadius: 0,
              hideFromLegend: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          parsing: false,
          layout: {
            padding: {
              bottom: 20,   // <-- spazio extra tra legenda e bordo del canvas
            },
          },
          scales: {
            x: {
              type: "linear",
              title: { display: true, text: "Età (mesi)" },
              ticks: { stepSize: 2 },
            },
            y: {
              title: { display: true, text: "Peso (kg)" },
            },
          },
          plugins: {
            legend: {
              position: "bottom",
              align: "start",
              labels: {
                usePointStyle: true,
                boxWidth: 10,
                padding: 10,
                font: { size: 11 },
                filter: (item) => {
                  const text = (item.text || "").trim();
                  // nasconde tutte le voci che iniziano con "_" (i percentili)
                  return !text.startsWith("_");
                },
              },
            },
          },
        },
      });
    }

    // --- GRAFICO ALTEZZA ---
    if (heightCanvas && heightPoints.length) {
      heightChart = new Chart(heightCanvas.getContext("2d"), {
        type: "line",
        data: {
          datasets: [
            {
              label: "_3° percentile (OMS ~ -2SD)",
              data: heightRefs.p3,
              borderWidth: 1,
              tension: 0.2,
              pointRadius: 0,
            },
            {
              label: "_50° percentile (OMS)",
              data: heightRefs.p50,
              borderWidth: 1.5,
              tension: 0.2,
              pointRadius: 0,
            },
            {
              label: "_97° percentile (OMS ~ +2SD)",
              data: heightRefs.p97,
              borderWidth: 1,
              tension: 0.2,
              pointRadius: 0,
            },
            {
              label: "Altezza bambino",
              data: heightPoints,
              borderWidth: 2,
              tension: 0,
              pointRadius: 3,

            },
            {
              label: "Proiezione (demo)",
              data: heightProjection,
              borderWidth: 1.5,
              borderDash: [6, 4],
              tension: 0,
              pointRadius: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          parsing: false,
          layout: {
            padding: {
              bottom: 20,   // <-- spazio extra tra legenda e bordo del canvas
            },
          },
          scales: {
            x: {
              type: "linear",
              title: { display: true, text: "Età (mesi)" },
              ticks: { stepSize: 2 },
            },
            y: {
              title: { display: true, text: "Lunghezza/altezza (cm)" },
            },
          },
          plugins: {
            legend: {
              position: "bottom",
              align: "start",
              labels: {
                usePointStyle: true,
                boxWidth: 10,
                padding: 10,
                font: { size: 11 },
                filter: (item) => {
                  const text = (item.text || "").trim();
                  // nasconde tutte le voci che iniziano con "_" (i percentili)
                  return !text.startsWith("_");
                },
              },
            },
          },
        },
      });
    }
  }

  return {
    update,
    destroy: destroyCharts,
  };
})();
