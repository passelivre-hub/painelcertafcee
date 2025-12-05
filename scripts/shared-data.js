const STORAGE_KEY = 'certa-institutions';
const CUSTOM_COLUMNS_KEY = 'certa-custom-columns';
const DEFAULT_TYPES = ['Todos', 'Oficinas', 'Recursos de TA', 'Recursos Pedagógicos', 'Open Day'];
const QUANTITY_FIELDS = ['Qt Oficinas', 'Qt Recurso de TA', 'Recursos Pedagogicos', 'Open Day'];

const MUNICIPIO_COORDS = {
  'Florianópolis': [-27.5954, -48.5480],
  'Joinville': [-26.3044, -48.8487],
  'Chapecó': [-27.1004, -52.6152],
  'Blumenau': [-26.9155, -49.0709],
  'Criciúma': [-28.6775, -49.3697],
};

async function fetchCsvData() {
  const response = await fetch('data/instituicoes.csv');
  const text = await response.text();
  return parseCsv(text);
}

function parseCsv(text) {
  const [headerLine, ...rows] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  return rows.map((row) => {
    const values = row.split(',');
    return headers.reduce((acc, header, idx) => {
      acc[header.trim()] = (values[idx] || '').trim();
      return acc;
    }, {});
  });
}

async function loadInstitutions() {
  const persisted = localStorage.getItem(STORAGE_KEY);
  if (persisted) {
    return JSON.parse(persisted);
  }
  const initial = await fetchCsvData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveInstitutions(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadCustomColumns() {
  const persisted = localStorage.getItem(CUSTOM_COLUMNS_KEY);
  if (persisted) {
    return JSON.parse(persisted);
  }
  const defaults = [];
  localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveCustomColumns(columns) {
  localStorage.setItem(CUSTOM_COLUMNS_KEY, JSON.stringify(columns));
}

function sumQuantities(entry, customColumns) {
  const baseTotal = QUANTITY_FIELDS.reduce((total, field) => total + Number(entry[field] || 0), 0);
  const customTotal = customColumns.reduce((total, column) => total + Number(entry[column] || 0), 0);
  return baseTotal + customTotal;
}
