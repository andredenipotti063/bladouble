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
  let ultimaEntrada = null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;

  // IA simples: memória de padrões aprendidos
  const memoria = JSON.parse(localStorage.getItem("memoriaBlaze") || "{}");

  function salvarMemoria() {
    localStorage.setItem("memoriaBlaze", JSON.stringify(memoria));
  }

  async function treinarInicial() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/100");
      const data = await res.json();
      const lista = data.map(g => g.color).reverse();

      for (let i = 0; i < lista.length - 5; i++) {
        const entrada = lista.slice(i, i + 5).join("-");
        const saida = lista[i + 5];
        if (!memoria[entrada]) memoria[entrada] = { "0": 0, "1": 0, "2": 0 };
        memoria[entrada][saida]++;
      }
      salvarMemoria();
      console.log("✅ Treinamento inicial concluído.");
    } catch (e) {
      console.error("Erro no treinamento inicial:", e);
    }
  }

  function preverIA(h) {
    if (h.length < 5) return { cor: "#333", texto: "⌛ Coletando dados...", previsao: null };

    const entrada = h.slice(0, 5).join("-");
    const saida = memoria[entrada];

    if (!saida) return { cor: "#333", texto: "🔍 Aguardando aprender padrão", previsao: null };

    const maisProvavel = Object.entries(saida).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    const cor = maisProvavel === "0" ? "white" : maisProvavel === "1" ? "red" : "black";
    const label = maisProvavel === "0" ? "⚪️ Alerta de Branco" :
                  maisProvavel === "1" ? "🤖 IA: Apostar Vermelho" :
                  "🤖 IA: Apostar Preto";

    return { cor, texto: label, previsao: parseInt(maisProvavel) };
  }

  function atualizarPainel() {
    const ult = historico.slice(0, 12);
    const { cor, texto, previsao } = preverIA(historico);
    ultimaPrevisao = previsao;
    ultimaEntrada = historico.slice(0, 5).join("-");

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

  async function fetchLast() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color;
      const id = data[0]?.id;

      if (id && cor !== undefined && id !== ultimoId) {
        historico.unshift(cor);
        if (historico.length > 100) historico.pop();

        if (ultimaPrevisao !== null && ultimaEntrada) {
          if (!memoria[ultimaEntrada]) memoria[ultimaEntrada] = { "0": 0, "1": 0, "2": 0 };
          memoria[ultimaEntrada][cor]++;
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

  await treinarInicial();
  await fetchLast();
  setInterval(fetchLast, 3000);
})();
