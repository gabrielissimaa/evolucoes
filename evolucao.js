// ===================== GERAÇÃO DA EVOLUÇÃO =====================

function montarQueixasTexto(p){
  const linhas = [];
  for(const q of QUEIXAS_COMUNS){
    const st = p.queixas[q.key];
    if(st && st.on){
      linhas.push(st.detalhe ? `${q.label}: ${st.detalhe}` : q.label);
    }
  }
  let texto = linhas.length ? linhas.join('\n') : 'SEM QUEIXAS REFERIDAS';
  if(p.queixasLivre && p.queixasLivre.trim()){
    texto += (linhas.length ? '\n' : '') + p.queixasLivre.trim();
  }
  return texto;
}

function montarExameFisicoTexto(p){
  const linhas = [];
  for(const s of SISTEMAS){
    const alt = p.exameFisico.alterados[s.key];
    if(!p.exameFisico.normal && alt && alt.on && alt.texto && alt.texto.trim()){
      linhas.push(`${s.abrev ? s.abrev+': ' : ''}${alt.texto.trim()}`.trim());
    } else {
      linhas.push(textoExameNormal(s.key, p.exameFisico.genero || p.genero || 'F'));
    }
  }
  let texto = linhas.join('\n\n');
  if(p.exameFisico.observacoes && p.exameFisico.observacoes.trim()){
    texto += '\n\n' + p.exameFisico.observacoes.trim();
  }
  return texto;
}

// Monta o bloco de laboratório no formato que você já usa no seu prompt:
// uma linha por "bloco" (data/hora agrupados), separadas por uma linha horizontal.
function montarLabTexto(p){
  if(!p.labBlocos || p.labBlocos.length === 0) return '(sem exames colados nesta visita)';
  const grupos = agruparParaEvolucao(p.labBlocos);
  const linhas = grupos.map(g=>{
    const partes = [];
    for(const ex of LAB_TODOS){
      if(g.valores[ex.key] != null && g.valores[ex.key] !== ''){
        partes.push(`${ex.key}=${g.valores[ex.key]}`);
      }
    }
    const dataHora = g.hora ? `${g.data} ${g.hora}` : g.data;
    return `${dataHora}\n${partes.join(' | ')}`;
  });
  return linhas.join('\n' + '-'.repeat(28) + '\n');
}

function linhaOuTraco(v){ return (v && String(v).trim()) ? v : '-'; }

// ---------------- ENFERMARIA ----------------
function gerarEvolucaoEnfermaria(p){
  const f = p.infoFixa, u = p.ultimas24h, s = p.ssvv;
  return `# EVOLUÇÃO ENFERMARIA #

${p.nome.toUpperCase()} - LEITO ${p.leito}

#IH: ${linhaOuTraco(p.ih)}
#MIH: ${linhaOuTraco(p.mih)}

#ALERGIAS: ${f.alergias ? f.alergias.toUpperCase() : 'NEGA'}
#ATB: ${linhaOuTraco(f.atb)}
#INVASÕES: ${linhaOuTraco(f.invasoes)}
#INFUSÕES: ${linhaOuTraco(f.infusoes)}
#VENT: ${linhaOuTraco(f.vent) || 'AA'}
#DIURESE: ${linhaOuTraco(f.diurese)}

#HDA:
${montarQueixasTexto(p)}

#HPP: ${linhaOuTraco(f.hpp)}

#MUC: ${linhaOuTraco(f.muc)}

#HSOC:
${f.tabagismo ? 'TABAGISMO PRESENTE' : 'NEGA TABAGISMO'}
${f.etilismo ? 'ETILISMO PRESENTE' : 'NEGA ETILISMO'}
${f.hsocLivre ? f.hsocLivre : ''}

#EXAMES RELEVANTES:

    #IMAGEM
    ${linhaOuTraco(p.examesImagem)}

    #LABORATORIO
${montarLabTexto(p)}

#ÚLTIMAS 24H PELA ENFERMAGEM

PA ${linhaOuTraco(u.pa)} | FC ${linhaOuTraco(u.fc)} | FR ${linhaOuTraco(u.fr)} | TAX ${linhaOuTraco(u.tax)} | HGT ${linhaOuTraco(u.hgt)} | DIURESE: ${linhaOuTraco(u.diurese)} | FUNÇÃO INTESTINAL: ${linhaOuTraco(u.funcaoIntestinal)} | BALANÇO HÍDRICO: ${linhaOuTraco(u.balancoHidrico)}

#SSVV:

PA ${linhaOuTraco(s.pa)} | ${linhaOuTraco(s.bpm)} bpm | ${linhaOuTraco(s.irpm)} irpm | Sat O2 ${linhaOuTraco(s.sat)}

#EXAME FÍSICO:

${montarExameFisicoTexto(p)}

#IMPRESSÃO:
${linhaOuTraco(p.impressao)}

#CONDUTA:
${p.conduta && p.conduta.trim() ? p.conduta.trim() : 'VIGILÂNCIA CLÍNICA'}`;
}

// ---------------- EMERGÊNCIA (SPA) ----------------
function gerarEvolucaoEmergencia(p){
  const h = p.hdaDetalhada, pp = p.hppDetalhada;
  return `# SPA #

${p.nome.toUpperCase()}${p.leito ? ' - LEITO '+p.leito : ''}

#QP:
${linhaOuTraco(p.qp)}

#HDA:
${montarQueixasTexto(p)}

Início: ${linhaOuTraco(h.inicio)}
Evolução: ${linhaOuTraco(h.evolucao)}
Localização: ${linhaOuTraco(h.localizacao)}
Intensidade (0–10): ${linhaOuTraco(h.intensidade)}
Duração/frequência: ${linhaOuTraco(h.duracao)}
Sintomas associados: ${linhaOuTraco(h.sintomasAssociados)}
Fatores de melhora: ${linhaOuTraco(h.fatoresMelhora)}
Fatores de piora: ${linhaOuTraco(h.fatoresPiora)}
Tratamentos já realizados e resposta: ${linhaOuTraco(h.tratamentos)}
Impacto na rotina: ${linhaOuTraco(h.impacto)}

#HPP:
Doenças prévias: ${linhaOuTraco(pp.doencasPrevias)}
Cirurgias/internações: ${linhaOuTraco(pp.cirurgias)}
Alergias: ${linhaOuTraco(pp.alergias)}
Medicamentos em uso: ${linhaOuTraco(pp.medicamentos)}

#HSOC:
${p.infoFixa.tabagismo ? 'TABAGISMO PRESENTE' : 'NEGA TABAGISMO'}
${p.infoFixa.etilismo ? 'ETILISMO PRESENTE' : 'NEGA ETILISMO'}

${p.labBlocos && p.labBlocos.length ? '#EXAMES:\n' + montarLabTexto(p) + '\n' : ''}
#EXAME FÍSICO:

${montarExameFisicoTexto(p)}

#CONDUTA:
${linhaOuTraco(p.conduta)}`;
}

// ---------------- CLÍNICA DA FAMÍLIA (SOAP) ----------------
function gerarEvolucaoClinica(p){
  return `${p.nome.toUpperCase()}

S — SUBJETIVO
${linhaOuTraco(p.qp)}

${montarQueixasTexto(p)}

${p.subjetivo ? p.subjetivo.trim() : ''}

O — OBJETIVO
${p.ssvv && (p.ssvv.pa || p.ssvv.bpm || p.ssvv.sat) ? `PA ${linhaOuTraco(p.ssvv.pa)} | ${linhaOuTraco(p.ssvv.bpm)} bpm | Sat O2 ${linhaOuTraco(p.ssvv.sat)}\n` : ''}
${montarExameFisicoTexto(p)}

${p.labBlocos && p.labBlocos.length ? '\nExames:\n' + montarLabTexto(p) : ''}

A — AVALIAÇÃO
${linhaOuTraco(p.avaliacao)}

P — PLANO
${linhaOuTraco(p.plano)}`;
}

function gerarEvolucao(p){
  if(p.contexto === 'enfermaria') return gerarEvolucaoEnfermaria(p);
  if(p.contexto === 'emergencia') return gerarEvolucaoEmergencia(p);
  if(p.contexto === 'clinica') return gerarEvolucaoClinica(p);
  return '';
}
