const STORAGE_KEY = 'certa-data';

// Totais fixos para apresentação (ajuste aqui se precisar atualizar os números no GitHub Pages).
// Observação: "Serviços" foi mantido sem verde por solicitação (paleta GovSC sem verde).
const CERTA_TIPO_BREAKDOWN = {
  servicos: { total: 68, centros: 40, regioes: 28 },
  recursoTA: { total: 222, centros: 205, regioes: 17 },
  openDay: { total: 46, centros: 35, regioes: 11 },
};

function getTipoBreakdown() {
  return CERTA_TIPO_BREAKDOWN;
}

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

function aggregateByRegiao(data) {
  const base = Object.fromEntries(REGIOES.map((reg) => [reg, 0]));
  return data.reduce((acc, item) => {
    const total = (Number(item.servicos) || 0) + (Number(item.recursoTA) || 0) + (Number(item.openDay) || 0);
    acc[item.regiao] = (acc[item.regiao] || 0) + total;
    return acc;
  }, base);
}

function aggregateMunicipios(data) {
  return data.reduce((acc, item) => {
    const muni = item.municipio;
    if (!muni) return acc;
    if (!acc[muni]) {
      acc[muni] = { municipio: muni, regiao: item.regiao, servicos: 0, recursoTA: 0, openDay: 0, instituicoes: 0 };
    }
    acc[muni].servicos += Number(item.servicos) || 0;
    acc[muni].recursoTA += Number(item.recursoTA) || 0;
    acc[muni].openDay += Number(item.openDay) || 0;
    acc[muni].instituicoes += item.instituicao ? 1 : 0;
    return acc;
  }, {});
}

function getInstituicoesPorMunicipio(municipio, data) {
  return data.filter((item) => item.municipio === municipio && item.instituicao);
}

window.certaData = {
  loadData,
  saveData,
  resetData,
  aggregateByRegiao,
  aggregateMunicipios,
  getInstituicoesPorMunicipio,
  getTipoBreakdown,
};
