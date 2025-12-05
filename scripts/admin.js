const credentials = { username: 'admin', password: 'certa2024' };
const sessionKey = 'certa-session-auth';
let institutions = [];
let customColumns = [];

(async function initAdmin() {
  customColumns = loadCustomColumns();
  institutions = await loadInstitutions();
  handleAuth();
  populateNewTypeSelect();
  renderTable();
  bindEvents();
})();

function populateNewTypeSelect() {
  const select = document.getElementById('new-type-select');
  if (!select) return;
  select.innerHTML = DEFAULT_TYPES.map((t) => `<option value="${t}">${t}</option>`).join('');
}

function handleAuth() {
  const logged = localStorage.getItem(sessionKey);
  if (!logged) {
    document.getElementById('login-overlay').style.display = 'grid';
    document.getElementById('login-btn').addEventListener('click', () => {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      if (username === credentials.username && password === credentials.password) {
        localStorage.setItem(sessionKey, 'true');
        document.getElementById('login-overlay').style.display = 'none';
      } else {
        document.getElementById('login-feedback').textContent = 'Usuário ou senha inválidos';
      }
    });
  }
}

function bindEvents() {
  document.getElementById('add-column-btn').addEventListener('click', () => {
    const label = prompt('Nome da nova coluna de quantidade:');
    if (!label) return;
    if (QUANTITY_FIELDS.includes(label) || customColumns.includes(label)) {
      alert('Essa coluna já existe.');
      return;
    }
    customColumns.push(label);
    institutions = institutions.map((item) => ({ ...item, [label]: 0 }));
    saveCustomColumns(customColumns);
    saveInstitutions(institutions);
    renderTable();
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem(sessionKey);
    location.reload();
  });

  document.getElementById('new-institution-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const entry = Object.fromEntries(new FormData(form).entries());
    QUANTITY_FIELDS.forEach((field) => {
      entry[field] = 0;
    });
    customColumns.forEach((field) => {
      entry[field] = 0;
    });
    institutions.push(entry);
    saveInstitutions(institutions);
    form.reset();
    renderTable();
  });
}

function renderTable() {
  const table = document.getElementById('institutions-table');
  const quantityColumns = [...QUANTITY_FIELDS, ...customColumns];
  const headers = [
    'Município',
    'Região',
    'Nome Inst.',
    'Tipo',
    'Endereço',
    'Telefone',
    'E-mail',
    ...quantityColumns,
    'Ações',
  ];

  const thead = `
    <thead>
      <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
    </thead>
  `;

  const rows = institutions
    .map((item, index) => {
      const quantityCells = quantityColumns
        .map(
          (col) => `
          <td>
            <input type="number" min="0" value="${item[col] || 0}" data-index="${index}" data-field="${col}" class="quantity-input" />
          </td>`
        )
        .join('');

      return `
        <tr>
          <td>${item.Municipio || ''}</td>
          <td>${item.Regiao || ''}</td>
          <td>${item['Nome Inst.'] || ''}</td>
          <td>
            <select data-index="${index}" data-field="Tipo" class="type-select">
              ${DEFAULT_TYPES.map((t) => `<option value="${t}" ${t === item.Tipo ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </td>
          <td><input value="${item.Endereco || ''}" data-index="${index}" data-field="Endereco" /></td>
          <td><input value="${item.Telefone || ''}" data-index="${index}" data-field="Telefone" /></td>
          <td><input value="${item['E-mail'] || ''}" data-index="${index}" data-field="E-mail" /></td>
          ${quantityCells}
          <td>
            <button class="danger" data-action="delete" data-index="${index}">Excluir</button>
          </td>
        </tr>
      `;
    })
    .join('');

  table.innerHTML = `
    ${thead}
    <tbody>
      ${rows}
    </tbody>
  `;

  bindTableEvents();
}

function bindTableEvents() {
  document.querySelectorAll('.quantity-input').forEach((input) => {
    input.addEventListener('change', handleFieldUpdate);
  });
  document.querySelectorAll('#institutions-table input:not(.quantity-input)').forEach((input) => {
    input.addEventListener('change', handleFieldUpdate);
  });
  document.querySelectorAll('.type-select').forEach((select) => {
    select.addEventListener('change', handleFieldUpdate);
  });
  document.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const idx = Number(e.target.getAttribute('data-index'));
      institutions.splice(idx, 1);
      saveInstitutions(institutions);
      renderTable();
    });
  });
}

function handleFieldUpdate(event) {
  const element = event.target;
  const idx = Number(element.getAttribute('data-index'));
  const field = element.getAttribute('data-field');
  institutions[idx][field] = element.type === 'number' ? Number(element.value) : element.value;
  saveInstitutions(institutions);
}
