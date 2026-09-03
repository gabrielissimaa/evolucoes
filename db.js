// ===================== ARMAZENAMENTO (IndexedDB + fila de sync) =====================
const DB_NAME = 'visita-db';
const DB_VERSION = 2;
let _db = null;

function abrirDB(){
  return new Promise((resolve, reject)=>{
    if(_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e)=>{
      const db = e.target.result;
      if(!db.objectStoreNames.contains('pacientes')){
        db.createObjectStore('pacientes', { keyPath: 'id' });
      }
      if(!db.objectStoreNames.contains('fila_sync')){
        db.createObjectStore('fila_sync', { keyPath: 'id', autoIncrement: true });
      }
      if(!db.objectStoreNames.contains('configuracoes')){
        db.createObjectStore('configuracoes', { keyPath: 'chave' });
      }
    };
    req.onsuccess = (e)=>{ _db = e.target.result; resolve(_db); };
    req.onerror = (e)=> reject(e.target.error);
  });
}

async function dbGetAll(store){
  const db = await abrirDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(store,'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = ()=> resolve(req.result || []);
    req.onerror = (e)=> reject(e.target.error);
  });
}

async function dbGet(store, id){
  const db = await abrirDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(store,'readonly');
    const req = tx.objectStore(store).get(id);
    req.onsuccess = ()=> resolve(req.result || null);
    req.onerror = (e)=> reject(e.target.error);
  });
}

async function dbPut(store, obj){
  const db = await abrirDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(store,'readwrite');
    tx.objectStore(store).put(obj);
    tx.oncomplete = ()=> resolve(obj);
    tx.onerror = (e)=> reject(e.target.error);
  });
}

async function dbDelete(store, id){
  const db = await abrirDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction(store,'readwrite');
    tx.objectStore(store).delete(id);
    tx.oncomplete = ()=> resolve();
    tx.onerror = (e)=> reject(e.target.error);
  });
}

function gerarId(){
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
}

// ---- Customizações dos protocolos (itens a avaliar / sinais de alarme editados pelo usuário) ----
let protocolosCustom = {}; // { [chave]: { obrigatorios:[...], riscos:[...] } } — só entra aqui o que foi editado

async function carregarProtocolosCustom(){
  try{
    const reg = await dbGet('configuracoes', 'protocolos_customizados');
    protocolosCustom = (reg && reg.valor) || {};
  }catch(e){
    protocolosCustom = {};
  }
  return protocolosCustom;
}

async function salvarProtocolosCustom(){
  await dbPut('configuracoes', { chave:'protocolos_customizados', valor: protocolosCustom, atualizadoEm: new Date().toISOString() });
  if(window.enviarConfigParaSupabase){
    window.enviarConfigParaSupabase('protocolos_customizados', protocolosCustom).catch(()=>{});
  }
}

// Retorna o protocolo "efetivo": os campos fixos (label, fonte, etc.) do padrão + obrigatorios/riscos
// customizados pelo usuário, se houver. Use esta função em vez de ler CONSULTAS_PADRAO[chave] direto
// em qualquer lugar que lide com itens a avaliar / sinais de alarme.
function protocoloEfetivo(chave){
  const base = CONSULTAS_PADRAO[chave];
  if(!base) return null;
  const custom = protocolosCustom[chave];
  if(!custom) return base;
  return {
    ...base,
    obrigatorios: custom.obrigatorios !== undefined ? custom.obrigatorios : base.obrigatorios,
    riscos: custom.riscos !== undefined ? custom.riscos : base.riscos,
  };
}

// ---- Modelo padrão de um paciente/registro novo ----
function novoPaciente({ nome, leito, contexto, genero }){
  return {
    id: gerarId(),
    nome, leito, contexto, genero: genero || 'F',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    ativo: true,

    infoFixa: { alergias:'', atb:'', invasoes:'', infusoes:'', vent:'AA', diurese:'Espontânea', hpp:'', muc:'', tabagismo:false, etilismo:false, hsocLivre:'' },
    ih:'', mih:'',
    queixas: {}, // { key: { on:true, detalhe:'' } }
    queixasLivre:'',
    exameFisico: { normal:true, alterados:{} }, // alterados: { key: { on:true, texto:'' } }
    observacoesLivres:'',
    labBlocos: [], // { id, data, hora, valores:{}, brutoOriginal }
    examesImagem:'',
    ultimas24h:{ pa:'', fc:'', fr:'', tax:'', hgt:'', diurese:'', funcaoIntestinal:'', balancoHidrico:'' },
    ssvv:{ pa:'', bpm:'', irpm:'', sat:'' },
    impressao:'', conduta:'',

    qp:'',
    hdaDetalhada:{ inicio:'', evolucao:'', localizacao:'', intensidade:'', duracao:'', sintomasAssociados:'', fatoresMelhora:'', fatoresPiora:'', tratamentos:'', impacto:'' },
    hppDetalhada:{ doencasPrevias:'', cirurgias:'', alergias:'', medicamentos:'' },

    subjetivo:'', avaliacao:'', plano:'',
    ocupacao:'', atividadeFisica:{ pratica:null, detalhe:'' },
    tipoConsulta:'', consultaChecklist:{}, riscoChecklist:{}, protocoloDados:{},
    protocoloHAS:{ pa1:'', pa2:'', eas:'', glicemiaJejum:'', sodio:'', potassio:'', creatinina:'', tfg:'',
                   colesterolTotal:'', hdl:'', triglicerideos:'', fundoscopia:'', ecg:'',
                   orientacaoEstiloVida:{ feita:null, detalhe:'' },
                   examesSolicitados:null, _planoAutoTextoExames:'' },

    evolucaoGerada:'',
  };
}

async function listarPacientesAtivos(){
  const todos = await dbGetAll('pacientes');
  return todos.filter(p=>p.ativo).sort((a,b)=> b.atualizadoEm.localeCompare(a.atualizadoEm));
}
async function listarTodosPacientes(){
  const todos = await dbGetAll('pacientes');
  return todos.sort((a,b)=> b.atualizadoEm.localeCompare(a.atualizadoEm));
}

async function salvarPaciente(p){
  p.atualizadoEm = new Date().toISOString();
  await dbPut('pacientes', p);
  enfileirarSync(p);
  return p;
}

async function arquivarPaciente(id){
  const p = await dbGet('pacientes', id);
  if(!p) return;
  p.ativo = false;
  await salvarPaciente(p);
}

// ---- Exclusão definitiva, com fila de pendências (evita "ressurreição" via sync) ----
async function marcarExclusaoPendente(id){
  const db = await abrirDB();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction('fila_sync','readwrite');
    tx.objectStore('fila_sync').put({ id: 'del_'+id, tipo:'delete', pacienteId:id, criadoEm: Date.now() });
    tx.oncomplete = ()=> resolve();
    tx.onerror = (e)=> reject(e.target.error);
  });
}
async function listarExclusoesPendentes(){
  const todos = await dbGetAll('fila_sync');
  return todos.filter(x=>x.tipo === 'delete');
}
async function removerExclusaoPendente(pacienteId){
  await dbDelete('fila_sync', 'del_'+pacienteId);
}

async function excluirPacienteDefinitivo(id){
  await dbDelete('pacientes', id);
  await marcarExclusaoPendente(id);
  await processarExclusoesPendentes();
}

async function processarExclusoesPendentes(){
  if(!navigator.onLine || !window.excluirDoSupabase) return;
  const pendentes = await listarExclusoesPendentes();
  for(const item of pendentes){
    try{
      await window.excluirDoSupabase(item.pacienteId);
      await removerExclusaoPendente(item.pacienteId);
    }catch(e){
      console.warn('Exclusão pendente ainda não confirmada no servidor:', e.message);
    }
  }
}
window.addEventListener('online', processarExclusoesPendentes);

// ---- Fila de sincronização (placeholder — plugamos o Supabase depois) ----
let syncPendentes = 0;
function enfileirarSync(paciente){
  syncPendentes++;
  atualizarIndicadorSync();
  // Quando o Supabase estiver configurado, aqui disparamos o envio real.
  if(window.enviarParaSupabase){
    window.enviarParaSupabase(paciente).then(()=>{
      syncPendentes = Math.max(0, syncPendentes-1);
      atualizarIndicadorSync();
    }).catch(()=>{ atualizarIndicadorSync(); });
  }
}
function atualizarIndicadorSync(){
  const dot = document.getElementById('syncDot');
  if(!dot) return;
  if(!navigator.onLine){ dot.className='syncdot'; dot.title='Offline'; return; }
  if(syncPendentes > 0){ dot.className='syncdot pending'; dot.title='Sincronizando...'; return; }
  dot.className='syncdot online'; dot.title='Sincronizado';
}
window.addEventListener('online', atualizarIndicadorSync);
window.addEventListener('offline', atualizarIndicadorSync);
