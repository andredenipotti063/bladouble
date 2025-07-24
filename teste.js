(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

  // STYLE
  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: fixed; top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 15px; border-radius: 10px;
      z-index: 9999; font-family: Arial, sans-serif;
      width: 280px; box-shadow: 0 0 10px rgba(0,0,0,0.4);
      user-select: none; cursor: move;
    }
    #doubleBlackPainel h1 { margin: 0 0 10px; font-size: 16px; text-align: center; }
    #sugestaoBox {
      padding: 10px; text-align: center;
      font-weight: bold; border-radius: 8px;
      background-color: #222; margin-bottom: 10px;
    }
    #historicoBox {
      display: flex; flex-wrap: wrap; justify-content: center;
      gap: 4px; margin-bottom: 10px;
    }
    .bolaHist {
      width: 20px; height: 20px;
      border-radius: 50%;
      border: 1px solid #333;
    }
    .pretoHist { background: black; }
    .vermelhoHist { background: red; }
    .brancoHist { background: white; border: 1px solid #999; }
    #acertosBox {
      text-align: center; font-size: 14px; margin-top: 5px;
    }
  `;
  document.head.appendChild(style);

  // HTML PANEL
  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
  `;
  document.body.appendChild(painel);

  // Movimentação (arrastar)
  let isDragging = false, startX, startY, startLeft, startTop;
  painel.addEventListener("mousedown", e => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = painel.offsetLeft;
    startTop = painel.offsetTop;
    e.preventDefault();
  });
  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    painel.style.left = startLeft + dx + "px";
    painel.style.top = startTop + dy + "px";
  });
  document.addEventListener("mouseup", () => isDragging = false);

  // Histórico
  const historico = [];
  let ultimoId = null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;

  async function fetchRodada() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color;
      const id = data[0]?.id;

      if (id && cor !== undefined && id !== ultimoId) {
        historico.unshift(cor);
        if (historico.length > 100) historico.pop();

        if (ultimaPrevisao !== null) {
          if (cor === ultimaPrevisao || cor === 0) acertos++;
          else erros++;
        }

        ultimoId = id;
        atualizarPainel();
      }
    } catch (e) {
      console.error("Erro ao buscar dados:", e);
    }
  }

  function preverCor(h) {
    if (h.length < 5)
      return { cor: "#333", texto: "⌛ Aguardando dados...", previsao: null };

    const ult = h.slice(0, 7);
    const ult50 = h.slice(0, 50);
    const count = (arr, val) => arr.filter(x => x === val).length;

    const pretos = count(ult, 2);
    const vermelhos = count(ult, 1);

    // Reversão após sequência
    if (ult.slice(0, 4).every(v => v === 2)) return { cor: "red", texto: "🔁 Inverter: Apostar Vermelho + ⚪", previsao: 1 };
    if (ult.slice(0, 4).every(v => v === 1)) return { cor: "black", texto: "🔁 Inverter: Apostar Preto + ⚪", previsao: 2 };

    // Tendência
    if (pretos >= 5) return { cor: "black", texto: "📈 Tendência: Preto + ⚪", previsao: 2 };
    if (vermelhos >= 5) return { cor: "red", texto: "📈 Tendência: Vermelho + ⚪", previsao: 1 };

    // Alerta de Branco
    if (!ult50.includes(0) && ultimaPrevisao !== 0)
      return { cor: "white", texto: "⚪ Alerta de Branco", previsao: 0 };

    // Probabilidade geral
    return pretos > vermelhos
      ? { cor: "red", texto: "🤖 Probabilidade: Vermelho + ⚪", previsao: 1 }
      : { cor: "black", texto: "🤖 Probabilidade: Preto + ⚪", previsao: 2 };
  }

  function atualizarPainel() {
    const ult = historico.slice(0, 12);
    const { cor, texto, previsao } = preverCor(historico);
    ultimaPrevisao = previsao;

    const sugestao = document.getElementById("sugestaoBox");
    sugestao.textContent = `✅ Apostar: ${texto}`;
    sugestao.style.background = cor;
    sugestao.style.color = cor === "white" ? "#000" : "#fff";

    const box = document.getElementById("historicoBox");
    box.innerHTML = "";
    ult.forEach(cor => {
      const el = document.createElement("div");
      el.className = "bolaHist " + (cor === 0 ? "brancoHist" : cor === 2 ? "pretoHist" : "vermelhoHist");
      box.appendChild(el);
    });

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  // Início
  await fetchRodada();
  setInterval(fetchRodada, 3000);
})();
