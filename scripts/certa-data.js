const STORAGE_KEY = 'certa-data';

/**
 * ✅ Totais FIXOS para apresentação no GitHub Pages
 * (não dependem de CSV, admin ou localStorage)
 *
 * Serviços: 68 (40 Centros FCEE + 28 Diversas regiões)
 * Recursos de TA: 222 (205 Centros FCEE + 17 Diversas regiões)
 * Open Day: 46 (35 Centros FCEE + 11 Diversas regiões)
 *
 * Observação importante:
 * - Paleta sem verde (solicitação): Serviços em vermelho GovSC, Recursos em laranja e Open Day em azul.
 */
const CERTA_TIPO_BREAKDOWN = {
  servicos:  { total: 68,  centros: 40,  regioes: 28 },
  recursoTA: { total: 222, centros: 205, regioes: 17 },
  openDay:   { total: 46,  centros: 35,  regioes: 11 },
};

function getTipoBreakdown() {
  return CERTA_TIPO_BREAKDOWN;
}

// As funções abaixo ficam para compatibilidade com o "padrão" do painel,
// mas o painel da apresentação usa apenas o breakdown acima.
function cloneData(data) {
  return data.map((item) => ({ ...item }));
}

function normalizeEntry(item) {
  return {
    municipio: String(item.municipio || '').trim(),
    regiao: String(item.regiao || '').trim(),
    instituicao: String(item.instituicao || '').trim(),
    servicos: Number(item.servicos) || 0,
    recursoTA: Number(item.recursoTA) || 0,
    openDay: Number(item.openDay) || 0,
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw).map(normalizeEntry);
  } catch (err) {
    console.warn('Não foi possível carregar dados salvos, usando padrão.', err);
  }
  return cloneData(CERTA_DEFAULT_DATA).map(normalizeEntry);
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Não foi possível salvar os dados.', err);
  }
}

function resetData() {
  const normalized = cloneData(CERTA_DEFAULT_DATA).map(normalizeEntry);
  saveData(normalized);
  return normalized;
}

window.certaData = {
  loadData,
  saveData,
  resetData,
  getTipoBreakdown,
};
