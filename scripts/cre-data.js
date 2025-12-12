// Default dataset for CREs and metrics tailored to SAEEX/NAEE
const CRE_NAMES = [
  'Florianópolis',
  'São José',
  'Joinville',
  'Blumenau',
  'Itajaí',
  'Jaraguá do Sul',
  'Rio do Sul',
  'Brusque',
  'Itapema',
  'Criciúma',
  'Araranguá',
  'Tubarão',
  'Laguna',
  'São Joaquim',
  'Lages',
  'Campos Novos',
  'Videira',
  'Caçador',
  'Curitibanos',
  'Joaçaba',
  'Concórdia',
  'Seara',
  'Xanxerê',
  'Chapecó',
  'São Lourenço do Oeste',
  'Maravilha',
  'Palmitos',
  'São Miguel do Oeste',
  'Itapiranga',
  'Mafra',
  'Canoinhas',
  'São Bento do Sul',
  'Taió',
  'Ibirama',
  'Timbó',
  'Balneário Camboriú',
  'Biguaçu'
];

function generateDefaultCreData() {
  return CRE_NAMES.map((name, index) => {
    const publicoEE = 400 + index * 15;
    const escolas = 45 + (index % 6) * 3;
    const escolasAEE = Math.max(10, escolas - 8 - (index % 4));
    const estudantesAEE = Math.round(publicoEE * 0.58) + (index % 10) * 6;
    const participantes = 120 + (index * 7) % 90;
    const presencial = 20 + (index % 5) * 5;
    const online = 15 + (index % 7) * 4;
    return {
      code: `CRE${String(index + 1).padStart(2, '0')}`,
      name: `CRE ${String(index + 1).padStart(2, '0')} - ${name}`,
      colorIndex: index,
      publicoEE,
      escolas,
      escolasAEE,
      estudantesAEE,
      participantes,
      presencial,
      online,
      hasAssessoria: index % 9 !== 0 // some CREs start without assessorias
    };
  });
}

const DEFAULT_CRE_DATA = generateDefaultCreData();
