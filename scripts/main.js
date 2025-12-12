const greenPalette = [
  '#004b23', '#006400', '#228b22', '#2f7a4d', '#3aa76d', '#57c17b', '#7bd38d', '#a7e3b2', '#c7f2cf', '#e4f7e8'
];
const neutralGray = '#b8c2c4';

let creData = [];
let map;
let municipalityToCre = {};
let selectedCreCode = null;
let detailChart;

function init() {
  creData = loadCreData();
  renderHero();
  setupTotals();
  setupCharts();
  initMap();
}

function renderHero() {
  const heading = document.querySelector('#hero-title');
  if (heading) {
    heading.textContent = 'Painel de Assessorias do SAEEX/NAEE - FCEE';
  }
}

function setupTotals() {
  const totals = computeAggregates(creData);
  const indicators = document.getElementById('general-indicators');
  indicators.innerHTML = '';
  const cards = [
    { label: 'Público EE', value: totals.publicoEE.toLocaleString('pt-BR') },
    { label: 'Escolas', value: totals.escolas.toLocaleString('pt-BR') },
    { label: 'Escolas com AEE', value: totals.escolasAEE.toLocaleString('pt-BR') },
    { label: 'Estudantes no AEE', value: totals.estudantesAEE.toLocaleString('pt-BR') },
    { label: 'Participantes', value: totals.participantes.toLocaleString('pt-BR') },
  ];
  cards.forEach((card) => {
    const el = document.createElement('div');
    el.className = 'stat-card';
    el.innerHTML = `<span>${card.label}</span><strong>${card.value}</strong>`;
    indicators.appendChild(el);
  });

  document.getElementById('totals-presencial').textContent = totals.presencial;
  document.getElementById('totals-online').textContent = totals.online;
}

function setupCharts() {
  const totals = computeAggregates(creData);
  const ctxMode = document.getElementById('modoChart').getContext('2d');
  new Chart(ctxMode, {
    type: 'doughnut',
    data: {
      labels: ['Presencial', 'Online'],
      datasets: [{
        data: [totals.presencial, totals.online],
        backgroundColor: ['#0b7a3d', '#7ac29a'],
        borderWidth: 0,
      }],
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      cutout: '55%'
    },
  });

  const ctxCobertura = document.getElementById('coberturaChart').getContext('2d');
  new Chart(ctxCobertura, {
    type: 'bar',
    data: {
      labels: creData.slice(0, 12).map((c) => c.name.split(' - ')[1]),
      datasets: [
        {
          label: '% Estudantes fora do AEE',
          data: creData.slice(0, 12).map((c) => Number(calculateCoverage(c).percForaAEE.toFixed(1))),
          backgroundColor: '#2f7a4d',
        },
        {
          label: '% Escolas sem AEE',
          data: creData.slice(0, 12).map((c) => Number(calculateCoverage(c).percEscolasSemAEE.toFixed(1))),
          backgroundColor: '#a7e3b2',
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { callback: (v) => `${v}%` },
        },
      },
      plugins: { legend: { position: 'bottom' } },
    },
  });
}

function initMap() {
  map = L.map('map').setView([-27.3, -50.9], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    minZoom: 6,
    maxZoom: 12,
  }).addTo(map);

  fetch('sc_municipios.geojson')
    .then((res) => res.json())
    .then((geojson) => {
      const names = geojson.features.map((f) => f.properties.name).sort();
      names.forEach((name, idx) => {
        const cre = creData[idx % creData.length];
        municipalityToCre[name] = cre.code;
      });

      const layer = L.geoJSON(geojson, {
        style: featureStyle,
        onEachFeature: attachFeatureEvents,
      });
      layer.addTo(map);
    });
}

function featureStyle(feature) {
  const creCode = municipalityToCre[feature.properties.name];
  const cre = creData.find((c) => c.code === creCode) || creData[0];
  const baseColor = cre.hasAssessoria ? greenPalette[cre.colorIndex % greenPalette.length] : neutralGray;
  return {
    color: '#ffffff',
    weight: 0.5,
    fillColor: baseColor,
    fillOpacity: 0.85,
  };
}

function attachFeatureEvents(feature, layer) {
  layer.on({
    mouseover: (e) => highlightFeature(e, feature),
    mouseout: (e) => resetHighlight(e, feature),
    click: () => selectCre(feature.properties.name),
  });
}

function highlightFeature(e, feature) {
  const creCode = municipalityToCre[feature.properties.name];
  const cre = creData.find((c) => c.code === creCode);
  e.target.setStyle({ weight: 2, color: '#0b7a3d' });
  const tip = document.getElementById('map-tooltip');
  tip.innerHTML = `<strong>${feature.properties.name}</strong><br>${cre ? cre.name : ''}`;
}

function resetHighlight(e, feature) {
  e.target.setStyle({ weight: 0.5, color: '#ffffff' });
  const tip = document.getElementById('map-tooltip');
  tip.textContent = 'Passe o mouse para ver o município e clique para abrir a CRE';
}

function selectCre(municipioName) {
  const creCode = municipalityToCre[municipioName];
  selectedCreCode = creCode;
  const cre = creData.find((c) => c.code === creCode);
  if (!cre) return;
  renderCreDetail(cre, municipioName);
}

function renderCreDetail(cre, municipioName) {
  const container = document.getElementById('cre-detail');
  const coverage = calculateCoverage(cre);
  const semAEELabel = 'Fora do AEE';
  const semEscolaAEELabel = 'Escolas sem AEE';
  container.querySelector('.cre-title').textContent = `${cre.name}`;
  container.querySelector('.cre-subtitle').textContent = `Município selecionado: ${municipioName}`;
  container.querySelector('[data-field="publico-ee"]').textContent = cre.publicoEE.toLocaleString('pt-BR');
  container.querySelector('[data-field="escolas"]').textContent = cre.escolas;
  container.querySelector('[data-field="escolas-aee"]').textContent = cre.escolasAEE;
  container.querySelector('[data-field="estudantes-aee"]').textContent = cre.estudantesAEE;
  container.querySelector('[data-field="participantes"]').textContent = cre.participantes;
  container.querySelector('[data-field="presencial"]').textContent = cre.presencial;
  container.querySelector('[data-field="online"]').textContent = cre.online;
  container.querySelector('[data-field="faltantes"]').textContent = `${coverage.faltantesAEE} (${coverage.percForaAEE.toFixed(1)}%)`;
  container.querySelector('[data-field="escolas-sem-aee"]').textContent = `${coverage.escolasSemAEE} (${coverage.percEscolasSemAEE.toFixed(1)}%)`;
  container.classList.add('active');

  const chartCtx = document.getElementById('creChart').getContext('2d');
  if (detailChart) detailChart.destroy();
  detailChart = new Chart(chartCtx, {
    type: 'radar',
    data: {
      labels: ['Público EE', 'Estudantes no AEE', semAEELabel, 'Escolas com AEE', semEscolaAEELabel, 'Participantes'],
      datasets: [
        {
          label: cre.name,
          data: [
            cre.publicoEE,
            cre.estudantesAEE,
            coverage.faltantesAEE,
            cre.escolasAEE,
            coverage.escolasSemAEE,
            cre.participantes,
          ],
          backgroundColor: 'rgba(0, 122, 74, 0.3)',
          borderColor: '#0b7a3d',
          borderWidth: 2,
          pointBackgroundColor: '#0b7a3d',
        },
      ],
    },
    options: {
      scales: { r: { angleLines: { color: '#dfe7e2' }, grid: { color: '#dfe7e2' } } },
      plugins: { legend: { display: false } },
    },
  });
}

document.addEventListener('DOMContentLoaded', init);
