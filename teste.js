(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

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

  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
  `;
  document.body.appendChild(painel);

  let isDragging = false, startX, startY, initialLeft, initialTop;
  function onDragStart(x, y) {
    isDragging = true;
    startX = x; startY = y;
    initialLeft = painel.offsetLeft; initialTop = painel.offsetTop;
  }
  function onDragMove(x, y) {
    if (!isDragging) return;
    const dx = x - startX, dy = y - startY;
    painel.style.left = initialLeft + dx + "px";
    painel.style.top = initialTop + dy + "px";
  }
  painel.addEventListener("mousedown", e => { e.preventDefault(); onDragStart(e.clientX, e.clientY); });
  document.addEventListener("mousemove", e => onDragMove(e.clientX, e.clientY));
  document.addEventListener("mouseup", () => isDragging = false);
  painel.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      onDragStart(t.clientX, t.clientY);
    }
  }, { passive: false });
  document.addEventListener("touchmove", e => {
    if (isDragging && e.touches.length === 1) {
      const t = e.touches[0];
      onDragMove(t.clientX, t.clientY);
    }
  }, { passive: false });
  document.addEventListener("touchend", () => isDragging = false);

  const historico = [];
  let ultimoId = null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;
  let errosSeguidos = { 1: 0, 2: 0 };

  async function fetchLast() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color;
      const id = data[0]?.id;

      if (id && cor !== undefined && id !== ultimoId) {
        historico.unshift(cor);
        if (historico.length > 50) historico.pop();

        if (ultimaPrevisao !== null) {
          if (cor === ultimaPrevisao || cor === 0) {
            acertos++;
            if (ultimaPrevisao !== 0) errosSeguidos[ultimaPrevisao] = 0;
          } else {
            erros++;
            if (ultimaPrevisao !== 0) errosSeguidos[ultimaPrevisao]++;
          }
        }

        ultimoId = id;
        atualizarPainel();
      }
    } catch (e) {
      console.error("❌ Erro ao buscar API:", e);
    }
  }

  function prever(h) {
    if (h.length < 10) return { cor: "#333", texto: "⌛ Coletando dados...", previsao: null };

    const ult10 = h.slice(0, 10);
    const ult40 = h.slice(0, 40);
    const count = (arr, val) => arr.filter(n => n === val).length;

    // ⚪ Se não saiu branco nas últimas 40
    if (!ult40.includes(0) && ultimaPrevisao !== 0)
      return { cor: "white", texto: "⚪️ Alerta de Branco: Apostar no Branco!", previsao: 0 };

    // Detectar alternância tipo: 1,2,1,2,1
    let alterna = true;
    for (let i = 1; i < 5; i++) {
      if (h[i] === h[i - 1]) {
        alterna = false;
        break;
      }
    }
    if (alterna) {
      return { cor: "#444", texto: "❌ Padrão instável (zig-zag). Melhor não apostar.", previsao: null };
    }

    // Ponderação (últimos mais importantes)
    let score = { 1: 0, 2: 0 };
    for (let i = 0; i < 10; i++) {
      const peso = 10 - i;
      if (ult10[i] === 1) score[1] += peso;
      else if (ult10[i] === 2) score[2] += peso;
    }

    // Se diferença é pequena, evita apostar
    const diff = Math.abs(score[1] - score[2]);
    if (diff < 5) {
      return { cor: "#555", texto: "🤔 Sem tendência clara. Aposte apenas no ⚪", previsao: 0 };
    }

    // Decide com base na maior pontuação
    const melhor = score[1] > score[2] ? 1 : 2;

    // Evita repetir cor com 2+ erros seguidos
    if (errosSeguidos[melhor] >= 2) {
      return { cor: "#666", texto: `🚫 ${melhor === 1 ? 'Vermelho' : 'Preto'} errou 2x. Pausando... ⚪`, previsao: 0 };
    }

    return {
      cor: melhor === 1 ? "red" : "black",
      texto: `✅ Apostar: ${melhor === 1 ? "Vermelho" : "Preto"} + ⚪`,
      previsao: melhor
    };
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
      el.className = "bolaHist " + (n === 0 ? "brancoHist" : n === 2 ? "pretoHist" : "vermelhoHist");
      box.appendChild(el);
    });

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  await fetchLast();
  setInterval(fetchLast, 3000);
})();
