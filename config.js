// ===================== CONFIGURAÇÕES CLÍNICAS =====================
// Ajuste livremente os textos abaixo — é aqui que ficam seus templates.

const CONTEXTOS = {
  enfermaria: { label: 'Enfermaria', cor: 'enfermaria' },
  emergencia: { label: 'Emergência', cor: 'emergencia' },
  clinica:    { label: 'Clínica da Família', cor: 'clinica' },
};

// ---- Exame físico: sistemas e texto padrão (normal) ----
const SISTEMAS = [
  { key: 'geral',   label: 'Estado geral',      abrev: '' },
  { key: 'neuro',   label: 'Neurológico',       abrev: 'NEURO' },
  { key: 'acv',     label: 'Cardiovascular',    abrev: 'ACV' },
  { key: 'ar',      label: 'Respiratório',      abrev: 'AR' },
  { key: 'abdome',  label: 'Abdome',            abrev: 'ABDOME' },
  { key: 'mmii',    label: 'Membros inferiores',abrev: 'MMII' },
];

const EXAME_NORMAL_F = {
  geral:  'PACIENTE LÚCIDA E ORIENTADA, COOPERATIVA E INTERATIVA COM EXAMINADOR, EM BOM ESTADO GERAL, NORMOCORADA, HIDRATADA, ACIANÓTICA, ANICTÉRICA, EUPNEICA EM AA',
  neuro:  'NEURO: GLASGOW 15. ALERTA, SEM ALTERAÇÕES DE FORÇA OU DE SENSIBILIDADE, FALA ORDENADA.',
  acv:    'ACV: RCR EM 2T COM BNF SINCRÔNICO COM PULSOS RADIAIS',
  ar:     'AR: MVUA SEM RA',
  abdome: 'ABDOME: ABDOME FLÁCIDO, PERISTÁLTICO, TIMPÂNICO E INDOLOR À PALPAÇÃO SUPERFICIAL E PROFUNDA',
  mmii:   'MMII: MEMBROS ÍNTEGROS, LIVRES DE EDEMAS, SEM SINAIS DE EMPASTAMENTO COM PULSOS PEDIOSOS PRESENTES E SIMÉTRICOS',
};

// conversão automática feminino -> masculino (troca apenas as terminações necessárias)
const FEM_PARA_MASC = {
  'NORMOCORADA':'NORMOCORADO','HIDRATADA':'HIDRATADO','ACIANÓTICA':'ACIANÓTICO','ANICTÉRICA':'ANICTÉRICO',
  'EUPNEICA':'EUPNEICO','LÚCIDA':'LÚCIDO','ORIENTADA':'ORIENTADO','COOPERATIVA':'COOPERATIVO',
  'INTERATIVA':'INTERATIVO','SONOLENTA':'SONOLENTO','TORPOROSA':'TORPOROSO','ATÍPICA':'ATÍPICO',
};
function textoExameNormal(sistemaKey, genero){
  let txt = EXAME_NORMAL_F[sistemaKey];
  if(genero === 'M'){
    for(const [f,m] of Object.entries(FEM_PARA_MASC)){
      txt = txt.split(f).join(m);
    }
  }
  return txt;
}

// ---- Queixas e sintomas comuns (checklist com detalhe condicional) ----
const QUEIXAS_COMUNS = [
  { key:'febre',      label:'Febre' },
  { key:'dor',         label:'Dor' },
  { key:'nauseas_vomitos', label:'Náuseas / Vômitos' },
  { key:'diurese',     label:'Alteração de diurese' },
  { key:'evacuacao',   label:'Alteração de evacuação' },
  { key:'sono',        label:'Alteração do sono' },
  { key:'apetite',     label:'Alteração de alimentação/apetite' },
  { key:'mobilidade',  label:'Alteração de mobilidade' },
  { key:'tosse',       label:'Tosse' },
  { key:'dispneia',    label:'Dispneia' },
];

// ---- Abreviações de laboratório (para o parser e para a evolução) ----
// "sempre" = sempre entram na linha principal (HB/HT/LEUCO/BAST/PLAQ)
// os demais entram na linha "outros exames" com abreviação e separados por /
const LAB_SEMPRE = [
  { key:'HB',   label:'Hemoglobina',    aliases:['hb','hemoglobina'] },
  { key:'HT',   label:'Hematócrito',    aliases:['ht','hematocrito','hematócrito'] },
  { key:'LEUCO',label:'Leucócitos',     aliases:['leuco','leucocitos','leucócitos','leuc'] },
  { key:'BAST', label:'Bastões',        aliases:['bast','bastoes','bastões','bastonetes'] },
  { key:'PLAQ', label:'Plaquetas',      aliases:['plaq','plaquetas','plt'] },
];

const LAB_OUTROS = [
  { key:'CR',  label:'Creatinina',      aliases:['cr','creatinina'] },
  { key:'UR',  label:'Ureia',           aliases:['ur','ureia'] },
  { key:'NA',  label:'Sódio',           aliases:['na','sodio','sódio'] },
  { key:'K',   label:'Potássio',        aliases:['k','potassio','potássio'] },
  { key:'PCR', label:'PCR',             aliases:['pcr','proteina c reativa','proteína c reativa'] },
  { key:'TGO', label:'TGO/AST',         aliases:['tgo','ast'] },
  { key:'TGP', label:'TGP/ALT',         aliases:['tgp','alt'] },
  { key:'BT',  label:'Bilirrubina total', aliases:['bt','bilirrubina total'] },
  { key:'BD',  label:'Bilirrubina direta', aliases:['bd','bilirrubina direta'] },
  { key:'FA',  label:'Fosfatase alcalina', aliases:['fa','fosfatase alcalina'] },
  { key:'GGT', label:'GamaGT',          aliases:['ggt','gama gt','gamagt'] },
  { key:'ALB', label:'Albumina',        aliases:['alb','albumina'] },
  { key:'INR', label:'INR',             aliases:['inr'] },
  { key:'TP',  label:'TP',              aliases:['tp'] },
  { key:'CA',  label:'Cálcio',          aliases:['ca','calcio','cálcio'] },
  { key:'MG',  label:'Magnésio',        aliases:['mg','magnesio','magnésio'] },
  { key:'LAC', label:'Lactato',         aliases:['lac','lactato'] },
  { key:'GLIC',label:'Glicose',         aliases:['glic','glicose','hgt'] },
];

const LAB_TODOS = [...LAB_SEMPRE, ...LAB_OUTROS];
