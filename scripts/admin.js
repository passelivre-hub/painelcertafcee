let creRows = [];

function initAdmin() {
  creRows = loadCreData();
  renderTable();
  fillSelects();
  bindActions();
}

function renderTable() {
  const table = document.getElementById('cre-table');
  table.innerHTML = '';
  const header = document.createElement('tr');
  ['CRE', 'Público EE', 'Nº Escolas', 'Escolas com AEE', 'Estudantes no AEE', 'Participantes', 'Presencial', 'Online', 'Sem assessoria?'].forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    header.appendChild(th);
  });
  table.appendChild(header);

  creRows.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.name}</td>
      <td><input type="number" min="0" value="${row.publicoEE}" data-field="publicoEE" data-index="${index}"></td>
      <td><input type="number" min="0" value="${row.escolas}" data-field="escolas" data-index="${index}"></td>
      <td><input type="number" min="0" value="${row.escolasAEE}" data-field="escolasAEE" data-index="${index}"></td>
      <td><input type="number" min="0" value="${row.estudantesAEE}" data-field="estudantesAEE" data-index="${index}"></td>
      <td><input type="number" min="0" value="${row.participantes}" data-field="participantes" data-index="${index}"></td>
      <td><input type="number" min="0" value="${row.presencial}" data-field="presencial" data-index="${index}"></td>
      <td><input type="number" min="0" value="${row.online}" data-field="online" data-index="${index}"></td>
      <td><input type="checkbox" data-field="hasAssessoria" data-index="${index}" ${row.hasAssessoria ? 'checked' : ''}></td>
    `;
    table.appendChild(tr);
  });

  table.querySelectorAll('input').forEach((input) => {
    input.addEventListener('change', (e) => {
      const idx = Number(e.target.dataset.index);
      const field = e.target.dataset.field;
      if (field === 'hasAssessoria') {
        creRows[idx][field] = e.target.checked;
      } else {
        creRows[idx][field] = Number(e.target.value);
      }
    });
  });
}

function fillSelects() {
  const select = document.getElementById('cre-select');
  select.innerHTML = '';
  creRows.forEach((cre) => {
    const option = document.createElement('option');
    option.value = cre.code;
    option.textContent = cre.name;
    select.appendChild(option);
  });
}

function bindActions() {
  document.getElementById('reset-data-btn').addEventListener('click', () => {
    creRows = [...DEFAULT_CRE_DATA];
    saveCreData(creRows);
    renderTable();
    fillSelects();
    setFeedback('Dados restaurados para o padrão inicial.');
  });

  document.getElementById('save-data-btn').addEventListener('click', () => {
    saveCreData(creRows);
    setFeedback('Informações salvas com sucesso.');
  });

  document.getElementById('add-assessoria-btn').addEventListener('click', () => {
    const creCode = document.getElementById('cre-select').value;
    const mode = document.getElementById('mode-select').value;
    const qty = Number(document.getElementById('qty-input').value) || 0;
    const cre = creRows.find((c) => c.code === creCode);
    if (!cre || qty <= 0) return setFeedback('Informe quantidade válida.');
    cre[mode] += qty;
    cre.hasAssessoria = true;
    renderTable();
    saveCreData(creRows);
    setFeedback(`Registradas ${qty} assessorias ${mode} na ${cre.name}.`);
  });
}

function setFeedback(message) {
  document.getElementById('admin-feedback').textContent = message;
}

document.addEventListener('DOMContentLoaded', initAdmin);
