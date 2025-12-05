(async function initDashboard() {
  const institutions = await loadInstitutions();
  const customColumns = loadCustomColumns();

  renderSummaryCards(institutions, customColumns);
  renderTipoChart(institutions, customColumns);
  renderRegiaoChart(institutions, customColumns);
  renderMap(institutions, customColumns);
})();

function renderSummaryCards(data, customColumns) {
  const container = document.getElementById('summary-cards');
  const totalCapacitacoes = data.reduce((total, item) => total + sumQuantities(item, customColumns), 0);
  const totalInstituicoes = data.length;
  const regioes = new Set(data.map((i) => i.Regiao));

  const cards = [
    {
      title: 'Total de Capacitações e Recursos',
      value: totalCapacitacoes,
      badge: `${totalInstituicoes} instituições ativas`,
    },
    {
      title: 'Regiões atendidas',
      value: regioes.size,
      badge: 'Abrangência estadual',
    },
    {
      title: 'Tipos cadastrados',
      value: new Set(data.map((i) => i.Tipo)).size,
      badge: 'Oficinas, Recursos de TA, Pedagógicos e Open Day',
    },
  ];

  container.innerHTML = cards
    .map(
      (card) => `
      <div class="card">
        <h3>${card.title}</h3>
        <p class="stat-value">${card.value}</p>
        <span class="badge">${card.badge}</span>
      </div>
    `
    )
    .join('');
}

function renderTipoChart(data, customColumns) {
  const totals = {
    Oficinas: 0,
    'Recursos de TA': 0,
    'Recursos Pedagógicos': 0,
    'Open Day': 0,
  };

  data.forEach((item) => {
    totals['Oficinas'] += Number(item['Qt Oficinas'] || 0);
    totals['Recursos de TA'] += Number(item['Qt Recurso de TA'] || 0);
    totals['Recursos Pedagógicos'] += Number(item['Recursos Pedagogicos'] || 0);
    totals['Open Day'] += Number(item['Open Day'] || 0);
    customColumns.forEach((column) => {
      totals[column] = (totals[column] || 0) + Number(item[column] || 0);
    });
  });

  const ctx = document.getElementById('tipoChart');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(totals),
      datasets: [
        {
          label: 'Número de Capacitações e Recursos',
          data: Object.values(totals),
          backgroundColor: '#00a0df',
          borderRadius: 8,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function renderRegiaoChart(data, customColumns) {
  const totals = {};
  data.forEach((item) => {
    const regiao = item.Regiao || 'Não informado';
    totals[regiao] = (totals[regiao] || 0) + sumQuantities(item, customColumns);
  });

  const ctx = document.getElementById('regiaoChart');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(totals),
      datasets: [
        {
          label: 'Número de Capacitações e Recursos',
          data: Object.values(totals),
          backgroundColor: '#f59e0b',
          borderRadius: 8,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true },
      },
    },
  });
}

function renderMap(data, customColumns) {
  const map = L.map('map').setView([-27.2423, -50.2189], 6.7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  let atendidos = 0;
  data.forEach((item) => {
    const total = sumQuantities(item, customColumns);
    const coords = MUNICIPIO_COORDS[item.Municipio];
    if (coords && total > 0) {
      atendidos += 1;
      const popup = `
        <strong>${item.Municipio}</strong><br/>
        Instituição: ${item['Nome Inst.']}<br/>
        Tipo: ${item.Tipo}<br/>
        Endereço: ${item.Endereco}<br/>
        Telefone: ${item.Telefone}<br/>
        E-mail: ${item['E-mail']}<br/>
        Total de Capacitações e Recursos: ${total}
      `;
      L.circleMarker(coords, {
        radius: 10,
        color: '#005cb9',
        fillColor: '#00a0df',
        fillOpacity: 0.8,
      })
        .addTo(map)
        .bindPopup(popup);
    }
  });

  const badge = document.getElementById('mapaBadge');
  badge.textContent = atendidos > 0 ? `${atendidos} municípios com atendimentos` : 'Sem registros preenchidos';
}
