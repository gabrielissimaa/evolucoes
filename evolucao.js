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

// Considera vazio texto em branco ou preenchido só com "-" (convenção usada nos campos condicionais)
function campoVazio(v){
  return !v || !String(v).trim() || String(v).trim() === '-';
}

// Monta um parágrafo corrido de HDA a partir da queixa principal + campos estruturados,
// pulando qualquer campo vazio. Retorna em maiúsculas (padrão dos seus registros).
function montarHdaProse(p){
  const h = p.hdaDetalhada || {};
  let queixaBase = '';
  if(!campoVazio(p.qp)) queixaBase = p.qp.trim();
  if(!queixaBase){
    const primeira = QUEIXAS_COMUNS.find(q => p.queixas[q.key] && p.queixas[q.key].on);
    if(primeira){
      const det = p.queixas[primeira.key].detalhe;
      queixaBase = (det && det.trim()) ? det.trim() : primeira.label;
    }
  }
  if(!queixaBase) return '';

  let frase = `Paciente vem ao serviço com queixa de ${queixaBase.toLowerCase()}`;
  if(!campoVazio(h.inicio)) frase += `, iniciada ${h.inicio.toLowerCase()}`;
  if(!campoVazio(h.evolucao)) frase += `, com evolução de ${h.evolucao.toLowerCase()}`;
  if(!campoVazio(h.localizacao)) frase += `, de localização ${h.localizacao.toLowerCase()}`;
  if(!campoVazio(h.intensidade)) frase += `, EVA ${h.intensidade}/10`;
  if(!campoVazio(h.duracao)) frase += `, ${h.duracao.toLowerCase()}`;
  if(!campoVazio(h.sintomasAssociados)){
    const itens = h.sintomasAssociados.split(',').map(s=>s.trim()).filter(Boolean);
    frase += `, associada a ${itens.join(' e ')}`;
  }
  if(!campoVazio(h.fatoresMelhora)) frase += `, que melhora com ${h.fatoresMelhora.toLowerCase()}`;
  if(!campoVazio(h.fatoresPiora)) frase += `, que piora com ${h.fatoresPiora.toLowerCase()}`;
  frase += '.';

  const extras = [];
  if(!campoVazio(h.tratamentos)) extras.push(`Tratamentos já realizados: ${h.tratamentos.trim()}.`);
  if(!campoVazio(h.impacto)) extras.push(`Impacto na rotina: ${h.impacto.trim()}.`);

  return [frase, ...extras].join(' ').toUpperCase();
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
${montarHdaProse(p) || montarQueixasTexto(p)}

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
${montarHdaProse(p) || montarQueixasTexto(p)}

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
${montarHdaProse(p) || montarQueixasTexto(p)}
${montarPerfilClinicaTexto(p)}
${p.subjetivo ? p.subjetivo.trim() : ''}

O — OBJETIVO
${montarExameFisicoTexto(p)}
${montarChecklistConsultaTexto(p)}

A — AVALIAÇÃO
${linhaOuTraco(p.avaliacao)}

P — PLANO
${linhaOuTraco(p.plano)}`;
}

function montarPerfilClinicaTexto(p){
  const linhas = [];
  if(!campoVazio(p.ocupacao)) linhas.push(`Ocupação: ${p.ocupacao.trim()}`);
  if(p.atividadeFisica){
    if(p.atividadeFisica.pratica){
      linhas.push(`Pratica atividade física${p.atividadeFisica.detalhe ? ': '+p.atividadeFisica.detalhe.trim() : ''}`);
    } else if(p.atividadeFisica.pratica === false){
      linhas.push('Sedentário(a)');
    }
  }
  return linhas.length ? linhas.join('\n') : '';
}

function montarChecklistConsultaTexto(p){
  if(!p.tipoConsulta) return '';
  const proto = CONSULTAS_PADRAO[p.tipoConsulta];
  if(!proto || !proto.obrigatorios) return '';
  const marcados = (proto.obrigatorios || []).filter((_,i)=> p.consultaChecklist && p.consultaChecklist[i]);
  if(!marcados.length) return '';
  return `\nItens avaliados nesta consulta (protocolo ${proto.label}):\n` + marcados.map(m=>`- ${m}`).join('\n');
}

function gerarEvolucao(p){
  if(p.contexto === 'enfermaria') return gerarEvolucaoEnfermaria(p);
  if(p.contexto === 'emergencia') return gerarEvolucaoEmergencia(p);
  if(p.contexto === 'clinica') return gerarEvolucaoClinica(p);
  return '';
}
