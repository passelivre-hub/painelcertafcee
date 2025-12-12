let tipoChart;
let regiaoChart;
let mapa;
let geoLayer;
let dados = [];

function init() {
  dados = certaData.loadData();
  renderCharts();
  initMap();
}

function renderCharts() {
  const totals = certaData.aggregateByTipo(dados);
  const regiaoTotals = certaData.aggregateByRegiao(dados);

  const tipoCtx = document.getElementById('chart-tipos');
  const regiaoCtx = document.getElementById('chart-regioes');

  const tipoData = [totals.servicos, totals.recursoTA, totals.openDay];
  const labelsTipo = ['Serviços', 'Recursos de TA', 'Open Day'];

  const regiaoData = REGIOES.map((reg) => regiaoTotals[reg] || 0);

  if (tipoChart) tipoChart.destroy();
  if (regiaoChart) regiaoChart.destroy();

  tipoChart = new Chart(tipoCtx, {
    type: 'bar',
    data: {
      labels: labelsTipo,
      datasets: [
        {
          label: 'Quantidade',
          data: tipoData,
          backgroundColor: ['#c60c2f', '#d63c55', '#e46a7d'],
          borderRadius: 8,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#34424a' },
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#6c7a82' },
          grid: { color: '#d7dfe3' },
        },
      },
    },
  });

  regiaoChart = new Chart(regiaoCtx, {
    type: 'bar',
    data: {
      labels: REGIOES,
      datasets: [
        {
          label: 'Total',
          data: regiaoData,
          backgroundColor: '#c60c2f',
          borderRadius: 8,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#34424a' },
        },
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1, color: '#6c7a82' },
          grid: { color: '#d7dfe3' },
        },
      },
    },
  });
}

function initMap() {
  mapa = L.map('map').setView([-27.1, -50.9], 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 12,
    attribution: '&copy; OpenStreetMap',
  }).addTo(mapa);

  fetch('sc_municipios.geojson')
    .then((res) => res.json())
    .then((geojson) => {
      geoLayer = L.geoJSON(geojson, {
        style: estiloMunicipio,
        onEachFeature,
      }).addTo(mapa);
    })
    .catch((err) => console.error('Erro ao carregar mapa', err));
}

function hasAtendimento(nome) {
  const totais = certaData.aggregateMunicipios(dados);
  const info = totais[nome];
  if (!info) return false;
  return info.servicos + info.recursoTA + info.openDay > 0;
}

function estiloMunicipio(feature) {
  const nome = feature.properties.name;
  const ativo = hasAtendimento(nome);
  return {
    weight: 0.8,
    color: '#ffffff',
    fillColor: ativo ? '#c60c2f' : '#c2c2c2',
    fillOpacity: ativo ? 0.65 : 0.35,
  };
}

function onEachFeature(feature, layer) {
  const nome = feature.properties.name;
  layer.on({
    click: () => abrirPopup(nome, layer),
  });
  layer.bindTooltip(nome, { sticky: true, direction: 'top' });
}

function abrirPopup(municipio, layer) {
  const instituicoes = certaData.getInstituicoesPorMunicipio(municipio, dados);
  if (!instituicoes.length) {
    layer.bindPopup(`<div class="popup"><h4>${municipio}</h4><p>Sem instituições cadastradas.</p></div>`).openPopup();
    return;
  }

  const lista = instituicoes
    .map((inst) => {
      return `<li><strong>${inst.instituicao}</strong><br>Serviços: ${inst.servicos} · Recursos TA: ${inst.recursoTA}<br>Open Day: ${inst.openDay}</li>`;
    })
    .join('');

  const html = `<div class="popup"><h4>${municipio}</h4><ul>${lista}</ul></div>`;
  layer.bindPopup(html).openPopup();
}

document.addEventListener('DOMContentLoaded', init);
