// ===================== APP PRINCIPAL =====================
let paciente = null;      // paciente atualmente aberto na tela de registro
let tela = { tipo: 'home' };
let saveTimeout = null;
let labPasteBuffer = { data:null, hora:null, valores:{} };
let openSections = new Set(['queixas']); // seções abertas por padrão

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(()=> t.classList.remove('show'), 1800);
}

function openModal(html){
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('show');
}
function closeModal(){
  document.getElementById('modalOverlay').classList.remove('show');
}
document.getElementById('modalOverlay').addEventListener('click', (e)=>{
  if(e.target.id === 'modalOverlay') closeModal();
});

function getPath(obj, path){ return path.split('.').reduce((o,k)=> (o==null?o:o[k]), obj); }
function setPath(obj, path, value){
  const keys = path.split('.');
  let o = obj;
  for(let i=0;i<keys.length-1;i++){ o = o[keys[i]]; }
  o[keys[keys.length-1]] = value;
}

function handleField(path, value){
  setPath(paciente, path, value);
  scheduleSave();
}
function handleCheck(path, checked){
  setPath(paciente, path, checked);
  scheduleSave();
  render();
}

function scheduleSave(){
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async ()=>{
    await salvarPaciente(paciente);
  }, 400);
}

function toggleSection(key){
  if(openSections.has(key)) openSections.delete(key); else openSections.add(key);
  render();
}

// ===================== ROTEAMENTO =====================
async function irParaHome(){
  paciente = null;
  tela = { tipo:'home' };
  render();
}
async function irParaRegistro(id){
  paciente = await dbGet('pacientes', id);
  tela = { tipo:'registro', id };
  openSections = new Set(['queixas']);
  render();
}
async function irParaEvolucao(id){
  paciente = await dbGet('pacientes', id);
  paciente.evolucaoGerada = gerarEvolucao(paciente);
  await salvarPaciente(paciente);
  tela = { tipo:'evolucao', id };
  render();
}

async function render(){
  const app = document.getElementById('app');
  if(tela.tipo === 'home') app.innerHTML = await renderHome();
  else if(tela.tipo === 'registro') app.innerHTML = renderRegistro();
  else if(tela.tipo === 'evolucao') app.innerHTML = renderEvolucaoTela();
  atualizarIndicadorSync();
}

// ===================== TELA: HOME =====================
let modoSelecao = false;
let selecionados = new Set();

function toggleModoSelecao(){
  modoSelecao = !modoSelecao;
  selecionados = new Set();
  render();
}
function toggleSelecaoPaciente(id){
  if(selecionados.has(id)) selecionados.delete(id); else selecionados.add(id);
  render();
}
function clicarPaciente(id){
  if(modoSelecao) toggleSelecaoPaciente(id);
  else irParaRegistro(id);
}
function confirmarExclusaoSelecionados(){
  if(selecionados.size === 0) return;
  openModal(`
    <h3 style="margin:0 0 10px;">Excluir ${selecionados.size} paciente(s)?</h3>
    <p class="hint" style="margin-bottom:16px;">Isso apaga os registros permanentemente (local e na nuvem) — não é possível desfazer.</p>
    <div class="btnrow">
      <button class="btn ghost" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn danger" style="flex:1" onclick="executarExclusaoSelecionados()">Excluir</button>
    </div>
  `);
}
async function executarExclusaoSelecionados(){
  for(const id of selecionados){
    await excluirPacienteDefinitivo(id);
  }
  closeModal();
  modoSelecao = false;
  selecionados = new Set();
  render();
  showToast('Excluído(s) com sucesso');
}

async function renderHome(){
  const pacientes = modoSelecao ? await listarTodosPacientes() : await listarPacientesAtivos();
  const lista = pacientes.length ? pacientes.map(p=>`
    <div class="pcard" onclick="clicarPaciente('${p.id}')">
      ${modoSelecao ? `<input type="checkbox" style="width:20px;height:20px;flex-shrink:0;accent-color:var(--danger);" ${selecionados.has(p.id)?'checked':''} onclick="event.stopPropagation();toggleSelecaoPaciente('${p.id}')">` : `<div class="pbadge ${p.contexto}"></div>`}
      <div class="pinfo">
        <div class="pname">${escapeHtml(p.nome)}${!p.ativo ? ' <span class="hint" style="display:inline;">(arquivado)</span>' : ''}</div>
        <div class="pmeta">${p.leito ? 'Leito '+escapeHtml(p.leito) : 'Sem leito'}</div>
        <span class="ptag ${p.contexto}">${CONTEXTOS[p.contexto].label}</span>
      </div>
      ${!modoSelecao ? `<div class="pchev">›</div>` : ''}
    </div>
  `).join('') : `<div class="empty"><h3>Nenhum paciente ${modoSelecao?'':'ativo'}</h3><p>Toque em "Novo paciente" para começar um registro.</p></div>`;

  return `
    <div class="topbar">
      <h1>Evoluções</h1>
      <div class="syncdot" id="syncDot"></div>
      <button class="iconbtn" onclick="toggleModoSelecao()" title="Selecionar">${modoSelecao ? '✕' : '☑'}</button>
      <button class="iconbtn" onclick="sairDaConta()" title="Sair">⏻</button>
    </div>
    <main>${lista}</main>
    ${modoSelecao
      ? `<button class="fab" style="background:var(--danger);border-color:var(--danger);box-shadow:0 8px 24px rgba(240,101,74,.35);" onclick="confirmarExclusaoSelecionados()" ${selecionados.size===0?'disabled':''}>Excluir ${selecionados.size>0?'('+selecionados.size+')':''}</button>`
      : `<button class="fab" onclick="abrirModalNovoPaciente()">+ Novo paciente</button>`
    }
  `;
}

function abrirModalNovoPaciente(){
  window._novoCtx = { contexto:'enfermaria', genero:'F', tipoConsulta:'' };
  openModal(`
    <h3 style="margin:0 0 14px;">Novo paciente</h3>
    <label class="flabel">Nome (primeiro nome)</label>
    <input type="text" id="npNome" placeholder="Ex: Maria">
    <label class="flabel">Leito / identificação</label>
    <input type="text" id="npLeito" placeholder="Ex: 302-A">
    <label class="flabel">Contexto</label>
    <div class="contextpick" id="npContexto">
      ${Object.entries(CONTEXTOS).map(([k,v])=>`
        <div class="ctxopt ${k==='enfermaria'?'on':''}" data-k="${k}" onclick="selecionarContexto('${k}')">
          <div class="ctxdot" style="background:var(--${v.cor})"></div>
          <div>${v.label}</div>
        </div>`).join('')}
    </div>
    <div id="npTipoConsultaWrap" class="hidden">
      <label class="flabel">É uma consulta agendada padrão?</label>
      <div class="chipwrap" id="npTipoConsulta">
        <div class="chip on" data-t="" onclick="selecionarTipoConsultaModal('')">Não / outra</div>
        ${Object.entries(CONSULTAS_PADRAO).filter(([k])=>k!=='geral').map(([k,v])=>`
          <div class="chip" data-t="${k}" onclick="selecionarTipoConsultaModal('${k}')">${v.label}</div>`).join('')}
      </div>
      <p class="hint" id="npTipoConsultaHint"></p>
    </div>
    <label class="flabel">Gênero (para o texto do exame físico)</label>
    <div class="togglebar" id="npGenero">
      <button class="on" data-g="F" onclick="selecionarGenero('F')">Feminino</button>
      <button data-g="M" onclick="selecionarGenero('M')">Masculino</button>
    </div>
    <div class="btnrow">
      <button class="btn ghost" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn primary" style="flex:1" onclick="criarPaciente()">Criar</button>
    </div>
  `);
}
function selecionarContexto(k){
  window._novoCtx.contexto = k;
  document.querySelectorAll('#npContexto .ctxopt').forEach(el=> el.classList.toggle('on', el.dataset.k===k));
  document.getElementById('npTipoConsultaWrap').classList.toggle('hidden', k !== 'clinica');
}
function selecionarTipoConsultaModal(t){
  window._novoCtx.tipoConsulta = t;
  document.querySelectorAll('#npTipoConsulta .chip').forEach(el=> el.classList.toggle('on', el.dataset.t===t));
  const proto = t ? CONSULTAS_PADRAO[t] : null;
  const hintEl = document.getElementById('npTipoConsultaHint');
  if(proto && proto.obrigatorios){
    hintEl.textContent = `Os campos vão se adequar aos itens obrigatórios do protocolo de ${proto.label}.`;
  } else if(proto){
    hintEl.textContent = `Protocolo de ${proto.label} ainda não foi adequado — a tela abrirá com os campos padrão da clínica por enquanto.`;
  } else {
    hintEl.textContent = '';
  }
}
function selecionarGenero(g){
  window._novoCtx.genero = g;
  document.querySelectorAll('#npGenero button').forEach(el=> el.classList.toggle('on', el.dataset.g===g));
}
async function criarPaciente(){
  const nome = document.getElementById('npNome').value.trim();
  const leito = document.getElementById('npLeito').value.trim();
  if(!nome){ showToast('Digite o nome do paciente'); return; }
  const p = novoPaciente({ nome, leito, contexto: window._novoCtx.contexto, genero: window._novoCtx.genero });
  p.exameFisico.genero = window._novoCtx.genero;
  if(window._novoCtx.contexto === 'clinica' && window._novoCtx.tipoConsulta){
    p.tipoConsulta = window._novoCtx.tipoConsulta;
  }
  await salvarPaciente(p);
  closeModal();
  irParaRegistro(p.id);
}

// ===================== COMPONENTES DE SEÇÃO (reutilizáveis) =====================
function secaoWrap(key, titulo, conteudoHtml){
  const open = openSections.has(key);
  return `
    <div class="section">
      <div class="section-head ${open?'open':''}" onclick="toggleSection('${key}')">
        <h3>${titulo}</h3>
        <div class="chev">›</div>
      </div>
      <div class="section-body ${open?'open':''}">${conteudoHtml}</div>
    </div>`;
}

function campoTexto(label, path, placeholder=''){
  return `<div><label class="flabel">${label}</label>
    <input type="text" value="${escapeHtml(getPath(paciente,path)||'')}" placeholder="${escapeHtml(placeholder)}"
      oninput="handleField('${path}', this.value)"></div>`;
}
function campoArea(label, path, placeholder=''){
  return `<div><label class="flabel">${label}</label>
    <textarea placeholder="${escapeHtml(placeholder)}" oninput="handleField('${path}', this.value)">${escapeHtml(getPath(paciente,path)||'')}</textarea></div>`;
}

function renderQueixasSecao(){
  const chips = QUEIXAS_COMUNS.map(q=>{
    const on = paciente.queixas[q.key] && paciente.queixas[q.key].on;
    return `<div class="chip ${on?'on':''}" onclick="toggleQueixa('${q.key}')">${q.label}${on?' <span class="x">✕</span>':''}</div>`;
  }).join('');
  const detalhes = QUEIXAS_COMUNS.filter(q=> paciente.queixas[q.key] && paciente.queixas[q.key].on).map(q=>`
    <div class="qitem">
      <strong style="font-size:13px;">${q.label}</strong>
      <input type="text" placeholder="Detalhar (opcional)" value="${escapeHtml(paciente.queixas[q.key].detalhe||'')}"
        oninput="handleField('queixas.${q.key}.detalhe', this.value)">
    </div>`).join('');
  return secaoWrap('queixas','Queixas e sintomas', `
    <div class="chipwrap">${chips}</div>
    ${detalhes}
    <label class="flabel">Outras queixas (texto livre)</label>
    <textarea placeholder="Outras queixas relatadas..." oninput="handleField('queixasLivre', this.value)">${escapeHtml(paciente.queixasLivre||'')}</textarea>
  `);
}
function toggleQueixa(key){
  if(!paciente.queixas[key]) paciente.queixas[key] = { on:false, detalhe:'' };
  paciente.queixas[key].on = !paciente.queixas[key].on;
  scheduleSave();
  render();
}

function renderExameFisicoSecao(){
  const normal = paciente.exameFisico.normal;
  let corpo = `
    <label class="flabel">Todos os sistemas estão normais?</label>
    <div class="togglebar">
      <button class="${normal?'on':''}" onclick="setExameNormal(true)">Sim, tudo normal</button>
      <button class="${!normal?'on':''}" onclick="setExameNormal(false)">Não, há alterações</button>
    </div>
  `;
  if(!normal){
    corpo += `<div class="syslist">`;
    for(const s of SISTEMAS){
      const alt = paciente.exameFisico.alterados[s.key] || { on:false, texto:'' };
      corpo += `
        <div class="sysrow">
          <div class="sysrow-head">
            <input type="checkbox" ${alt.on?'checked':''} onchange="toggleSistemaAlterado('${s.key}', this.checked)">
            <div class="sysname">${s.label}</div>
          </div>
          ${alt.on ? `<div class="sysrow-body">
            <textarea placeholder="Descreva o achado alterado..." oninput="handleField('exameFisico.alterados.${s.key}.texto', this.value)">${escapeHtml(alt.texto||'')}</textarea>
          </div>` : `<div class="sysrow-body"><span class="hint">Normal (padrão)</span></div>`}
        </div>`;
    }
    corpo += `</div>`;
  }
  corpo += `<label class="flabel">Observações livres</label>
    <textarea placeholder="Observações adicionais do exame físico..." oninput="handleField('exameFisico.observacoes', this.value)">${escapeHtml(paciente.exameFisico.observacoes||'')}</textarea>`;
  return secaoWrap('exameFisico','Exame físico', corpo);
}
function setExameNormal(v){
  paciente.exameFisico.normal = v;
  scheduleSave();
  render();
}
function toggleSistemaAlterado(key, checked){
  if(!paciente.exameFisico.alterados[key]) paciente.exameFisico.alterados[key] = { on:false, texto:'' };
  paciente.exameFisico.alterados[key].on = checked;
  scheduleSave();
  render();
}

function renderLabSecao(){
  const grupos = ordenarBlocos(paciente.labBlocos || []).reverse(); // mais recente primeiro
  let tabela = '';
  if(grupos.length){
    const chaves = LAB_TODOS.filter(ex => grupos.some(g=> g.valores[ex.key] != null));
    tabela = `<table class="labtable"><thead><tr><th>Exame</th>${grupos.map(g=>`<th>${g.data}${g.hora?' '+g.hora:''}</th>`).join('')}</tr></thead><tbody>`;
    for(const ex of chaves){
      tabela += `<tr><td>${ex.key}</td>`;
      for(let i=0;i<grupos.length;i++){
        const atual = grupos[i].valores[ex.key];
        const anterior = grupos[i+1] ? grupos[i+1].valores[ex.key] : null;
        const trend = compararTendencia(atual, anterior);
        tabela += `<td>${atual!=null ? `<span class="trend-${trend||'flat'}">${escapeHtml(atual)} ${trend?iconeTendencia(trend):''}</span>` : '—'}</td>`;
      }
      tabela += `</tr>`;
    }
    tabela += `</tbody></table>`;
  }
  return secaoWrap('lab','Exames laboratoriais', `
    ${tabela || '<p class="hint">Nenhum exame colado ainda.</p>'}
    <div class="btnrow"><button class="btn primary sm" onclick="abrirModalColarLab()">+ Colar resultado</button></div>
  `);
}

function abrirModalColarLab(){
  openModal(`
    <h3 style="margin:0 0 14px;">Colar resultado laboratorial</h3>
    <div class="labpaste">
      <textarea id="labRaw" placeholder="Cole aqui o texto do laboratório (data, hora e valores)..."></textarea>
    </div>
    <div class="btnrow"><button class="btn primary" style="flex:1" onclick="processarLabColado()">Extrair valores</button></div>
    <div id="labPreview"></div>
  `);
}
function processarLabColado(){
  const raw = document.getElementById('labRaw').value;
  if(!raw.trim()){ showToast('Cole o texto do exame'); return; }
  const parsed = parseLabText(raw);
  labPasteBuffer = parsed;
  renderLabPreview();
}
function renderLabPreview(){
  const b = labPasteBuffer;
  const linhas = LAB_TODOS.map(ex=>{
    const v = b.valores[ex.key] ?? '';
    return `<div class="labeditrow">
      <span style="font-size:12.5px;color:var(--text2)">${ex.label} (${ex.key})</span>
      <input type="text" value="${escapeHtml(v)}" oninput="labPasteBuffer.valores['${ex.key}']=this.value">
      <button class="rm" onclick="delete labPasteBuffer.valores['${ex.key}']; renderLabPreview();">✕</button>
    </div>`;
  }).join('');
  document.getElementById('labPreview').innerHTML = `
    <div class="labdate">
      Data: <input type="text" style="width:90px;display:inline-block;background:none;border:none;color:var(--text);font-weight:700;" value="${escapeHtml(b.data||'')}" oninput="labPasteBuffer.data=this.value">
      Hora: <input type="text" style="width:60px;display:inline-block;background:none;border:none;color:var(--text);font-weight:700;" value="${escapeHtml(b.hora||'')}" oninput="labPasteBuffer.hora=this.value">
    </div>
    ${linhas}
    <div class="btnrow"><button class="btn primary" style="flex:1" onclick="confirmarLabColado()">Salvar exame</button></div>
  `;
}
function confirmarLabColado(){
  if(!labPasteBuffer.data){ showToast('Informe a data do exame'); return; }
  const valoresLimpos = {};
  for(const [k,v] of Object.entries(labPasteBuffer.valores)){ if(v !== '' && v != null) valoresLimpos[k] = v; }
  paciente.labBlocos.push({
    id: 'lab_'+Date.now(),
    data: labPasteBuffer.data, hora: labPasteBuffer.hora, valores: valoresLimpos,
  });
  scheduleSave();
  closeModal();
  render();
  showToast('Exame adicionado');
}

function renderHdaDetalhadaSecao(){
  const h = paciente.hdaDetalhada;
  return secaoWrap('hdaDet','HDA detalhada (gera o texto corrido automaticamente)', `
    ${campoTexto('Início','hdaDetalhada.inicio','Ex: ontem, há 3 dias')}
    ${campoTexto('Evolução','hdaDetalhada.evolucao','Ex: piora, melhora, estável')}
    ${campoTexto('Localização','hdaDetalhada.localizacao')}
    <div class="row2">${campoTexto('Intensidade (0-10)','hdaDetalhada.intensidade')}${campoTexto('Duração/frequência','hdaDetalhada.duracao')}</div>
    ${campoArea('Sintomas associados (separe por vírgula)','hdaDetalhada.sintomasAssociados')}
    <div class="row2">${campoTexto('Fatores de melhora','hdaDetalhada.fatoresMelhora')}${campoTexto('Fatores de piora','hdaDetalhada.fatoresPiora')}</div>
    ${campoArea('Tratamentos já realizados e resposta','hdaDetalhada.tratamentos')}
    ${campoTexto('Impacto na rotina','hdaDetalhada.impacto')}
    <p class="hint">Deixe em branco (ou "-") o que não se aplica — só entra no texto o que for preenchido.</p>
  `);
}

function setAtividadeFisica(v){
  paciente.atividadeFisica.pratica = v;
  scheduleSave();
  render();
}

function renderTipoConsultaSecao(){
  const chips = Object.entries(CONSULTAS_PADRAO).map(([k,v])=>{
    const on = paciente.tipoConsulta === k;
    return `<div class="chip ${on?'on':''}" onclick="selecionarTipoConsulta('${k}')">${v.label}</div>`;
  }).join('');

  let corpo = `<div class="chipwrap">${chips}</div>`;
  const proto = paciente.tipoConsulta ? CONSULTAS_PADRAO[paciente.tipoConsulta] : null;

  if(paciente.tipoConsulta === 'has'){
    corpo += `<p class="hint" style="margin-top:12px;">Campos específicos do protocolo HAS logo abaixo ↓</p>`;
  } else if(proto && proto.obrigatorios){
    if(proto.alerta){
      corpo += `<div class="qitem" style="border-color:var(--warn);margin-top:12px;"><strong style="color:var(--warn);font-size:12.5px;">⚠ Atenção</strong><p class="hint" style="color:var(--text2);margin-top:4px;">${escapeHtml(proto.alerta)}</p></div>`;
    }
    corpo += `<label class="flabel">Itens a avaliar (${escapeHtml(proto.label)})</label>`;
    corpo += proto.obrigatorios.map((item, i)=>{
      const on = paciente.consultaChecklist && paciente.consultaChecklist[i];
      return `<div class="chip ${on?'on':''}" style="display:flex;width:100%;margin-top:6px;" onclick="toggleChecklistItem(${i})">
        <span style="flex:1;">${escapeHtml(item)}</span>${on?'✓':''}
      </div>`;
    }).join('');

    if(proto.riscos && proto.riscos.length){
      corpo += `<label class="flabel" style="margin-top:16px;color:var(--danger);">⚠ Sinais de alarme / critérios de encaminhamento</label>`;
      corpo += proto.riscos.map((item, i)=>{
        const on = paciente.riscoChecklist && paciente.riscoChecklist[i];
        return `<div class="chip ${on?'on':''}" style="display:flex;width:100%;margin-top:6px;${on?'border-color:var(--danger);color:var(--danger);':''}" onclick="toggleRiscoItem(${i})">
          <span style="flex:1;">${escapeHtml(item)}</span>${on?'⚠':''}
        </div>`;
      }).join('');
    }

    if(!paciente.protocoloDados[paciente.tipoConsulta]) inicializarProtocoloDados(paciente.tipoConsulta);
    const pd = paciente.protocoloDados[paciente.tipoConsulta];
    corpo += `
      <label class="flabel" style="margin-top:16px;">Retorno sugerido — entra automaticamente no Plano</label>
      <div class="row2">${campoTextoAutoPlanoGenerico('Retorno em', paciente.tipoConsulta, 'retornoValor', 'Ex: 3')}
        <div>
          <label class="flabel">Unidade</label>
          <div class="togglebar">
            <button class="${pd.retornoUnidade!=='dias'?'on':''}" onclick="setRetornoUnidadeGenerico('${paciente.tipoConsulta}','meses')">Meses</button>
            <button class="${pd.retornoUnidade==='dias'?'on':''}" onclick="setRetornoUnidadeGenerico('${paciente.tipoConsulta}','dias')">Dias</button>
          </div>
        </div>
      </div>
      <label class="flabel" style="margin-top:16px;">Encaminhamentos / especialistas de acompanhamento regular</label>
      ${campoTextoAutoPlanoGenerico('Especialistas', paciente.tipoConsulta, 'especialistas', 'Ex: Psiquiatria, CAPS')}
      ${campoArea('Observações do protocolo','protocoloDados.'+paciente.tipoConsulta+'.observacoes')}
    `;
    if(proto.fonte) corpo += `<p class="hint" style="margin-top:10px;">Fonte: ${escapeHtml(proto.fonte)}</p>`;
  } else if(proto){
    corpo += `<p class="hint" style="margin-top:12px;">Protocolo de "${escapeHtml(proto.label)}" ainda não foi revisado e adicionado ao app — em breve.</p>`;
  }

  return secaoWrap('tipoConsulta','Tipo de consulta (protocolo SUBPAV)', corpo);
}
function selecionarTipoConsulta(k){
  paciente.tipoConsulta = (paciente.tipoConsulta === k) ? '' : k;
  paciente.consultaChecklist = {};
  paciente.riscoChecklist = {};
  if(paciente.tipoConsulta && paciente.tipoConsulta !== 'has' && !paciente.protocoloDados[paciente.tipoConsulta]){
    inicializarProtocoloDados(paciente.tipoConsulta);
    atualizarPlanoAutomaticoGenerico(paciente.tipoConsulta);
  }
  scheduleSave();
  render();
}
function toggleChecklistItem(i){
  if(!paciente.consultaChecklist) paciente.consultaChecklist = {};
  paciente.consultaChecklist[i] = !paciente.consultaChecklist[i];
  scheduleSave();
  render();
}
function toggleRiscoItem(i){
  if(!paciente.riscoChecklist) paciente.riscoChecklist = {};
  paciente.riscoChecklist[i] = !paciente.riscoChecklist[i];
  scheduleSave();
  render();
}

// ---- Genérico: retorno/especialistas com preenchimento automático do Plano (usado por todo protocolo exceto HAS) ----
function inicializarProtocoloDados(chave){
  const proto = CONSULTAS_PADRAO[chave];
  const def = (proto && proto.planoDefault) || { retornoValor:'', retornoUnidade:'meses' };
  paciente.protocoloDados[chave] = {
    retornoValor: def.retornoValor || '', retornoUnidade: def.retornoUnidade || 'meses',
    especialistas: '', observacoes: '', _planoAutoTexto: '',
  };
}
function campoTextoAutoPlanoGenerico(label, chave, campo, placeholder=''){
  const path = `protocoloDados.${chave}.${campo}`;
  const valor = getPath(paciente, path) || '';
  return `<div><label class="flabel">${label}</label>
    <input type="text" value="${escapeHtml(valor)}" placeholder="${escapeHtml(placeholder)}"
      oninput="handleFieldAutoPlanoGenerico('${chave}', '${path}', this.value)"></div>`;
}
function handleFieldAutoPlanoGenerico(chave, path, value){
  setPath(paciente, path, value);
  atualizarPlanoAutomaticoGenerico(chave);
  scheduleSave();
  const planoEl = document.querySelector('textarea[oninput^="handleField(\'plano\'"]');
  if(planoEl) planoEl.value = paciente.plano;
}
function setRetornoUnidadeGenerico(chave, u){
  paciente.protocoloDados[chave].retornoUnidade = u;
  atualizarPlanoAutomaticoGenerico(chave);
  scheduleSave();
  render();
}
function atualizarPlanoAutomaticoGenerico(chave){
  const pd = paciente.protocoloDados[chave];
  if(!pd) return;
  const linhas = [];
  if(!campoVazioApp(pd.retornoValor)){
    linhas.push(`Agendar retorno em ${pd.retornoValor.trim()} ${pd.retornoUnidade === 'dias' ? 'dias' : (pd.retornoUnidade === 'semanas' ? 'semanas' : 'meses')}.`);
  }
  if(!campoVazioApp(pd.especialistas)){
    linhas.push(`Encaminhar para acompanhamento regular: ${pd.especialistas.trim()}.`);
  }
  const novoBloco = linhas.join('\n');
  const anterior = pd._planoAutoTexto || '';
  let plano = paciente.plano || '';
  if(anterior && plano.includes(anterior)){
    plano = plano.replace(anterior, novoBloco);
  } else if(novoBloco){
    plano = (plano.trim() ? plano.trim() + '\n' : '') + novoBloco;
  }
  paciente.plano = plano.trim();
  pd._planoAutoTexto = novoBloco;
}

function renderProtocoloHASSecao(){
  const proto = CONSULTAS_PADRAO.has;
  const h = paciente.protocoloHAS;
  const ldlCalculado = (()=>{
    const ct = parseFloat(h.colesterolTotal), tg = parseFloat(h.triglicerideos), hdl = parseFloat(h.hdl);
    if(!isNaN(ct) && !isNaN(tg) && !isNaN(hdl) && tg < 400){
      return (ct - (tg/5 + hdl)).toFixed(0);
    }
    return null;
  })();

  let corpo = `
    <div class="qitem" style="border-color:var(--warn);">
      <strong style="color:var(--warn);font-size:12.5px;">⚠ Atenção</strong>
      <p class="hint" style="color:var(--text2);margin-top:4px;">${escapeHtml(proto.alerta)}</p>
    </div>
    <label class="flabel">Aferição da PA (2 medidas)</label>
    <div class="row2">${campoTexto('1ª medida','protocoloHAS.pa1','Ex: 130x85')}${campoTexto('2ª medida','protocoloHAS.pa2','Ex: 128x82')}</div>

    <label class="flabel" style="margin-top:16px;">Exames de lesão em órgão-alvo (EAS, glicemia, eletrólitos, creatinina, TFG, perfil lipídico, fundoscopia, ECG) foram solicitados/já realizados nesta consulta?</label>
    <div class="togglebar">
      <button class="${h.examesSolicitados===false?'on':''}" onclick="setExamesSolicitadosHAS(false)">Não — vou solicitar</button>
      <button class="${h.examesSolicitados===true?'on':''}" onclick="setExamesSolicitadosHAS(true)">Sim — vou preencher</button>
    </div>
  `;

  if(h.examesSolicitados === false){
    corpo += `<p class="hint" style="margin-top:10px;">Certo — vou colocar automaticamente no Plano a sugestão de solicitar esses exames. Você edita o texto final se quiser ajustar.</p>`;
  } else if(h.examesSolicitados === true){
    corpo += `
      ${campoTexto('EAS (proteinúria/hematúria)','protocoloHAS.eas',"Achado, ex: sem alterações")}
      <div class="row2">${campoTexto('Glicemia de jejum','protocoloHAS.glicemiaJejum')}${campoTexto('Creatinina','protocoloHAS.creatinina')}</div>
      <div class="row2">${campoTexto('Sódio','protocoloHAS.sodio')}${campoTexto('Potássio','protocoloHAS.potassio')}</div>
      ${campoTexto('TFG (taxa de filtração glomerular)','protocoloHAS.tfg')}
      <div class="row3">${campoTexto('Colesterol total','protocoloHAS.colesterolTotal')}${campoTexto('HDL','protocoloHAS.hdl')}${campoTexto('Triglicerídeos','protocoloHAS.triglicerideos')}</div>
      ${ldlCalculado!=null ? `<p class="hint">LDL calculado: ${ldlCalculado} mg/dL</p>` : ''}
      ${campoTexto('Fundoscopia','protocoloHAS.fundoscopia',"Achado, ex: não realizada")}
      ${campoTexto('ECG de repouso','protocoloHAS.ecg',"Achado, ex: não realizado")}
    `;
  }

  corpo += `
    <label class="flabel" style="margin-top:16px;">Orientação sobre estilo de vida (dieta, atividade física, álcool)</label>
    <div class="togglebar">
      <button class="${h.orientacaoEstiloVida.feita===false?'on':''}" onclick="setOrientacaoHAS(false)">Não abordado</button>
      <button class="${h.orientacaoEstiloVida.feita===true?'on':''}" onclick="setOrientacaoHAS(true)">Abordado</button>
    </div>
    ${h.orientacaoEstiloVida.feita ? campoArea('Detalhe da orientação','protocoloHAS.orientacaoEstiloVida.detalhe') : ''}

    <label class="flabel" style="margin-top:16px;">Retorno sugerido — entra automaticamente no Plano</label>
    <div class="row2">${campoTextoAutoPlanoHAS('Retorno em','protocoloHAS.retornoValor','Ex: 6')}
      <div>
        <label class="flabel">Unidade</label>
        <div class="togglebar">
          <button class="${h.retornoUnidade!=='dias'?'on':''}" onclick="setRetornoUnidadeHAS('meses')">Meses</button>
          <button class="${h.retornoUnidade==='dias'?'on':''}" onclick="setRetornoUnidadeHAS('dias')">Dias</button>
        </div>
      </div>
    </div>

    <label class="flabel" style="margin-top:16px;">Encaminhamentos / especialistas de acompanhamento regular</label>
    ${campoTextoAutoPlanoHAS('Ex: Cardiologia, Oftalmologia','protocoloHAS.especialistas','Deixe em branco se não houver')}

    <p class="hint" style="margin-top:10px;">Fonte: ${escapeHtml(proto.fonte)}</p>
  `;

  return secaoWrap('protocoloHAS','Avaliação — Protocolo HAS', corpo);
}

// Campo de texto que, além de salvar, atualiza automaticamente o bloco correspondente na caixa de Plano
function campoTextoAutoPlanoHAS(label, path, placeholder=''){
  return `<div><label class="flabel">${label}</label>
    <input type="text" value="${escapeHtml(getPath(paciente,path)||'')}" placeholder="${escapeHtml(placeholder)}"
      oninput="handleFieldAutoPlanoHAS('${path}', this.value)"></div>`;
}
function handleFieldAutoPlanoHAS(path, value){
  setPath(paciente, path, value);
  atualizarPlanoAutomaticoHAS();
  scheduleSave();
  // atualiza só a caixa de plano na tela, sem re-renderizar tudo (evita perder o foco do campo digitado)
  const planoEl = document.querySelector('textarea[oninput^="handleField(\'plano\'"]');
  if(planoEl) planoEl.value = paciente.plano;
}
function setRetornoUnidadeHAS(u){
  paciente.protocoloHAS.retornoUnidade = u;
  atualizarPlanoAutomaticoHAS();
  scheduleSave();
  render();
}

// Monta (ou atualiza) o bloco automático no Plano: exames a solicitar, retorno sugerido e encaminhamentos.
// Usa um marcador para conseguir substituir só a parte automática sem apagar o que você escreveu à mão.
function atualizarPlanoAutomaticoHAS(){
  const h = paciente.protocoloHAS;
  const linhas = [];
  if(h.examesSolicitados === false){
    linhas.push('Solicitar: EAS, glicemia de jejum, eletrólitos (Na/K), creatinina, TFG, colesterol total, HDL, triglicerídeos.');
  }
  if(!campoVazioApp(h.retornoValor)){
    linhas.push(`Agendar retorno em ${h.retornoValor.trim()} ${h.retornoUnidade === 'dias' ? 'dias' : 'meses'}.`);
  }
  if(!campoVazioApp(h.especialistas)){
    linhas.push(`Encaminhar para acompanhamento regular: ${h.especialistas.trim()}.`);
  }
  const novoBloco = linhas.join('\n');
  const anterior = h._planoAutoTexto || '';
  let plano = paciente.plano || '';
  if(anterior && plano.includes(anterior)){
    plano = plano.replace(anterior, novoBloco);
  } else if(novoBloco){
    plano = (plano.trim() ? plano.trim() + '\n' : '') + novoBloco;
  }
  paciente.plano = plano.trim();
  h._planoAutoTexto = novoBloco;
}
function campoVazioApp(v){ return !v || !String(v).trim() || String(v).trim() === '-'; }

function setOrientacaoHAS(v){
  paciente.protocoloHAS.orientacaoEstiloVida.feita = v;
  scheduleSave();
  render();
}
function setExamesSolicitadosHAS(v){
  paciente.protocoloHAS.examesSolicitados = v;
  atualizarPlanoAutomaticoHAS();
  scheduleSave();
  render();
}

// ===================== TELA: REGISTRO (por contexto) =====================
function renderRegistro(){
  const cor = CONTEXTOS[paciente.contexto].cor;
  let secoes = '';

  if(paciente.contexto === 'enfermaria'){
    secoes += secaoWrap('ident','Identificação', `
      <div class="row2">${campoTexto('Data de internação (IH)','ih','DD/MM')}${generoToggleHtml()}</div>
      ${campoTexto('Motivo da internação (MIH)','mih')}
    `);
    secoes += secaoWrap('infoRel','Informações relevantes', `
      ${campoTexto('Alergias','infoFixa.alergias','NEGA')}
      <div class="row2">${campoTexto('Antibióticos (ATB)','infoFixa.atb')}${campoTexto('Ventilação','infoFixa.vent','AA')}</div>
      ${campoTexto('Invasões / dispositivos','infoFixa.invasoes')}
      ${campoTexto('Infusões','infoFixa.infusoes')}
      ${campoTexto('Diurese (tipo)','infoFixa.diurese','Espontânea')}
    `);
    secoes += renderQueixasSecao();
    secoes += renderHdaDetalhadaSecao();
    secoes += secaoWrap('hpp','HPP / medicações / hábitos', `
      ${campoArea('HPP (história patológica pregressa)','infoFixa.hpp')}
      ${campoArea('MUC (medicações em uso contínuo)','infoFixa.muc')}
      <div class="row2">
        <div><label class="flabel">Tabagismo</label>${checkboxHtml('infoFixa.tabagismo')}</div>
        <div><label class="flabel">Etilismo</label>${checkboxHtml('infoFixa.etilismo')}</div>
      </div>
      ${campoArea('HSOC (observações)','infoFixa.hsocLivre')}
    `);
    secoes += secaoWrap('u24','Últimas 24h (enfermagem)', `
      <div class="row3">${campoTexto('PA','ultimas24h.pa')}${campoTexto('FC','ultimas24h.fc')}${campoTexto('FR','ultimas24h.fr')}</div>
      <div class="row3">${campoTexto('TAX','ultimas24h.tax')}${campoTexto('HGT','ultimas24h.hgt')}${campoTexto('Diurese','ultimas24h.diurese')}</div>
      ${campoTexto('Função intestinal','ultimas24h.funcaoIntestinal')}
      ${campoTexto('Balanço hídrico','ultimas24h.balancoHidrico')}
      <label class="flabel" style="margin-top:14px;">SSVV no momento</label>
      <div class="row3">${campoTexto('PA','ssvv.pa')}${campoTexto('FC (bpm)','ssvv.bpm')}${campoTexto('Sat O2 %','ssvv.sat')}</div>
    `);
    secoes += renderExameFisicoSecao();
    secoes += renderLabSecao();
    secoes += secaoWrap('imagem','Exames de imagem', `${campoArea('Nome, data e achados relevantes','examesImagem')}`);
    secoes += secaoWrap('final','Impressão e conduta', `
      ${campoArea('Impressão','impressao')}
      ${campoArea('Conduta','conduta','VIGILÂNCIA CLÍNICA')}
    `);
  }

  else if(paciente.contexto === 'emergencia'){
    secoes += secaoWrap('qp','Queixa principal', `${campoTexto('QP','qp')}`);
    secoes += renderQueixasSecao();
    secoes += renderHdaDetalhadaSecao();
    secoes += secaoWrap('hpp2','HPP', `
      ${campoArea('Doenças prévias','hppDetalhada.doencasPrevias')}
      ${campoArea('Cirurgias/internações','hppDetalhada.cirurgias')}
      ${campoTexto('Alergias','hppDetalhada.alergias','NEGA')}
      ${campoArea('Medicamentos em uso','hppDetalhada.medicamentos')}
      <div class="row2">
        <div><label class="flabel">Tabagismo</label>${checkboxHtml('infoFixa.tabagismo')}</div>
        <div><label class="flabel">Etilismo</label>${checkboxHtml('infoFixa.etilismo')}</div>
      </div>
    `);
    secoes += renderExameFisicoSecao();
    secoes += renderLabSecao();
    secoes += secaoWrap('conduta2','Conduta', `${campoArea('Conduta','conduta')}`);
  }

  else if(paciente.contexto === 'clinica'){
    secoes += secaoWrap('perfil','Perfil', `
      ${campoTexto('Ocupação','ocupacao')}
      <label class="flabel">Pratica atividade física?</label>
      <div class="togglebar">
        <button class="${paciente.atividadeFisica.pratica===false?'on':''}" onclick="setAtividadeFisica(false)">Não</button>
        <button class="${paciente.atividadeFisica.pratica===true?'on':''}" onclick="setAtividadeFisica(true)">Sim</button>
      </div>
      ${paciente.atividadeFisica.pratica ? campoTexto('Qual atividade / frequência','atividadeFisica.detalhe') : ''}
    `);
    secoes += secaoWrap('subj','S — Subjetivo', `${campoArea('Relato do paciente (queixas, história, o que trouxe à consulta)','subjetivo')}`);
    secoes += renderTipoConsultaSecao();
    if(paciente.tipoConsulta === 'has'){
      if(!paciente.protocoloHAS._planoAutoTexto) atualizarPlanoAutomaticoHAS();
      secoes += renderProtocoloHASSecao();
    }
    secoes += renderExameFisicoSecao();
    secoes += secaoWrap('avplan','A / P — Avaliação e Plano', `
      ${campoArea('Avaliação','avaliacao','Hipótese diagnóstica — ex: HAS estágio 1, controlada')}
      ${campoArea('Plano','plano')}
    `);
  }

  return `
    <div class="topbar">
      <button class="backbtn" onclick="irParaHome()">‹</button>
      <h1>${escapeHtml(paciente.nome)}${paciente.leito ? ' · '+escapeHtml(paciente.leito) : ''}</h1>
      <div class="syncdot" id="syncDot"></div>
      <button class="iconbtn" onclick="abrirMenuPaciente()">⋯</button>
    </div>
    <main>${secoes}</main>
    <button class="fab" onclick="irParaEvolucao('${paciente.id}')">Gerar evolução</button>
  `;
}

function generoToggleHtml(){
  const g = paciente.exameFisico.genero || paciente.genero || 'F';
  return `<div><label class="flabel">Gênero</label>
    <div class="togglebar">
      <button class="${g==='F'?'on':''}" onclick="handleField('exameFisico.genero','F'); render();">Fem.</button>
      <button class="${g==='M'?'on':''}" onclick="handleField('exameFisico.genero','M'); render();">Masc.</button>
    </div></div>`;
}
function checkboxHtml(path){
  const v = getPath(paciente, path);
  return `<div class="togglebar">
    <button class="${!v?'on':''}" onclick="handleCheck('${path}', false)">Não</button>
    <button class="${v?'on':''}" onclick="handleCheck('${path}', true)">Sim</button>
  </div>`;
}

function abrirMenuPaciente(){
  openModal(`
    <h3 style="margin:0 0 14px;">${escapeHtml(paciente.nome)}</h3>
    <div class="btnrow" style="flex-direction:column;">
      <button class="btn danger" style="width:100%" onclick="confirmarArquivar()">Arquivar / dar alta deste paciente</button>
      <button class="btn danger" style="width:100%" onclick="confirmarExclusao()">Excluir definitivamente</button>
      <button class="btn ghost" style="width:100%" onclick="closeModal()">Fechar</button>
    </div>
  `);
}
function confirmarExclusao(){
  openModal(`
    <h3 style="margin:0 0 10px;">Excluir ${escapeHtml(paciente.nome)}?</h3>
    <p class="hint" style="margin-bottom:16px;">Isso apaga o registro permanentemente (local e na nuvem) — não é possível desfazer. Use "Arquivar" se só quiser tirar da lista ativa.</p>
    <div class="btnrow">
      <button class="btn ghost" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn danger" style="flex:1" onclick="excluirEVoltar()">Excluir</button>
    </div>
  `);
}
async function excluirEVoltar(){
  await excluirPacienteDefinitivo(paciente.id);
  closeModal();
  irParaHome();
}
function confirmarArquivar(){
  openModal(`
    <h3 style="margin:0 0 10px;">Arquivar paciente?</h3>
    <p class="hint" style="margin-bottom:16px;">Isso remove ${escapeHtml(paciente.nome)} da sua lista ativa. Use depois de já ter colado a evolução no sistema oficial.</p>
    <div class="btnrow">
      <button class="btn ghost" style="flex:1" onclick="closeModal()">Cancelar</button>
      <button class="btn danger" style="flex:1" onclick="arquivarEVoltar()">Arquivar</button>
    </div>
  `);
}
async function arquivarEVoltar(){
  await arquivarPaciente(paciente.id);
  closeModal();
  irParaHome();
}

// ===================== TELA: EVOLUÇÃO GERADA =====================
function renderEvolucaoTela(){
  return `
    <div class="topbar">
      <button class="backbtn" onclick="irParaRegistro('${paciente.id}')">‹</button>
      <h1>Evolução</h1>
      <div class="syncdot" id="syncDot"></div>
    </div>
    <main>
      <div class="section"><div class="section-body open evoout">
        <textarea id="evoText" oninput="paciente.evolucaoGerada=this.value">${escapeHtml(paciente.evolucaoGerada)}</textarea>
      </div></div>
      <div class="btnrow">
        <button class="btn primary" style="flex:1" onclick="copiarEvolucao()">Copiar texto</button>
        <button class="btn ghost" style="flex:1" onclick="regenerarEvolucao()">Regenerar</button>
      </div>
      <div class="btnrow">
        <button class="btn danger" style="flex:1" onclick="confirmarArquivar()">Concluir e arquivar paciente</button>
      </div>
      <div class="btnrow">
        <button class="btn ghost" style="flex:1" onclick="confirmarExclusao()">Excluir definitivamente</button>
      </div>
    </main>
  `;
}
async function copiarEvolucao(){
  const txt = document.getElementById('evoText').value;
  try{
    await navigator.clipboard.writeText(txt);
    showToast('Evolução copiada!');
  }catch(e){
    showToast('Não foi possível copiar automaticamente — selecione o texto manualmente.');
  }
  await salvarPaciente(paciente);
}
function regenerarEvolucao(){
  paciente.evolucaoGerada = gerarEvolucao(paciente);
  render();
  showToast('Evolução regenerada a partir dos dados atuais');
}

// ===================== INIT =====================
if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  });
}
// render() é chamado pelo sync.js (mostrarTelaCorreta) assim que a sessão é confirmada.
