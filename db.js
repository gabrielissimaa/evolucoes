// ===================== ARMAZENAMENTO (IndexedDB + fila de sync) =====================
const DB_NAME = 'visita-db';
const DB_VERSION = 1;
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
    tipoConsulta:'', consultaChecklist:{},

    evolucaoGerada:'',
  };
}

async function listarPacientesAtivos(){
  const todos = await dbGetAll('pacientes');
  return todos.filter(p=>p.ativo).sort((a,b)=> b.atualizadoEm.localeCompare(a.atualizadoEm));
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

async function excluirPacienteDefinitivo(id){
  await dbDelete('pacientes', id);
  if(window.excluirDoSupabase){
    try{ await window.excluirDoSupabase(id); }catch(e){ console.warn('Falha ao excluir remotamente:', e.message); }
  }
}

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
