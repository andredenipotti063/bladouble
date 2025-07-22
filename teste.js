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
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
  `;
  document.body.appendChild(painel);

  // Movimento do painel
  let isDragging = false, offsetX = 0, offsetY = 0;
  painel.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - painel.offsetLeft;
    offsetY = e.clientY - painel.offsetTop;
  });
  document.addEventListener("mouseup", () => isDragging = false);
  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      painel.style.left = e.clientX - offsetX + "px";
      painel.style.top = e.clientY - offsetY + "px";
    }
  });

  const historico = [];
  let ultimoId = null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;

  // Memória dos padrões no navegador
  const memoria = JSON.parse(localStorage.getItem("memoriaBlaze") || "{}");

  function salvarMemoria() {
    localStorage.setItem("memoriaBlaze", JSON.stringify(memoria));
  }

  async function fetchLast() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color;
      const id = data[0]?.id;

      if (id && cor !== undefined && id !== ultimoId) {
        historico.unshift(cor);
        if (historico.length > 50) historico.pop();

        // Aprendizado se houver previsão anterior
        if (ultimaPrevisao !== null) {
          const input = historico.slice(1, 6).join("-");
          if (!memoria[input]) memoria[input] = { "0": 0, "1": 0, "2": 0 };
          memoria[input][cor]++;
          salvarMemoria();

          if (cor === ultimaPrevisao) acertos++;
          else erros++;
        }

        ultimoId = id;
        atualizarPainel();
      }
    } catch (e) {
      console.error("❌ Erro ao buscar API:", e);
    }
  }

  function prever(h) {
    if (h.length < 6) return { cor: "#333", texto: "⌛ Coletando dados...", previsao: null };

    const entrada = h.slice(0, 5).join("-");
    const padrao = memoria[entrada];
    if (padrao) {
      const max = Object.entries(padrao).reduce((a, b) => (b[1] > a[1] ? b : a));
      const cor = max[0];
      const corNome = cor == 0 ? "⚪️ Branco" : cor == 1 ? "🔴 Vermelho" : "⚫ Preto";
      const corHex = cor == 0 ? "white" : cor == 1 ? "red" : "black";
      return { cor: corHex, texto: `🧠 Padrão detectado: ${corNome}`, previsao: Number(cor) };
    }

    return { cor: "#666", texto: "🤖 Aguardando aprender padrão...", previsao: null };
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
