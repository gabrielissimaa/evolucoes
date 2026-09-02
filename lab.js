// ===================== PARSER DE LABORATÓRIO =====================
// Extrai data/hora e valores conhecidos (LAB_TODOS) de um texto colado.
// O resultado é sempre mostrado numa tabela editável antes de salvar —
// o parser é "best effort", não precisa ser perfeito.

function detectarDataHora(texto){
  // dd/mm/aaaa hh:mm  |  dd/mm hh:mm  |  dd/mm/aaaa  |  dd/mm
  const re = /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*(?:[àas\-\s]{0,4}(\d{1,2}):(\d{2}))?/i;
  const m = texto.match(re);
  if(!m) return { data: null, hora: null };
  const dia = m[1].padStart(2,'0');
  const mes = m[2].padStart(2,'0');
  let ano = m[3];
  if(ano && ano.length === 2) ano = '20'+ano;
  const data = ano ? `${dia}/${mes}/${ano}` : `${dia}/${mes}`;
  const hora = (m[4] && m[5]) ? `${m[4].padStart(2,'0')}:${m[5]}` : null;
  return { data, hora };
}

function normalizarNumero(str){
  // aceita 12,5 / 12.5 / 12.500 (milhar) -> mantém como veio, só troca vírgula por ponto p/ cálculo
  return str.replace(/\./g,'').replace(',', '.') === str.replace(',', '.')
    ? str.replace(',', '.')
    : str.replace(',', '.');
}

function parseLabText(texto){
  const { data, hora } = detectarDataHora(texto);
  const valores = {};
  const textoBusca = texto;

  for(const exame of LAB_TODOS){
    for(const alias of exame.aliases){
      // escapa caracteres especiais do alias
      const aliasEsc = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // label seguido de : = ou espaço, depois um número (com , ou .), opcionalmente "mil" ou %
      const re = new RegExp(`\\b${aliasEsc}\\b\\s*[:=\\-]?\\s*([\\d]+(?:[.,]\\d+)?)\\s*(mil|%|milhoes|milhões)?`, 'i');
      const m = textoBusca.match(re);
      if(m){
        let valor = m[1].replace(',', '.');
        if(m[2] && /mil/i.test(m[2])) valor += ' mil';
        valores[exame.key] = valor;
        break; // já achou esse exame, não precisa testar outros aliases
      }
    }
  }

  return { data, hora, valores, brutoOriginal: texto };
}

// Compara dois valores numéricos (ignora sufixo "mil") e retorna 'up' | 'down' | 'flat'
function compararTendencia(valorAtual, valorAnterior){
  if(valorAtual == null || valorAnterior == null) return null;
  const a = parseFloat(String(valorAtual).replace(',', '.'));
  const b = parseFloat(String(valorAnterior).replace(',', '.'));
  if(isNaN(a) || isNaN(b)) return null;
  const diffPct = Math.abs(a-b) / (b || 1);
  if(diffPct < 0.03) return 'flat'; // variação < 3% considera estável
  return a > b ? 'up' : 'down';
}

function iconeTendencia(t){
  if(t === 'up') return '🔺';
  if(t === 'down') return '🔻';
  if(t === 'flat') return '➖';
  return '';
}

// Ordena blocos de exame por data/hora (assume formato dd/mm/aaaa ou dd/mm)
function chaveOrdenavel(bloco){
  if(!bloco.data) return 0;
  const partes = bloco.data.split('/');
  let [d,mm,aaaa] = partes;
  if(!aaaa) aaaa = String(new Date().getFullYear());
  const h = bloco.hora ? bloco.hora.replace(':','') : '0000';
  return parseInt(`${aaaa}${mm.padStart(2,'0')}${d.padStart(2,'0')}${h.padStart(4,'0')}`, 10);
}

function ordenarBlocos(blocos){
  return [...blocos].sort((a,b)=> chaveOrdenavel(a) - chaveOrdenavel(b));
}

// Agrupa blocos com a mesma data cujo horário difere em menos de 2h,
// mantendo o valor mais recente de cada exame no grupo — usado na evolução.
function agruparParaEvolucao(blocos){
  const ordenados = ordenarBlocos(blocos);
  const grupos = [];
  for(const bloco of ordenados){
    const ultimo = grupos[grupos.length-1];
    if(ultimo && ultimo.data === bloco.data && diferencaHoras(ultimo.hora, bloco.hora) < 2){
      Object.assign(ultimo.valores, bloco.valores); // valores mais recentes sobrescrevem
      ultimo.hora = bloco.hora || ultimo.hora;
    } else {
      grupos.push({ data: bloco.data, hora: bloco.hora, valores: {...bloco.valores} });
    }
  }
  return grupos;
}

function diferencaHoras(h1, h2){
  if(!h1 || !h2) return 99;
  const [a1,b1] = h1.split(':').map(Number);
  const [a2,b2] = h2.split(':').map(Number);
  return Math.abs((a1*60+b1) - (a2*60+b2)) / 60;
}
