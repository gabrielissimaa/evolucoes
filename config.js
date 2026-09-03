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

// ---- Consultas padrão da Clínica da Família (protocolos SUBPAV) ----
// IMPORTANTE: só incluímos aqui o que já foi conferido linha a linha contra o material
// enviado + a diretriz/nota técnica vigente mais recente. Protocolos com obrigatorios:null
// ainda não foram revisados — evite usar como referência clínica até serem preenchidos.
const CONSULTAS_PADRAO = {
  geral:    { label: 'Consulta geral', obrigatorios: null },
  crianca:  { label: 'Criança', obrigatorios: null,
              fonte: 'Guia Rápido — Acompanhamento da Criança na APS (SUBPAV, ed. 2026) — ainda não revisado neste app (tem vários modelos por faixa etária, será dividido em sub-protocolos).' },
  idoso: {
    label: 'Idoso',
    fonte: 'SMS-RJ/SUBPAV — Instrumentos de Avaliação da Pessoa Idosa na APS, 2024. Instrumento de referência: IVCF-20 (Índice de Vulnerabilidade Clínico-Funcional-20).',
    alerta: 'Este checklist cobre as 8 dimensões do IVCF-20 em nível de domínio — para a pontuação de risco oficial (baixo/moderado/alto), aplique o instrumento completo (20 itens) no prontuário eletrônico. Baixo risco (0-6 pts): reavaliação anual. Moderado/alto risco (≥7 pts, "pré-frágil"/"frágil"): reavaliação semestral.',
    sugestaoAvaliacao: 'Ex: idoso robusto / pré-frágil / frágil, conforme IVCF-20',
    sugestaoEncaminhamentos: 'Ex: geriatria, fisioterapia, nutrição',
    obrigatorios: [
      'Idade e autopercepção da saúde',
      'AVD/AIVD: independência para atividades básicas e instrumentais',
      'Cognição: rastreio de queixa/alteração de memória',
      'Humor/comportamento: rastreio de sintomas depressivos',
      'Mobilidade: alcance, preensão/pinça, capacidade aeróbica/muscular, marcha',
      'Continência esfincteriana',
      'Comunicação: visão e audição',
      'Comorbidades múltiplas: polipatologia, polifarmácia, internação recente',
    ],
    riscos: [
      'Quedas recorrentes ou fratura recente',
      'Perda de peso não intencional',
      'Sinais de negligência, abuso ou violência',
      'Declínio funcional rápido (perdeu autonomia que tinha há pouco tempo)',
    ],
    planoDefault: { retornoValor: '12', retornoUnidade: 'meses' },
  },
  hiv:      { label: 'HIV', obrigatorios: null,
              fonte: 'Guia Rápido HIV (SMS-RJ) — ainda não revisado neste app.' },
  has: {
    label: 'Hipertensão (HAS)',
    fonte: 'Base: SMS-RJ/SUBPAV — Guia de Referência Rápida: Hipertensão, 1ª ed. 2016. Metas de PA atualizadas conforme a Diretriz Brasileira de Hipertensão Arterial 2020.',
    alerta: 'O texto-base do SUBPAV é de 2016 e usa uma classificação de estágios mais antiga. A Diretriz Brasileira de Hipertensão Arterial 2020 reclassificou os níveis (a antiga "PA normal" virou "PA ótima"; pré-hipertensão hoje = PAS 130–139 e/ou PAD 85–89 mmHg) e atualizou as metas de tratamento: <140/90 mmHg para risco baixo/moderado; <130/80 mmHg para doença arterial coronariana, insuficiência cardíaca, AVC prévio, doença renal crônica ou diabetes. Confirme se há uma edição SUBPAV mais recente antes de usar em decisão clínica.',
    sugestaoAvaliacao: 'Ex: HAS estágio 1, controlada',
    sugestaoEncaminhamentos: 'Ex: cardiologia, oftalmologia',
    planoDefault: { retornoValor: '6', retornoUnidade: 'meses' },
    obrigatorios: [
      'Aferição da PA (técnica correta, 2 medidas)',
      'Investigar lesão em órgão-alvo: EAS (proteinúria/hematúria)',
      'Glicemia de jejum, eletrólitos, creatinina, taxa de filtração glomerular',
      'Perfil lipídico: colesterol total, HDL, triglicerídeos (LDL calculado)',
      'Fundoscopia (fundo de olho) — se realizada',
      'ECG de repouso (no diagnóstico e a critério clínico)',
      'Orientação sobre estilo de vida (dieta, atividade física, álcool)',
    ],
  },
  dm:       { label: 'Diabetes (DM)', obrigatorios: null,
              fonte: 'Guia Rápido — Diabetes Mellitus (SUBPAV, 2023) — ainda não revisado neste app. Inclui avaliação de pé diabético quando pronto.' },
  tb:       { label: 'Tuberculose (TB)', obrigatorios: null,
              fonte: 'Guia Rápido — Tuberculose (SMS-RJ) — ainda não revisado neste app.' },
  gestante: { label: 'Gestante', obrigatorios: null,
              fonte: 'Guia Rápido — Pré-Natal (SUBPAV, 2025) — ainda não revisado neste app (tem modelos por trimestre, será dividido em sub-protocolos).' },
  saude_mental_ansiedade: {
    label: 'Saúde Mental — Ansiedade/Pânico',
    fonte: 'SMS-RJ/SUBPAV — Guia de Referência Rápida: Ansiedade Generalizada e Transtorno de Pânico em Adultos, 1ª ed. 2016.',
    alerta: 'O guia usa critérios do DSM-IV-TR (2016). O DSM-5/5-TR é o padrão atual; os critérios centrais de ansiedade generalizada mudaram pouco, mas confirme critérios exatos em fonte atualizada antes de fechar diagnóstico.',
    sugestaoAvaliacao: 'Ex: transtorno de ansiedade generalizada, sem comorbidades identificadas',
    sugestaoEncaminhamentos: 'Ex: psicoterapia (preferencialmente TCC); psiquiatria se resposta inadequada',
    obrigatorios: [
      'Preocupação/ansiedade excessiva na maioria dos dias, por ≥ 6 meses',
      'Dificuldade em controlar a preocupação',
      '≥ 3 sintomas: inquietação, fadiga, dificuldade de concentração, irritabilidade, tensão muscular, alteração do sono',
      'Se houver ataques de pânico: espontâneos, com preocupação persistente entre eles',
      'Rastreio de comorbidade: depressão, uso de álcool/substâncias',
      'Avaliação do grau de sofrimento e prejuízo funcional',
    ],
    riscos: [
      'Risco de suicídio ou automutilação',
      'Ansiedade severa com prejuízo funcional importante',
      'Autonegligência',
      'Comorbidade importante (abuso de substância, transtorno de personalidade, condição física complexa)',
    ],
    planoDefault: { retornoValor: '4', retornoUnidade: 'semanas' },
  },
  saude_mental_depressao: {
    label: 'Saúde Mental — Depressão',
    fonte: 'SMS-RJ/SUBPAV — Guia de Referência Rápida: Depressão, 1ª ed. 2016 (critérios DSM-IV-TR; o próprio guia nota que não houve alteração significativa no DSM-5).',
    sugestaoAvaliacao: 'Ex: episódio depressivo leve/moderado/grave, primeiro episódio ou recorrente',
    sugestaoEncaminhamentos: 'Ex: psicoterapia; psiquiatria; CAPS se risco de suicídio',
    obrigatorios: [
      'Teste das 2 perguntas: humor deprimido a maior parte do tempo? Perda de interesse/prazer?',
      'Humor deprimido a maior parte do dia, quase todos os dias',
      'Perda de interesse ou prazer em quase todas as atividades',
      'Alteração de sono, apetite/peso, energia, concentração ou psicomotricidade',
      'Sentimento de culpa ou inutilidade',
      'Sintomas presentes há ≥ 2 semanas',
      'Investigar fatores de risco: doença crônica, puerpério, estressor social, uso de álcool/drogas, idade avançada, história familiar/pessoal de depressão',
    ],
    riscos: [
      'Ideação ou plano suicida (perguntar diretamente)',
      'Risco imediato para si ou para outra pessoa — encaminhar com urgência (CAPS/emergência psiquiátrica)',
      'Ausência de apoio familiar/social adequado',
    ],
    planoDefault: { retornoValor: '4', retornoUnidade: 'semanas' },
  },
  planejamento_sexual: { label: 'Planejamento Sexual', obrigatorios: null,
              fonte: 'Guia Rápido — Planejamento Sexual e Reprodutivo (SUBPAV, 2024) — ainda não revisado neste app.' },
  prep:     { label: 'PrEP', obrigatorios: null,
              fonte: 'Guia PrEP APS — ainda não revisado neste app.' },
  hormonizacao: {
    label: 'Hormonização (pessoas trans, travestis, não binárias)',
    fonte: 'SMS-RJ/SUBPAV — Hormonização para Pessoas Trans, Travestis e Não Binárias na APS, 2024.',
    alerta: 'Monitorização laboratorial completa (feminilizante x masculinizante) tem tabelas específicas no guia original — confira o quadro de exames obrigatórios x consideráveis conforme o tipo de hormonização antes de fechar a solicitação.',
    sugestaoAvaliacao: 'Ex: em hormonização feminilizante/masculinizante há X meses, boa resposta, sem efeitos adversos relevantes',
    sugestaoEncaminhamentos: 'Ex: endocrinologia; cirurgia (se indicado e desejado)',
    obrigatorios: [
      'Rastrear contraindicações e possíveis interações medicamentosas',
      'Exame físico focal: peso, altura, e demais achados relevantes',
      'Avaliar e registrar transformações corporais alcançadas desde o início/última consulta',
      'Avaliar e abordar possíveis efeitos adversos da hormonização',
      'Exames laboratoriais de monitorização (antes do início, 3º/6º/12º mês, depois semestral/anual)',
      'Ofertar rastreios oncológicos recomendados conforme órgãos presentes (mama, colo, próstata — individualizado)',
    ],
    planoDefault: { retornoValor: '3', retornoUnidade: 'meses' },
  },
  obesidade: { label: 'Obesidade', obrigatorios: null,
              fonte: 'Programa de Controle da Obesidade (SMS-RJ, v3) — ainda não revisado neste app.' },
};
