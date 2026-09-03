// ===================== SUPABASE: AUTH + SYNC =====================
const SUPABASE_URL = 'https://lyxwckflcnbpsrjqyuou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5eHdja2ZsY25icHNyanF5dW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzODU4ODMsImV4cCI6MjEwMzk2MTg4M30.eUbhfOKtIaxjKxWkgKm4Zt8XSjvGOPAahOMqylxowAc';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let authTab = 'login';
function setAuthTab(t){
  authTab = t;
  document.getElementById('tabLogin').classList.toggle('on', t==='login');
  document.getElementById('tabSignup').classList.toggle('on', t==='signup');
  document.getElementById('authSubmitBtn').textContent = t==='login' ? 'Entrar' : 'Criar conta';
  document.getElementById('authErr').textContent = '';
  document.getElementById('authMsg').textContent = '';
}

async function submitAuth(){
  const email = document.getElementById('authEmail').value.trim();
  const pass = document.getElementById('authPass').value;
  const errEl = document.getElementById('authErr');
  const msgEl = document.getElementById('authMsg');
  errEl.textContent = ''; msgEl.textContent = '';
  if(!email || !pass){ errEl.textContent = 'Preencha e-mail e senha.'; return; }

  const btn = document.getElementById('authSubmitBtn');
  btn.disabled = true;
  try{
    if(authTab === 'login'){
      const { error } = await sb.auth.signInWithPassword({ email, password: pass });
      if(error) throw error;
    } else {
      const { error } = await sb.auth.signUp({ email, password: pass });
      if(error) throw error;
      msgEl.textContent = 'Conta criada! Se pedir confirmação por e-mail, confirme e depois entre.';
    }
  }catch(e){
    errEl.textContent = traduzErroAuth(e.message);
  }finally{
    btn.disabled = false;
  }
}
function traduzErroAuth(msg){
  if(/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if(/already registered/i.test(msg)) return 'Este e-mail já tem conta — tente entrar.';
  if(/password.*6/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.';
  return msg;
}

let usuarioAtual = null;

sb.auth.onAuthStateChange((event, session)=>{
  usuarioAtual = session ? session.user : null;
  mostrarTelaCorreta();
});

async function mostrarTelaCorreta(){
  const { data:{ session } } = await sb.auth.getSession();
  usuarioAtual = session ? session.user : null;
  if(usuarioAtual){
    document.getElementById('authScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    await sincronizarAoEntrar();
    render();
  } else {
    document.getElementById('authScreen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  }
}

async function sairDaConta(){
  await sb.auth.signOut();
}

// ---- Sync: envia um paciente para o Supabase ----
window.enviarParaSupabase = async function(paciente){
  if(!usuarioAtual) throw new Error('sem sessão');
  const { error } = await sb.from('pacientes').upsert({
    id: paciente.id,
    user_id: usuarioAtual.id,
    data: paciente,
    ativo: paciente.ativo,
    atualizado_em: paciente.atualizadoEm,
  });
  if(error) throw error;
};

window.excluirDoSupabase = async function(id){
  if(!usuarioAtual) return;
  const { error } = await sb.from('pacientes').delete().eq('id', id);
  if(error) throw error;
};

// ---- Sync: ao entrar, busca os pacientes ativos do Supabase e mescla com o local ----
async function sincronizarAoEntrar(){
  if(!navigator.onLine) return;
  await processarExclusoesPendentes(); // tenta confirmar exclusões que ficaram pendentes
  try{
    const pendentes = new Set((await listarExclusoesPendentes()).map(x=>x.pacienteId));
    const { data: remotos, error } = await sb.from('pacientes').select('*').eq('ativo', true);
    if(error) throw error;
    for(const r of (remotos||[])){
      if(pendentes.has(r.id)) continue; // ainda não confirmamos a exclusão no servidor — não readiciona local
      const local = await dbGet('pacientes', r.id);
      if(!local || new Date(r.atualizado_em) > new Date(local.atualizadoEm)){
        await dbPut('pacientes', r.data);
      }
    }
    // reenvia qualquer coisa que ficou só local (ex: criada offline)
    const locais = await dbGetAll('pacientes');
    for(const p of locais){
      if(p.ativo && !(remotos||[]).find(r=>r.id===p.id)){
        await window.enviarParaSupabase(p);
      }
    }
  }catch(e){
    console.warn('Sync inicial falhou (seguindo offline):', e.message);
  }
}

mostrarTelaCorreta();
