let tabela;
let dados = [];

function initAdmin() {
  tabela = document.getElementById('cre-table');
  dados = certaData.loadData();
  renderTabela();
  document.getElementById('add-row-btn').addEventListener('click', adicionarLinha);
  document.getElementById('reset-data-btn').addEventListener('click', () => {
    dados = certaData.resetData();
    renderTabela();
  });
  document.getElementById('save-data-btn').addEventListener('click', () => {
    certaData.saveData(dados);
    alert('Dados salvos com sucesso');
  });
}

function renderTabela() {
  tabela.innerHTML = '';
  const header = document.createElement('thead');
  header.innerHTML = `
    <tr>
      <th>Município</th>
      <th>Região</th>
      <th>Nome da Instituição</th>
      <th>Qt de Oficinas</th>
      <th>Qt de Recurso de TA</th>
      <th>Recursos Pedagógicos</th>
      <th>Open Day</th>
      <th>Ações</th>
    </tr>`;
  tabela.appendChild(header);

  const body = document.createElement('tbody');
  dados.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" value="${item.municipio}" data-field="municipio" data-idx="${idx}"></td>
      <td>${criarSelectRegiao(item.regiao, idx)}</td>
      <td><input type="text" value="${item.instituicao}" data-field="instituicao" data-idx="${idx}"></td>
      <td><input type="number" min="0" value="${item.oficinas}" data-field="oficinas" data-idx="${idx}"></td>
      <td><input type="number" min="0" value="${item.recursoTA}" data-field="recursoTA" data-idx="${idx}"></td>
      <td><input type="number" min="0" value="${item.recursosPedagogicos}" data-field="recursosPedagogicos" data-idx="${idx}"></td>
      <td><input type="number" min="0" value="${item.openDay}" data-field="openDay" data-idx="${idx}"></td>
      <td><button class="secondary" data-action="remove" data-idx="${idx}">Excluir</button></td>
    `;
    body.appendChild(tr);
  });
  tabela.appendChild(body);

  tabela.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', onEditarCampo);
  });
  tabela.querySelectorAll('select').forEach((select) => {
    select.addEventListener('change', onEditarCampo);
  });
  tabela.querySelectorAll('button[data-action="remove"]').forEach((btn) => {
    btn.addEventListener('click', onRemoverLinha);
  });
}

function criarSelectRegiao(valor, idx) {
  const options = REGIOES.map((r) => `<option value="${r}" ${r === valor ? 'selected' : ''}>${r}</option>`).join('');
  return `<select data-field="regiao" data-idx="${idx}">${options}</select>`;
}

function onEditarCampo(evt) {
  const idx = Number(evt.target.dataset.idx);
  const field = evt.target.dataset.field;
  const val = evt.target.type === 'number' ? Number(evt.target.value || 0) : evt.target.value;
  dados[idx][field] = val;
}

function onRemoverLinha(evt) {
  const idx = Number(evt.target.dataset.idx);
  dados.splice(idx, 1);
  renderTabela();
}

function adicionarLinha() {
  dados.push({
    municipio: 'Novo município',
    regiao: REGIOES[0],
    instituicao: 'Nova instituição',
    oficinas: 0,
    recursoTA: 0,
    recursosPedagogicos: 0,
    openDay: 0,
  });
  renderTabela();
}

document.addEventListener('DOMContentLoaded', initAdmin);
