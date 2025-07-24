(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

  // ESTILO
  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: fixed; top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 15px; border-radius: 10px;
      z-index: 9999; font-family: Arial, sans-serif;
      width: 280px; box-shadow: 0 0 10px rgba(0,0,0,0.4); cursor: move;
    }
    #doubleBlackPainel h1 { margin: 0 0 10px; font-size: 16px; text-align: center; }
    #sugestaoBox {
      padding: 10px; text-align: center;
      font-weight: bold; border-radius: 8px;
      background-color: #222; margin-bottom: 10px;
      font-size: 14px;
    }
    #historicoBox {
      display: flex; gap: 4px; justify-content: center;
      flex-wrap: wrap; margin-bottom: 10px;
    }
    .bolaHist { width: 20px; height: 20px; border-radius: 50%; }
    .pretoHist { background: black; }
    .vermelhoHist { background: red; }
    .brancoHist { background: white; border: 1px solid #999; }
    #acertosBox { text-align: center; font-size: 14px; margin-top: 5px; }
  `;
  document.head.appendChild(style);

  // HTML PAINEL
  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Previsão Aprimorada</h1>
    <div id="sugestaoBox">⏳ Carregando Histórico...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
  `;
  document.body.appendChild(painel);

  // Lógica de arrastar o painel (completa)
  let isDragging = false, startX, startY, initialLeft, initialTop;
  const onDragStart = (x, y) => { isDragging = true; startX = x; startY = y; initialLeft = painel.offsetLeft; initialTop = painel.offsetTop; };
  const onDragMove = (x, y) => { if (!isDragging) return; const dx = x - startX, dy = y - startY; painel.style.left = `${initialLeft + dx}px`; painel.style.top = `${initialTop + dy}px`; };
  const onDragEnd = () => { isDragging = false; };
  painel.addEventListener("mousedown", (e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); });
  document.addEventListener("mousemove", (e) => onDragMove(e.clientX, e.clientY));
  document.addEventListener("mouseup", onDragEnd);
  painel.addEventListener("touchstart", (e) => { if (e.touches.length === 1) { const t = e.touches[0]; onDragStart(t.clientX, t.clientY); e.preventDefault(); } });
  document.addEventListener("touchmove", (e) => { if (isDragging && e.touches.length === 1) { onDragMove(e.touches[0].clientX, e.touches[0].clientY); } });
  document.addEventListener("touchend", onDragEnd);

  // --- LÓGICA PRINCIPAL ---
  const historico = [];
  let ultimoId = null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;

  // FUNÇÃO DE PREVISÃO (sem alterações)
  function prever(h) {
    if (h.length < 10) return { cor: "#333", texto: "⌛ Coletando dados...", previsao: null };
    const count = (arr, val) => arr.filter(n => n === val).length;
    const ult35 = h.slice(0, 35);
    if (!ult35.includes(0) && ultimaPrevisao !== 0) return { cor: "white", texto: "🎯 ALVO: APOSTAR BRANCO", previsao: 0 };
    const coresRecentes = h.filter(c => c !== 0).slice(0, 4);
    if (coresRecentes.length === 4) {
      if (coresRecentes.every(n => n === 2)) return { cor: "red", texto: "🔁 Inversão: Apostar Vermelho", previsao: 1 };
      if (coresRecentes.every(n => n === 1)) return { cor: "black", texto: "🔁 Inversão: Apostar Preto", previsao: 2 };
    }
    const ult10Cores = h.filter(c => c !== 0).slice(0, 10);
    const pretos10 = count(ult10Cores, 2);
    const vermelhos10 = count(ult10Cores, 1);
    if (pretos10 >= 7) return { cor: "black", texto: "📈 Tendência: Manter no Preto", previsao: 2 };
    if (vermelhos10 >= 7) return { cor: "red", texto: "📈 Tendência: Manter no Vermelho", previsao: 1 };
    const ultimaCorValida = h.find(c => c === 1 || c === 2);
    return ultimaCorValida === 2 ? { cor: "red", texto: "🤖 Padrão: Apostar Vermelho", previsao: 1 } : { cor: "black", texto: "🤖 Padrão: Apostar Preto", previsao: 2 };
  }
  
  // ATUALIZA A INTERFACE
  function atualizarPainel() {
    const { cor, texto, previsao } = prever(historico);
    ultimaPrevisao = previsao;

    const sugestao = document.getElementById("sugestaoBox");
    sugestao.textContent = texto;
    sugestao.style.background = cor;
    sugestao.style.color = cor === "white" ? "#000" : "#fff";

    const box = document.getElementById("historicoBox");
    box.innerHTML = historico.slice(0, 15).map(n => {
        const corClasse = n === 0 ? "brancoHist" : n === 2 ? "pretoHist" : "vermelhoHist";
        return `<div class="bolaHist ${corClasse}"></div>`;
    }).join('');

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  // FUNÇÃO QUE PROCESSA UM NOVO RESULTADO
  function processarNovoResultado(novoResultado) {
      if (!novoResultado || !novoResultado.id || novoResultado.id === ultimoId) {
          return false; // Sem resultado novo ou ID repetido
      }
      
      historico.unshift(novoResultado.color);
      if (historico.length > 50) historico.pop();

      if (ultimaPrevisao !== null) {
          const acertouPrevisao = (novoResultado.color === ultimaPrevisao);
          const protegidoNoBranco = (novoResultado.color === 0 && (ultimaPrevisao === 1 || ultimaPrevisao === 2));
          if (acertouPrevisao || protegidoNoBranco) {
              acertos++;
          } else {
              erros++;
          }
      }
      
      ultimoId = novoResultado.id;
      return true; // Um novo resultado foi processado
  }

  // --- NOVAS FUNÇÕES DE INICIALIZAÇÃO E ATUALIZAÇÃO ---

  // 1. CARREGA O HISTÓRICO INICIAL
  async function carregarHistoricoInicial() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent");
      const data = await res.json();
      if (data && data.length > 0) {
        // Limpa o histórico antes de popular
        historico.length = 0; 
        for(const item of data.reverse()) { // Inverte para popular do mais antigo ao mais novo
            historico.unshift(item.color);
        }
        ultimoId = data[data.length - 1].id;
        console.log(`Histórico inicial carregado com ${historico.length} resultados.`);
        atualizarPainel();
      }
    } catch (e) {
      document.getElementById("sugestaoBox").textContent = "❌ Erro ao carregar.";
      console.error("Erro ao carregar histórico inicial:", e);
    }
  }

  // 2. VERIFICA APENAS O ÚLTIMO RESULTADO (para o loop)
  async function verificarUltimo() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      if (processarNovoResultado(data[0])) {
        atualizarPainel(); // Atualiza o painel somente se houver uma novidade
      }
    } catch (e) {
      console.error("Erro ao verificar último resultado:", e);
    }
  }

  // INICIA O SCRIPT
  await carregarHistoricoInicial();
  setInterval(verificarUltimo, 3500); // Verifica por novidades a cada 3.5 segundos

})();
