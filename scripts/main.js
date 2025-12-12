let chartTiposStacked;
let chartTiposTotais;
let chartLocais;
let chartPercentCentros;

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function pct(n) {
  return `${(n * 100).toFixed(1).replace('.', ',')}%`;
}

function buildKpis(breakdown) {
  const totalServ = breakdown.servicos.total;
  const totalRec = breakdown.recursoTA.total;
  const totalOpen = breakdown.openDay.total;

  const total = totalServ + totalRec + totalOpen;

  const centros = breakdown.servicos.centros + breakdown.recursoTA.centros + breakdown.openDay.centros;
  const regioes = breakdown.servicos.regioes + breakdown.recursoTA.regioes + breakdown.openDay.regioes;

  setText('kpi-total', total);
  setText('kpi-centros', centros);
  setText('kpi-regioes', regioes);
  setText('kpi-prop-centros', pct(centros / Math.max(1, total)));
}

function destroyIfExists(chart) {
  if (chart) chart.destroy();
}

function renderCharts() {
  const breakdown = certaData.getTipoBreakdown();

  buildKpis(breakdown);

  const labels = ['Serviços', 'Recursos de TA', 'Open Day'];
  const centros = [breakdown.servicos.centros, breakdown.recursoTA.centros, breakdown.openDay.centros];
  const regioes = [breakdown.servicos.regioes, breakdown.recursoTA.regioes, breakdown.openDay.regioes];
  const totais = [breakdown.servicos.total, breakdown.recursoTA.total, breakdown.openDay.total];

  // Cores por tipo (sem verde)
  const colorServ = '#c60c2f';
  const colorRec  = '#f28c28';
  const colorOpen = '#1f5aa6';

  const colorsTipo = [colorServ, colorRec, colorOpen];
  const colorsTipoSoft = ['rgba(198, 12, 47, 0.35)', 'rgba(242, 140, 40, 0.35)', 'rgba(31, 90, 166, 0.35)'];

  // Chart 1: Tipos (empilhado) - Centros x Regiões
  const ctxStacked = document.getElementById('chart-tipos-stacked');
  destroyIfExists(chartTiposStacked);
  chartTiposStacked = new Chart(ctxStacked, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Centros FCEE', data: centros, backgroundColor: colorsTipo, borderRadius: 8 },
        { label: 'Diversas regiões do estado', data: regioes, backgroundColor: colorsTipoSoft, borderRadius: 8 },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: true }, tooltip: { enabled: true } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: '#34424a', font: { weight: '600' } } },
        y: { stacked: true, beginAtZero: true, ticks: { stepSize: 10, color: '#6c7a82' }, grid: { color: '#d7dfe3' } },
      },
    },
  });

  // Chart 2: Totais por tipo
  const ctxTotais = document.getElementById('chart-tipos-totais');
  destroyIfExists(chartTiposTotais);
  chartTiposTotais = new Chart(ctxTotais, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Total', data: totais, backgroundColor: colorsTipo, borderRadius: 8 },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#34424a', font: { weight: '600' } } },
        y: { beginAtZero: true, ticks: { stepSize: 20, color: '#6c7a82' }, grid: { color: '#d7dfe3' } },
      },
    },
  });

  // Chart 3: Consolidação Centros x Regiões
  const totalCentros = centros.reduce((a, b) => a + b, 0);
  const totalRegioes = regioes.reduce((a, b) => a + b, 0);

  const ctxLocais = document.getElementById('chart-locais');
  destroyIfExists(chartLocais);
  chartLocais = new Chart(ctxLocais, {
    type: 'bar',
    data: {
      labels: ['Centros FCEE', 'Diversas regiões do estado'],
      datasets: [
        { label: 'Total', data: [totalCentros, totalRegioes], backgroundColor: ['#1f5aa6', '#f28c28'], borderRadius: 8 },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#34424a', font: { weight: '600' } } },
        y: { beginAtZero: true, ticks: { stepSize: 20, color: '#6c7a82' }, grid: { color: '#d7dfe3' } },
      },
    },
  });

  // Chart 4: Percentual em Centros por tipo
  const pctCentros = totais.map((t, i) => (centros[i] / Math.max(1, t)) * 100);

  const ctxPct = document.getElementById('chart-percent-centros');
  destroyIfExists(chartPercentCentros);
  chartPercentCentros = new Chart(ctxPct, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: '% em Centros', data: pctCentros, backgroundColor: colorsTipo, borderRadius: 8 },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true, callbacks: {
        label: (ctx) => `${ctx.parsed.y.toFixed(1).replace('.', ',')}%`
      } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#34424a', font: { weight: '600' } } },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 10,
            color: '#6c7a82',
            callback: (v) => `${v}%`,
          },
          grid: { color: '#d7dfe3' },
        },
      },
    },
  });
}

document.addEventListener('DOMContentLoaded', renderCharts);
