const CRE_STORAGE_KEY = 'naee-cre-metrics-v1';

function normalizeCreRecords(list) {
  return list.map((cre, index) => {
    const regionName = cre.regionName || (cre.name || '').replace(/^CRE\s*\d+\s*-\s*/i, '').replace(/^CRE\s*/i, '').trim();
    const name = `CRE ${regionName}`.trim();
    const code = cre.code || `CRE${String(index + 1).padStart(2, '0')}`;
    return {
      ...cre,
      code,
      name,
      regionName,
    };
  });
}

function loadCreData() {
  const stored = localStorage.getItem(CRE_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length === DEFAULT_CRE_DATA.length) {
        const normalized = normalizeCreRecords(parsed);
        localStorage.setItem(CRE_STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
    } catch (err) {
      console.warn('Falha ao ler armazenamento local, usando padrão', err);
    }
  }
  const normalizedDefault = normalizeCreRecords(DEFAULT_CRE_DATA);
  localStorage.setItem(CRE_STORAGE_KEY, JSON.stringify(normalizedDefault));
  return [...normalizedDefault];
}

function saveCreData(data) {
  localStorage.setItem(CRE_STORAGE_KEY, JSON.stringify(data));
}

function computeAggregates(creList) {
  return creList.reduce(
    (acc, cre) => {
      acc.publicoEE += cre.publicoEE;
      acc.escolas += cre.escolas;
      acc.escolasAEE += cre.escolasAEE;
      acc.estudantesAEE += cre.estudantesAEE;
      acc.participantes += cre.participantes;
      acc.presencial += cre.presencial;
      acc.online += cre.online;
      return acc;
    },
    {
      publicoEE: 0,
      escolas: 0,
      escolasAEE: 0,
      estudantesAEE: 0,
      participantes: 0,
      presencial: 0,
      online: 0,
    }
  );
}

function calculateCoverage(cre) {
  const faltantesAEE = Math.max(cre.publicoEE - cre.estudantesAEE, 0);
  const percForaAEE = cre.publicoEE === 0 ? 0 : (faltantesAEE / cre.publicoEE) * 100;
  const escolasSemAEE = Math.max(cre.escolas - cre.escolasAEE, 0);
  const percEscolasSemAEE = cre.escolas === 0 ? 0 : (escolasSemAEE / cre.escolas) * 100;
  return {
    faltantesAEE,
    percForaAEE,
    escolasSemAEE,
    percEscolasSemAEE,
  };
}
