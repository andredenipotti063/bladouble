(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

  // ESTILO
  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: absolute; top: 30px; left: 30px;
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
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
  `;
  document.body.appendChild(painel);

  // Movimento do painel (mouse + toque)
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  function onDragStart(x, y) {
    isDragging = true;
    startX = x;
    startY = y;
    initialLeft = painel.offsetLeft;
    initialTop = painel.offsetTop;
  }

  function onDragMove(x, y) {
    if (!isDragging) return;
    const dx = x - startX;
    const dy = y - startY;
    painel.style.left = `${initialLeft + dx}px`;
    painel.style.top = `${initialTop + dy}px`;
  }
  
  painel.addEventListener("mousedown", (e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); });
  document.addEventListener("mousemove", (e) => onDragMove(e.clientX, e.clientY));
  document.addEventListener("mouseup", () => isDragging = false);
  painel.addEventListener("touchstart", (e) => { if (e.touches.length === 1) { const touch = e.touches[0]; onDragStart(touch.clientX, touch.clientY); e.preventDefault(); } });
  document.addEventListener("touchmove", (e) => { if (isDragging && e.touches.length === 1) { const touch = e.touches[0]; onDragMove(touch.clientX, touch.clientY); } });
  document.addEventListener("touchend", () => isDragging = false);

  // Lógica de previsão
  const historico = [];
  let ultimoId = null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;

  async function fetchLast() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color;
      const id = data[0]?.id;

      if (id && cor !== undefined && id !== ultimoId) {
        historico.unshift(cor);
        if (historico.length > 50) historico.pop();

        // LÓGICA DE ACERTOS COM PROTEÇÃO NO BRANCO
        if (ultimaPrevisao !== null) {
          const acertouPrevisao = (cor === ultimaPrevisao);
          const protegidoNoBranco = (cor === 0 && (ultimaPrevisao === 1 || ultimaPrevisao === 2));

          if (acertouPrevisao || protegidoNoBranco) {
            acertos++;
          } else {
            erros++;
          }
        }

        ultimoId = id;
        atualizarPainel();
      }
    } catch (e) {
      console.error("❌ Erro ao buscar API:", e);
    }
  }

  // --- LÓGICA DE PREVISÃO MELHORADA ---
  function prever(h) {
    if (h.length < 10) return { cor: "#333", texto: "⌛ Coletando dados...", previsao: null };

    const count = (arr, val) => arr.filter(n => n === val).length;

    // REGRA 1: ALVO NO BRANCO (Prioridade Máxima)
    const ult35 = h.slice(0, 35);
    if (!ult35.includes(0) && ultimaPrevisao !== 0) {
      return { cor: "white", texto: "🎯 ALVO: APOSTAR BRANCO", previsao: 0 };
    }

    // REGRA 2: INVERSÃO DE SEQUÊNCIA
    const coresRecentes = h.filter(c => c !== 0).slice(0, 4);
    if (coresRecentes.length === 4) {
      if (coresRecentes.every(n => n === 2)) return { cor: "red", texto: "🔁 Inversão: Apostar Vermelho", previsao: 1 };
      if (coresRecentes.every(n => n === 1)) return { cor: "black", texto: "🔁 Inversão: Apostar Preto", previsao: 2 };
    }
    
    // REGRA 3: SEGUIR A TENDÊNCIA FORTE (NOVA)
    const ult10Cores = h.filter(c => c !== 0).slice(0, 10);
    const pretos10 = count(ult10Cores, 2);
    const vermelhos10 = count(ult10Cores, 1);
    if (pretos10 >= 7) return { cor: "black", texto: "📈 Tendência: Manter no Preto", previsao: 2 };
    if (vermelhos10 >= 7) return { cor: "red", texto: "📈 Tendência: Manter no Vermelho", previsao: 1 };
    
    // REGRA 4: ESTRATÉGIA PADRÃO (Oposto ao último)
    const ultimaCorValida = h.find(c => c === 1 || c === 2);
    if (ultimaCorValida === 2) { // Se o último foi preto
        return { cor: "red", texto: "🤖 Padrão: Apostar Vermelho", previsao: 1 };
    } else { // Se o último foi vermelho
        return { cor: "black", texto: "🤖 Padrão: Apostar Preto", previsao: 2 };
    }
  }

  function atualizarPainel() {
    const ult = historico.slice(0, 12);
    const { cor, texto, previsao } = prever(historico);
    ultimaPrevisao = previsao;

    const sugestao = document.getElementById("sugestaoBox");
    sugestao.textContent = texto;
    sugestao.style.background = cor;
    sugestao.style.color = cor === "white" ? "#000" : "#fff";

    const box = document.getElementById("historicoBox");
    box.innerHTML = "";
    ult.forEach(n => {
      const el = document.createElement("div");
      const corClasse = n === 0 ? "brancoHist" : n === 2 ? "pretoHist" : "vermelhoHist";
      el.className = `bolaHist ${corClasse}`;
      box.appendChild(el);
    });

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  await fetchLast();
  setInterval(fetchLast, 3000);
})();
