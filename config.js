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

// Mesmo texto em caixa normal (usado na Clínica da Família) — preserva siglas médicas em maiúsculo
// (ACV, AR, MMII, RCR, BNF, AA etc.) em vez de baixar tudo indiscriminadamente.
const EXAME_NORMAL_F_LEGIVEL = {
  geral:  'Paciente lúcida e orientada, cooperativa e interativa com examinador, em bom estado geral, normocorada, hidratada, acianótica, anictérica, eupneica em AA',
  neuro:  'Neuro: Glasgow 15. Alerta, sem alterações de força ou de sensibilidade, fala ordenada.',
  acv:    'ACV: RCR em 2T com BNF sincrônico com pulsos radiais',
  ar:     'AR: MVUA sem RA',
  abdome: 'Abdome: flácido, peristáltico, timpânico e indolor à palpação superficial e profunda',
  mmii:   'MMII: membros íntegros, livres de edemas, sem sinais de empastamento, com pulsos pediosos presentes e simétricos',
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

// Versão em caixa normal (Clínica da Família) — mesma lógica de masculinização, mas
// preservando a capitalização natural do texto (não força maiúscula/minúscula em bloco).
function textoExameNormalLegivel(sistemaKey, genero){
  let txt = EXAME_NORMAL_F_LEGIVEL[sistemaKey];
  if(genero === 'M'){
    for(const [f,m] of Object.entries(FEM_PARA_MASC)){
      const re = new RegExp(f, 'gi');
      txt = txt.replace(re, (match)=>{
        const alvo = m.toLowerCase();
        const eraCapitalizado = match.charAt(0) === match.charAt(0).toUpperCase() && /[a-zà-ú]/i.test(match.charAt(0));
        return eraCapitalizado ? alvo.charAt(0).toUpperCase() + alvo.slice(1) : alvo;
      });
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
  has: {
    label: 'Hipertensão (HAS)',
    fonte: 'Base: SMS-RJ/SUBPAV — Guia de Referência Rápida: Hipertensão, 1ª ed. 2016. Metas de PA atualizadas conforme a Diretriz Brasileira de Hipertensão Arterial 2020.',
    alerta: 'O texto-base do SUBPAV é de 2016 e usa uma classificação de estágios mais antiga. A Diretriz Brasileira de Hipertensão Arterial 2020 reclassificou os níveis (a antiga "PA normal" virou "PA ótima"; pré-hipertensão hoje = PAS 130–139 e/ou PAD 85–89 mmHg) e atualizou as metas de tratamento: <140/90 mmHg para risco baixo/moderado; <130/80 mmHg para doença arterial coronariana, insuficiência cardíaca, AVC prévio, doença renal crônica ou diabetes. Confirme se há uma edição SUBPAV mais recente antes de usar em decisão clínica.',
    sugestaoAvaliacao: 'Ex: HAS estágio 1, controlada',
    sugestaoEncaminhamentos: 'Ex: cardiologia, oftalmologia',
    planoDefault: { retornoValor: '6', retornoUnidade: 'meses' },
    riscos: [
      'PA ≥ 180/110 mmHg (possível crise hipertensiva)',
      'Sinais/sintomas de lesão aguda de órgão-alvo (dor torácica, déficit neurológico focal, dispneia súbita)',
      'Gestante com PA elevada (risco de pré-eclâmpsia)',
    ],
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
  dm: {
    label: 'Diabetes (DM)',
    fonte: 'SMS-RJ/SUBPAV — Guia Rápido: Diabetes Mellitus, ed. 2023.',
    sugestaoAvaliacao: 'Ex: DM tipo 2 em bom controle glicêmico, HbA1c no alvo',
    sugestaoEncaminhamentos: 'Ex: oftalmologia, nutrição, saúde bucal; cirurgia vascular se úlcera/infecção no pé',
    planoDefault: { retornoValor: '3', retornoUnidade: 'meses' },
    obrigatorios: [
      'Peso, altura, IMC e circunferência da cintura',
      'Sinais de resistência à insulina (acantose nigricans)',
      'Exame dos pés: pulsos arteriais e sensibilidade com monofilamento (pé diabético)',
      'HbA1c — não repetir com intervalo menor que 8 semanas',
      'Perfil lipídico: colesterol total, HDL, triglicerídeos, LDL calculado',
      'Creatinina, TFG e albuminúria/relação albumina-creatinina',
      'EAS',
      'Fundoscopia ou retinografia',
      'ECG (no diagnóstico e a critério clínico)',
      'Vitamina B12 (anual, após 5 anos de uso de metformina)',
    ],
    riscos: [
      'HbA1c > 10% ou descompensação sintomática (poliúria, polidipsia, perda de peso)',
      'Úlcera ativa no pé ou sinais de infecção (exsudato purulento, rubor, calor, edema)',
      'História de úlcera prévia ou amputação de membro inferior',
      'Hipoglicemia grave ou frequente',
      'Suspeita de cetoacidose (náuseas, vômitos, dor abdominal, hálito cetônico, taquipneia)',
    ],
  },
  gestante_1tri: {
    label: 'Gestante — 1º trimestre',
    fonte: 'SMS-RJ/SUBPAV — Guia Rápido: Pré-Natal, ed. 2025 (Quadro 18 — exames de rotina).',
    sugestaoAvaliacao: 'Ex: gestação de X semanas, primeira consulta de pré-natal, sem intercorrências',
    sugestaoEncaminhamentos: 'Ex: pré-natal de alto risco (se indicado); odontologia; nutrição',
    planoDefault: { retornoValor: '4', retornoUnidade: 'semanas' },
    obrigatorios: [
      'Hemograma, tipagem sanguínea e fator Rh, eletroforese de hemoglobina',
      'Glicemia de jejum',
      'Sorologia para toxoplasmose (IgM e IgG)',
      'Teste rápido para HIV, sífilis (ou VDRL), hepatite B e hepatite C — idealmente até 12 semanas',
      'Sorologia para HTLV 1/2',
      'Urocultura e urina tipo 1',
      'Preventivo do colo do útero, se indicado pela idade/periodicidade',
      'Pesquisa de clamídia e gonococo, se ≤ 30 anos assintomática (ou sintomas de cervicite)',
      'Estratificar risco gestacional (atenção especial a pré-eclâmpsia/eclâmpsia)',
      'Solicitar USG obstétrico do primeiro trimestre',
    ],
    riscos: [
      'Fortes dores de cabeça, visão turva/embaralhada ou pontos pretos',
      'Dor ou ardor ao urinar',
      'Sangramento ou perda de líquido pela vagina, mesmo sem dor',
      'Corrimento vaginal escuro',
      'Contrações fortes, dolorosas e frequentes',
      'Febre de origem não conhecida',
    ],
  },
  gestante_2tri: {
    label: 'Gestante — 2º trimestre',
    fonte: 'SMS-RJ/SUBPAV — Guia Rápido: Pré-Natal, ed. 2025 (Quadro 18 — exames de rotina).',
    sugestaoAvaliacao: 'Ex: gestação de X semanas, evolução adequada, sem intercorrências',
    sugestaoEncaminhamentos: 'Ex: pré-natal de alto risco (se indicado); odontologia; nutrição',
    planoDefault: { retornoValor: '4', retornoUnidade: 'semanas' },
    obrigatorios: [
      'Hemograma',
      'Repetir sorologia para toxoplasmose, se soronegativa na 1ª consulta',
      'Teste rápido para HIV, sífilis, hepatite B e hepatite C — entre 24 e 28 semanas',
      'TOTG 75g com 24 semanas (até a 28ª), se glicemia de jejum < 92mg/dl',
      'Coombs indireto a cada 4 semanas a partir de 24 semanas, se Rh negativo',
      'Vacina DTPa a partir de 20 semanas',
      'Considerar AAS 100mg/dia a partir da 12ª semana até a 36ª, se alto risco para pré-eclâmpsia',
      'Reavaliar risco gestacional a cada consulta',
      'Vigilância de sofrimento psíquico e de situações de violência doméstica',
    ],
    riscos: [
      'Fortes dores de cabeça, visão turva/embaralhada ou pontos pretos',
      'Dor ou ardor ao urinar',
      'Sangramento ou perda de líquido pela vagina, mesmo sem dor',
      'Corrimento vaginal escuro',
      'Contrações fortes, dolorosas e frequentes',
      'Febre de origem não conhecida',
    ],
  },
  gestante_3tri: {
    label: 'Gestante — 3º trimestre',
    fonte: 'SMS-RJ/SUBPAV — Guia Rápido: Pré-Natal, ed. 2025 (Quadro 18 — exames de rotina). Vacina VSR: PNI/Ministério da Saúde, estratégia nacional iniciada em dez/2025.',
    alerta: 'A vacina VSR (Abrysvo) entrou no calendário nacional da gestante recentemente (distribuição iniciada em 02/12/2025): dose única, a partir da 28ª semana, sem limite superior de idade gestacional, aplicada a qualquer época do ano. Como é um programa novo, confirme se já está disponível na sua unidade antes de orientar a gestante.',
    sugestaoAvaliacao: 'Ex: gestação de X semanas, evolução adequada, em preparo para o parto',
    sugestaoEncaminhamentos: 'Ex: maternidade de referência; pré-natal de alto risco (se indicado)',
    planoDefault: { retornoValor: '2', retornoUnidade: 'semanas' },
    obrigatorios: [
      'Hemograma',
      'Glicemia de jejum',
      'Teste rápido para HIV, sífilis, hepatite B e hepatite C — entre 32 e 34 semanas',
      'Urocultura e urina tipo 1',
      'Coombs indireto a cada 4 semanas, se Rh negativo',
      'Vacina dTpa em dia',
      'Vacina VSR (dose única, a partir de 28 semanas, sem limite superior — se disponível na unidade)',
      'Vacina pneumocócica 23, se indicada',
      'Reavaliar risco gestacional e definir maternidade de referência',
      'Orientações sobre sinais de trabalho de parto e preparo para o parto',
    ],
    riscos: [
      'Fortes dores de cabeça, visão turva/embaralhada ou pontos pretos',
      'Dor ou ardor ao urinar',
      'Sangramento ou perda de líquido pela vagina, mesmo sem dor',
      'Corrimento vaginal escuro',
      'Contrações fortes, dolorosas e frequentes',
      'Febre de origem não conhecida',
      'Diminuição da movimentação fetal',
    ],
  },
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
  planejamento_sexual: {
    label: 'Planejamento Sexual',
    fonte: 'SMS-RJ/SUBPAV — Guia Rápido: Planejamento Sexual e Reprodutivo, ed. 2024 (critérios de elegibilidade adaptados da OMS).',
    sugestaoAvaliacao: 'Ex: em uso de método X, sem intercorrências, ou em processo de escolha de método',
    sugestaoEncaminhamentos: 'Ex: ginecologia (se contraindicação a hormonais); planejamento cirúrgico (laqueadura/vasectomia)',
    planoDefault: { retornoValor: '3', retornoUnidade: 'meses' },
    obrigatorios: [
      'Abordar necessidade/desejo de método contraceptivo (pessoa em idade fértil, sexualmente ativa)',
      'Oferecer opções de métodos: vantagens, desvantagens, efeitos colaterais e taxa de falha',
      'Avaliar critérios de elegibilidade e contraindicações ao método escolhido',
      'Investigar tabagismo, enxaqueca (com/sem aura), HAS e história de tromboembolismo antes de método combinado',
      'Orientar sobre contracepção de emergência',
      'Orientar uso de preservativo para prevenção de IST, e sobre PrEP/PEP/testagem se indicado',
      'Avaliar adesão, efeitos adversos e desejo de troca de método (retornos)',
      'Incluir parceria no planejamento reprodutivo (preservativo, vasectomia)',
    ],
    riscos: [
      'Enxaqueca com aura (contraindica método hormonal combinado)',
      'Evento tromboembólico atual ou prévio (TVP/TEP)',
      'Tabagismo em pessoa ≥ 35 anos, se método combinado',
      'HAS não controlada',
      'Sangramento vaginal não investigado',
    ],
  },
  prep: {
    label: 'PrEP',
    fonte: 'Ministério da Saúde/DATHI-SVSA — Guia PrEP na Atenção Primária à Saúde.',
    sugestaoAvaliacao: 'Ex: em uso de PrEP (diária/sob demanda) há X meses, boa adesão, sem eventos adversos',
    sugestaoEncaminhamentos: 'Deixe em branco se não houver',
    planoDefault: { retornoValor: '120', retornoUnidade: 'dias' },
    obrigatorios: [
      'Avaliar adesão à PrEP (diária ou sob demanda)',
      'Investigar sinais e sintomas de infecção aguda pelo HIV',
      'Investigar sinais e sintomas de outras ISTs',
      'Teste rápido para HIV',
      'Teste para sífilis (treponêmico se sem histórico prévio; não treponêmico se histórico de sífilis)',
      'Detecção de clamídia e gonococo por biologia molecular',
      'HBsAg / anti-HBs / anti-HBc, se não realizado na primeira consulta',
      'Anti-HCV',
      'Creatinina — anual se baixo risco; a cada 6 meses se ≥ 50 anos, comorbidades ou ClCr inicial < 90mL/min',
    ],
    riscos: [
      'Sinais/sintomas de infecção aguda pelo HIV (síndrome retroviral aguda)',
      'ClCr estimado < 60 mL/min',
      'Sinais/sintomas de IST não tratada',
    ],
  },
  hiv: {
    label: 'HIV',
    fonte: 'SMS-RJ — Guia Rápido: Infecção pelo HIV e Aids (monitoramento de PVHA com carga viral indetectável e boa tolerância à TARV).',
    sugestaoAvaliacao: 'Ex: PVHA em TARV (TDF/3TC + DTG), carga viral indetectável, boa adesão',
    sugestaoEncaminhamentos: 'Ex: infectologia (se falha virológica); nutrição; saúde bucal',
    planoDefault: { retornoValor: '6', retornoUnidade: 'meses' },
    obrigatorios: [
      'Adesão à TARV e efeitos adversos investigados',
      'Interações medicamentosas com novos medicamentos revisadas',
      'Esquema vacinal revisado',
      'Carga viral (a cada 6 meses)',
      'Avaliação hepática e renal: TGO, TGP, creatinina, EAS (a cada 3-6 meses)',
      'Teste rápido para sífilis e hepatite C (a cada 6 meses)',
      'Glicemia de jejum, lipidograma e escore de risco cardiovascular (anual)',
      'PPD/IGRA anual, se PPD inicial < 5mm',
      'Revisar contracepção, se pessoa com possibilidade de gestar',
      'Colpocitológico anual, se pessoa com colo uterino',
    ],
    riscos: [
      'Carga viral detectável / suspeita de falha virológica',
      'Sinais/sintomas sugestivos de infecção oportunista',
      'Má adesão à TARV',
      'Sem registro de CD4/carga viral nos últimos 6 meses',
    ],
    // Texto de referência exibido ao tocar no ℹ de um item do checklist (chave = índice em obrigatorios).
    obrigatoriosInfo: {
      2: `VACINAS INDICADAS PARA PVHA
(Quadro 23 — Guia Rápido HIV, SMS-RJ, adaptado de BRASIL 2018)

Tríplice viral — 1 a 2 doses, se LT-CD4+ > 200 células/mm³ (Unidade de saúde)
Varicela — 2 doses, intervalo de 3 meses, se LT-CD4+ > 200 células/mm³ (CRIE)
Febre amarela — individualizar risco/benefício; se exposição, vacinar com LT-CD4+ > 200 células/mm³ (Unidade de saúde)
Hepatite A — 2 doses (0 e 6 meses), se suscetível ou hepatopatia crônica (CRIE)
Hepatite B — dose dobrada, 4 doses (0, 1, 2 e 6-12 meses), se suscetível (Unidade de saúde)
Influenza — 1 dose anual (Unidade de saúde)
Dupla adulto (dT) — 3 doses (0, 2, 4 meses) + reforço a cada 10 anos (Unidade de saúde)
Hib — 2 doses, intervalo de 2 meses, se < 19 anos não vacinado (CRIE)
Pneumo 13 (conjugada) — dose única, idealmente antes da Pneumo 23 (CRIE)
Pneumo 23 (polissacarídica) — 1 dose se LT-CD4+ > 200 células/mm³, reforço único após 5 anos (CRIE)
HPV — 3 doses (0, 2, 6 meses), de 9 a 45 anos (Unidade de saúde)
Covid-19 — conforme fabricante (Unidade de saúde)

Atenção: vacinas de vírus vivo (tríplice viral, varicela, febre amarela) exigem LT-CD4+ > 200 células/mm³.
CRIE = Centro de Referência de Imunobiológicos Especiais.`,
    },
  },
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
  obesidade: {
    label: 'Obesidade',
    fonte: 'SMS-RJ — Programa de Controle da Obesidade, v3, jul/2024.',
    sugestaoAvaliacao: 'Ex: obesidade grau X, com/sem comorbidades associadas',
    sugestaoEncaminhamentos: 'Ex: nutrição; endocrinologia; educação física; cirurgia bariátrica (se critérios)',
    planoDefault: { retornoValor: '3', retornoUnidade: 'meses' },
    obrigatorios: [
      'Peso, altura, IMC e circunferência abdominal',
      'Investigar comorbidades associadas: DM2, HAS, doenças osteoarticulares, apneia do sono, DRC, esteato-hepatite (MASH)',
      'Investigar hábitos alimentares e nível de atividade física',
      'Avaliar tabagismo',
      'Discutir manejo: dieta, atividade física e suporte comportamental',
      'Considerar necessidade de HbA1c e demais exames metabólicos',
    ],
    riscos: [
      'IMC ≥ 40 kg/m² com comorbidade que ameaça a vida',
      'Apneia obstrutiva do sono grave não tratada',
      'Sinais de descompensação de comorbidade associada (ex: DM, HAS)',
    ],
  },
  tb: {
    label: 'Tuberculose (TB)',
    fonte: 'SMS-RJ — Guia Rápido: Tuberculose (consultas de seguimento mensal do tratamento).',
    sugestaoAvaliacao: 'Ex: TB pulmonar, X mês de tratamento com esquema básico, evolução favorável',
    sugestaoEncaminhamentos: 'Deixe em branco se não houver',
    planoDefault: { retornoValor: '1', retornoUnidade: 'meses' },
    obrigatorios: [
      'Atualização dos sintomas e das dificuldades de adesão ao tratamento',
      'Peso, FC, FR, ausculta pulmonar e saturação de O2',
      'Baciloscopia de controle, se houver expectoração',
      'Avaliar reações adversas aos medicamentos do esquema básico',
      'Ajuste de dose conforme peso, se necessário',
      'Verificar fase do tratamento (troca para fase de manutenção no 2º mês)',
      'Atualização do SINAN',
      'Avaliar necessidade de suporte de saúde mental ou serviço social',
    ],
    riscos: [
      'Reação adversa maior aos medicamentos (ex: hepatotoxicidade, hipersensibilidade grave)',
      'Interrupção ou abandono do tratamento',
      'Baciloscopia de controle positiva no 2º ou 4º mês (considerar TRM-TB)',
      'Sinais de piora clínica ou insuficiência respiratória',
    ],
  },
  crianca_rn: {
    label: 'Criança — Recém-nascido (1ª semana a 1 mês)',
    fonte: 'SMS-RJ/SUBPAV — Guia Rápido: Acompanhamento da Criança na APS, ed. 2026 (as 7 dimensões da puericultura + 1ª consulta do RN).',
    alerta: 'O calendário original do SUBPAV é mês a mês no primeiro ano, estratificado por risco (habitual/intermediário/alto/muito alto). Este checklist resume a 1ª semana/1º mês de forma genérica — para estratificação de risco individual, consulte o Quadro 12 do guia.',
    sugestaoAvaliacao: 'Ex: RN a termo, adequado para idade gestacional, em aleitamento materno exclusivo',
    sugestaoEncaminhamentos: 'Ex: triagem neonatal (se pendente); banco de leite; saúde bucal',
    planoDefault: { retornoValor: '15', retornoUnidade: 'dias' },
    obrigatorios: [
      'Peso, comprimento, perímetro cefálico e curvas de crescimento',
      'Avaliar icterícia (zona de Kramer) e coloração da pele',
      'Avaliar amamentação/aleitamento materno e técnica de pega',
      'Revisar triagens neonatais: teste do pezinho, orelhinha, olhinho, coraçãozinho, linguinha',
      'Situação vacinal (BCG e hepatite B ao nascer)',
      'Avaliar coto umbilical',
      'Vínculo familiar, rede de apoio e saúde mental materna (rastreio de depressão pós-parto)',
      'Orientar sinais de alerta e retorno',
    ],
    riscos: [
      'Icterícia intensa ou de início precoce (< 24h de vida)',
      'Recusa alimentar ou dificuldade importante para mamar',
      'Febre',
      'Choro persistente/inconsolável ou letargia',
      'Dificuldade respiratória',
    ],
  },
  crianca_lactente: {
    label: 'Criança — Lactente (2 meses a 2 anos)',
    fonte: 'SMS-RJ/SUBPAV — Guia Rápido: Acompanhamento da Criança na APS, ed. 2026.',
    sugestaoAvaliacao: 'Ex: lactente eutrófico, desenvolvimento adequado para a idade',
    sugestaoEncaminhamentos: 'Ex: estimulação precoce; saúde bucal; nutrição',
    planoDefault: { retornoValor: '2', retornoUnidade: 'meses' },
    obrigatorios: [
      'Peso, comprimento/altura, perímetro cefálico e curvas de crescimento',
      'Marcos do desenvolvimento neuropsicomotor para a idade',
      'Aleitamento materno e introdução alimentar adequada',
      'Situação vacinal conforme calendário',
      'Vínculo familiar e social',
      'Prevenção de acidentes (orientações de segurança)',
      'Triagem de problemas prevalentes na infância',
    ],
    riscos: [
      'Estagnação ou perda de peso (curva de crescimento)',
      'Ausência de marcos do desenvolvimento esperados para a idade',
      'Febre em menor de 3 meses',
      'Sinais de desidratação ou dificuldade respiratória',
    ],
  },
  crianca_pre_escolar: {
    label: 'Criança — Pré-escolar/Escolar (2 a 10 anos)',
    fonte: 'SMS-RJ/SUBPAV — Guia Rápido: Acompanhamento da Criança na APS, ed. 2026.',
    sugestaoAvaliacao: 'Ex: criança eutrófica, desenvolvimento e escolarização adequados para a idade',
    sugestaoEncaminhamentos: 'Ex: saúde bucal; oftalmologia (triagem visual); fonoaudiologia',
    planoDefault: { retornoValor: '6', retornoUnidade: 'meses' },
    obrigatorios: [
      'Peso, altura e IMC (curvas de crescimento)',
      'Desenvolvimento neuropsicomotor e linguagem',
      'Alimentação saudável e nível de atividade física',
      'Situação vacinal conforme calendário',
      'Inserção e desempenho no ambiente escolar',
      'Saúde bucal',
      'Vínculo familiar e social; rastreio de situações de violência',
    ],
    riscos: [
      'Sinais de violência física, sexual ou negligência',
      'Sinais de sofrimento psíquico importante',
      'Déficit de crescimento ou de desenvolvimento identificado',
    ],
  },
  crianca_adolescente: {
    label: 'Criança/Adolescente (10 a 19 anos)',
    fonte: 'SMS-RJ/SUBPAV — Guia Rápido: Acompanhamento da Criança na APS, ed. 2026.',
    sugestaoAvaliacao: 'Ex: adolescente hígido, desenvolvimento puberal adequado para a idade (Tanner)',
    sugestaoEncaminhamentos: 'Ex: saúde mental; planejamento sexual e reprodutivo; saúde bucal',
    planoDefault: { retornoValor: '6', retornoUnidade: 'meses' },
    obrigatorios: [
      'Peso, altura e IMC (curvas de crescimento)',
      'Estadiamento puberal (Tanner)',
      'Situação vacinal conforme calendário',
      'Saúde sexual e reprodutiva (uso de preservativo, contracepção, se indicado)',
      'Rastreio de uso de álcool e outras substâncias',
      'Rastreio de sofrimento psíquico, ideação suicida e situações de violência',
      'Vínculo familiar, escolar e social',
    ],
    riscos: [
      'Ideação ou plano suicida',
      'Sinais de violência física, sexual, psicológica ou negligência',
      'Uso de risco de álcool/outras substâncias',
      'Sinais de transtorno alimentar',
    ],
  },
};
