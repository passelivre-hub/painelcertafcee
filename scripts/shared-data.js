const STORAGE_KEY = 'certa-data';

function cloneData(data) {
  return data.map((item) => ({ ...item }));
}

function normalizeEntry(item) {
  const servicos =
    item.servicos !== undefined
      ? Number(item.servicos) || 0
      : Number(item.oficinas) || 0;
  return {
    ...item,
    servicos,
    recursoTA: Number(item.recursoTA) || 0,
    openDay: Number(item.openDay) || 0,
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw).map(normalizeEntry);
    }
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

function aggregateByTipo(data) {
  return data.reduce(
    (acc, item) => {
      acc.servicos += Number(item.servicos) || 0;
      acc.recursoTA += Number(item.recursoTA) || 0;
      acc.openDay += Number(item.openDay) || 0;
      return acc;
    },
    { servicos: 0, recursoTA: 0, openDay: 0 }
  );
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
    if (!acc[muni]) {
      acc[muni] = {
        municipio: muni,
        regiao: item.regiao,
        servicos: 0,
        recursoTA: 0,
        openDay: 0,
      };
    }
    acc[muni].servicos += Number(item.servicos) || 0;
    acc[muni].recursoTA += Number(item.recursoTA) || 0;
    acc[muni].openDay += Number(item.openDay) || 0;
    return acc;
  }, {});
}

function getInstituicoesPorMunicipio(municipio, data) {
  return data.filter((item) => item.municipio === municipio);
}

window.certaData = {
  loadData,
  saveData,
  resetData,
  aggregateByTipo,
  aggregateByRegiao,
  aggregateMunicipios,
  getInstituicoesPorMunicipio,
};
