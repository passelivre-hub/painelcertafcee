const greenPalette = [
  '#004b23', '#006400', '#228b22', '#2f7a4d', '#3aa76d', '#57c17b', '#7bd38d', '#a7e3b2', '#c7f2cf', '#e4f7e8'
];
const neutralGray = '#b8c2c4';

let creData = [];
let map;
let municipalityToCre = {};
let selectedCreCode = null;
let modeChart;
let modalModeChart;
let modalEl;
let gaugeCharts = {};
let modalGaugeCharts = {};

const normalizeName = (str) =>
  (str || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .trim();

function init() {
  creData = loadCreData();
  renderHero();
  setupTotals();
  setupCharts();
  setupModal();
  initMap();
}

function renderHero() {
  const heading = document.querySelector('#hero-title');
  if (heading) {
    const kicker = heading.querySelector('.hero-kicker');
    if (kicker) kicker.textContent = 'SAEEX/NAEE - FCEE';
    heading.querySelector('h1').textContent = 'Painel de Assessorias';
    const subtitle = heading.querySelector('.hero-sub');
    if (subtitle) subtitle.textContent = '';
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

  document.getElementById('impacto-profissionais').textContent = totals.participantes.toLocaleString('pt-BR');
  document.getElementById('impacto-estudantes').textContent = totals.estudantesAEE.toLocaleString('pt-BR');

  renderGeneralGauges(totals);
}

function setupCharts() {
  const totals = computeAggregates(creData);
  const ctxMode = document.getElementById('modoChart').getContext('2d');
  if (modeChart) modeChart.destroy();
  modeChart = new Chart(ctxMode, {
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
      cutout: '60%'
    },
  });
}

function setupModal() {
  modalEl = document.getElementById('cre-modal');
  const closeBtn = document.getElementById('cre-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }
}

function initMap() {
  map = L.map('map').setView([-27.3, -50.9], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap',
    minZoom: 6,
    maxZoom: 12,
  }).addTo(map);

  const mapStatus = document.getElementById('map-status');
  if (mapStatus) mapStatus.textContent = 'Carregando municípios...';

  fetch('sc_municipios.geojson')
    .then((res) => res.json())
    .then((geojson) => {
      municipalityToCre = buildMunicipalityIndex();

      const layer = L.geoJSON(geojson, {
        style: featureStyle,
        onEachFeature: attachFeatureEvents,
      });
      layer.addTo(map);
      if (mapStatus) mapStatus.textContent = '';
      setTimeout(() => map.invalidateSize(), 100);
    })
    .catch((err) => {
      console.error('Erro ao carregar mapa', err);
      if (mapStatus) mapStatus.textContent = 'Não foi possível carregar o mapa. Recarregue a página ou verifique a conexão.';
    });
}

function featureStyle(feature) {
  const creCode =
    municipalityToCre[feature.properties.name] || municipalityToCre[normalizeName(feature.properties.name)];
  const cre = creData.find((c) => c.code === creCode);
  const baseColor =
    cre && cre.hasAssessoria ? greenPalette[cre.colorIndex % greenPalette.length] : neutralGray;
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
  const creCode =
    municipalityToCre[feature.properties.name] || municipalityToCre[normalizeName(feature.properties.name)];
  const cre = creData.find((c) => c.code === creCode);
  e.target.setStyle({ weight: 2, color: '#0b7a3d' });
  const tip = document.getElementById('map-tooltip');
  tip.innerHTML = `<strong>${feature.properties.name}</strong><br>${cre ? cre.name : ''}`;
}

function resetHighlight(e, feature) {
  e.target.setStyle({ weight: 0.5, color: '#ffffff' });
  const tip = document.getElementById('map-tooltip');
  tip.innerHTML = 'Passe o mouse para ver o município<br>e clique para abrir a CRE';
}

function selectCre(municipioName) {
  const creCode = municipalityToCre[municipioName] || municipalityToCre[normalizeName(municipioName)];
  selectedCreCode = creCode;
  const cre = creData.find((c) => c.code === creCode);
  if (!cre) return;
  renderCreDetail(cre, municipioName);
}

function buildMunicipalityIndex() {
  const index = {};
  const creLookup = {};
  creData.forEach((cre) => {
    const creName = cre.regionName || cre.name.replace(/^CRE\s*/i, '');
    creLookup[normalizeName(creName)] = cre.code;
  });

  Object.entries(MUNICIPALITY_CRE_MAP).forEach(([municipio, creName]) => {
    const code = creLookup[normalizeName(creName)];
    if (code) {
      index[municipio] = code;
      index[normalizeName(municipio)] = code;
    }
  });

  return index;
}

function renderCreDetail(cre, municipioName) {
  const container = document.getElementById('cre-modal');
  const coverage = calculateCoverage(cre);
  container.querySelector('.cre-title').textContent = `${cre.name}`;
  container.querySelector('.cre-subtitle').textContent = `Município selecionado: ${municipioName}`;
  container.querySelector('[data-field="participantes"]').textContent = cre.participantes;
  container.querySelector('[data-field="presencial"]').textContent = cre.presencial;
  container.querySelector('[data-field="online"]').textContent = cre.online;
  container.querySelector('[data-field="faltantes"]').textContent = `${coverage.faltantesAEE} (${coverage.percForaAEE.toFixed(1)}%)`;
  container.querySelector('[data-field="escolas-sem-aee"]').textContent = `${coverage.escolasSemAEE} (${coverage.percEscolasSemAEE.toFixed(1)}%)`;
  container.classList.add('active');

  if (modalEl) {
    modalEl.classList.add('open');
  }

  renderModalCharts(cre);
}

function closeModal() {
  if (modalEl) {
    modalEl.classList.remove('open');
    modalEl.classList.remove('active');
  }
}

function renderGeneralGauges(totals) {
  const studentPercent = totals.publicoEE ? Math.min(100, (totals.estudantesAEE / totals.publicoEE) * 100) : 0;
  renderGauge('gaugeAEE', studentPercent, totals.estudantesAEE, totals.publicoEE);
  const studentValue = document.getElementById('gaugeAEEValue');
  if (studentValue)
    studentValue.textContent = `${totals.estudantesAEE.toLocaleString('pt-BR')} de ${totals.publicoEE.toLocaleString('pt-BR')} (${studentPercent.toFixed(1)}%)`;

  const escolaPercent = totals.escolas ? Math.min(100, (totals.escolasAEE / totals.escolas) * 100) : 0;
  renderGauge('gaugeEscolas', escolaPercent, totals.escolasAEE, totals.escolas);
  const escolaValue = document.getElementById('gaugeEscolasValue');
  if (escolaValue)
    escolaValue.textContent = `${totals.escolasAEE.toLocaleString('pt-BR')} de ${totals.escolas.toLocaleString('pt-BR')} (${escolaPercent.toFixed(1)}%)`;
}

function renderModalCharts(cre) {
  const modoCtx = document.getElementById('creModoChart').getContext('2d');
  if (modalModeChart) modalModeChart.destroy();
  modalModeChart = new Chart(modoCtx, {
    type: 'doughnut',
    data: {
      labels: ['Presencial', 'Online'],
      datasets: [{
        data: [cre.presencial, cre.online],
        backgroundColor: ['#0b7a3d', '#7ac29a'],
        borderWidth: 0,
      }],
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      cutout: '60%',
    },
  });

  const studentPercent = cre.publicoEE ? Math.min(100, (cre.estudantesAEE / cre.publicoEE) * 100) : 0;
  renderGauge('creGaugeAEE', studentPercent, cre.estudantesAEE, cre.publicoEE, modalGaugeCharts);
  const studentVal = document.getElementById('creGaugeAEEValue');
  if (studentVal)
    studentVal.textContent = `${cre.estudantesAEE.toLocaleString('pt-BR')} de ${cre.publicoEE.toLocaleString('pt-BR')} (${studentPercent.toFixed(1)}%)`;

  const escolaPercent = cre.escolas ? Math.min(100, (cre.escolasAEE / cre.escolas) * 100) : 0;
  renderGauge('creGaugeEscolas', escolaPercent, cre.escolasAEE, cre.escolas, modalGaugeCharts);
  const escolaVal = document.getElementById('creGaugeEscolasValue');
  if (escolaVal)
    escolaVal.textContent = `${cre.escolasAEE.toLocaleString('pt-BR')} de ${cre.escolas.toLocaleString('pt-BR')} (${escolaPercent.toFixed(1)}%)`;
}

function renderGauge(canvasId, percent, value, total, registry = gaugeCharts) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (registry[canvasId]) registry[canvasId].destroy();
  registry[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [
        {
          data: [percent, 100 - percent],
          meta: { value, total, percent },
          backgroundColor: ['#0b7a3d', '#e6f3e6'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      rotation: -90,
      circumference: 180,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context) => {
              const meta = context.dataset.meta;
              if (!meta) return '';
              const totalLabel = (meta.total ?? 0).toLocaleString('pt-BR');
              const valueLabel = (meta.value ?? 0).toLocaleString('pt-BR');
              return `${valueLabel} de ${totalLabel} (${(meta.percent ?? 0).toFixed(1)}%)`;
            },
          },
        },
      },
      cutout: '70%',
    },
  });
}

document.addEventListener('DOMContentLoaded', init);
