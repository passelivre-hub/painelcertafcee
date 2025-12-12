let tipoChart;
let localChart;
let mapa;
let geoLayer;
let dados = [];

function init() {
  dados = certaData.loadData();
  renderCharts();
  initMap();
}

function renderCharts() {
  const breakdown = certaData.getTipoBreakdown();
  const labelsTipo = ['Serviços', 'Recursos de TA', 'Open Day'];

  const centros = [breakdown.servicos.centros, breakdown.recursoTA.centros, breakdown.openDay.centros];
  const regioes = [breakdown.servicos.regioes, breakdown.recursoTA.regioes, breakdown.openDay.regioes];

  const tipoCtx = document.getElementById('chart-tipos');
  const localCtx = document.getElementById('chart-locais');

  if (tipoChart) tipoChart.destroy();
  if (localChart) localChart.destroy();

  // Paleta (sem verde): Serviços = vermelho GovSC, Recursos = laranja, Open Day = azul
  const colorsCentros = ['#c60c2f', '#f28c28', '#1f5aa6'];
  const colorsRegioes = ['rgba(198, 12, 47, 0.35)', 'rgba(242, 140, 40, 0.35)', 'rgba(31, 90, 166, 0.35)'];

  tipoChart = new Chart(tipoCtx, {
    type: 'bar',
    data: {
      labels: labelsTipo,
      datasets: [
        { label: 'Centros FCEE', data: centros, backgroundColor: colorsCentros, borderRadius: 8 },
        { label: 'Diversas regiões do estado', data: regioes, backgroundColor: colorsRegioes, borderRadius: 8 },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: true }, tooltip: { enabled: true } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: '#34424a' } },
        y: { stacked: true, beginAtZero: true, ticks: { stepSize: 10, color: '#6c7a82' }, grid: { color: '#d7dfe3' } },
      },
    },
  });

  const totalCentros = centros.reduce((a, b) => a + b, 0);
  const totalRegioes = regioes.reduce((a, b) => a + b, 0);

  localChart = new Chart(localCtx, {
    type: 'bar',
    data: {
      labels: ['Centros FCEE', 'Diversas regiões do estado'],
      datasets: [
        {
          label: 'Total',
          data: [totalCentros, totalRegioes],
          backgroundColor: ['#1f5aa6', '#f28c28'],
          borderRadius: 8,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#34424a' } },
        y: { beginAtZero: true, ticks: { stepSize: 20, color: '#6c7a82' }, grid: { color: '#d7dfe3' } },
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
      geoLayer = L.geoJSON(geojson, { style: estiloMunicipio, onEachFeature }).addTo(mapa);
    })
    .catch((err) => console.error('Erro ao carregar mapa', err));
}

function municipioTemInstituicao(nome) {
  const instituicoes = certaData.getInstituicoesPorMunicipio(nome, dados);
  return instituicoes.length > 0;
}

function estiloMunicipio(feature) {
  const nome = feature.properties.name;
  const ativo = municipioTemInstituicao(nome);
  return {
    weight: 0.8,
    color: '#ffffff',
    fillColor: ativo ? '#c60c2f' : '#c2c2c2',
    fillOpacity: ativo ? 0.65 : 0.35,
  };
}

function onEachFeature(feature, layer) {
  const nome = feature.properties.name;
  layer.on({ click: () => abrirPopup(nome, layer) });
  layer.bindTooltip(nome, { sticky: true, direction: 'top' });
}

function abrirPopup(municipio, layer) {
  const instituicoes = certaData.getInstituicoesPorMunicipio(municipio, dados);

  if (!instituicoes.length) {
    layer.bindPopup(`<div class="popup"><h4>${municipio}</h4><p>Sem instituições cadastradas.</p></div>`).openPopup();
    return;
  }

  const lista = instituicoes.map((inst) => `<li><strong>${inst.instituicao}</strong></li>`).join('');
  const html = `<div class="popup"><h4>${municipio}</h4><p>Instituições cadastradas:</p><ul>${lista}</ul></div>`;
  layer.bindPopup(html).openPopup();
}

document.addEventListener('DOMContentLoaded', init);
