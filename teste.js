(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

  // CSS
  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: absolute;
      top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 15px;
      border-radius: 10px;
      z-index: 9999;
      font-family: Arial, sans-serif;
      width: 280px;
      box-shadow: 0 0 10px rgba(0,0,0,0.4);
      cursor: move;
    }
    #doubleBlackPainel h1 {
      margin: 0 0 10px; font-size: 16px; text-align: center;
    }
    #sugestaoBox {
      padding: 10px;
      text-align: center;
      font-weight: bold;
      border-radius: 8px;
      background-color: #222;
      margin-bottom: 10px;
    }
    #historicoBox {
      display: flex;
      gap: 4px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    .bolaHist {
      width: 20px; height: 20px;
      border-radius: 50%;
    }
    .pretoHist { background: black; }
    .vermelhoHist { background: red; }
    .brancoHist { background: white; border: 1px solid #999; }
    #acertosBox {
      text-align: center;
      font-size: 14px;
      margin-top: 5px;
    }
  `;
  document.head.appendChild(style);

  // HTML Painel
  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
  `;
  document.body.appendChild(painel);

  // Tornar Painel Arrastável
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
  let acertos = 0;
  let erros = 0;

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
    if (h.length < 5) return { cor: "#333", texto: "⌛ Coletando dados...", previsao: null };

    const ult3 = h.slice(0, 3);
    const ult5 = h.slice(0, 5);
    const ult10 = h.slice(0, 10);
    const totalBrancos = h.filter(n => n === 0).length;

    if (ult3.every(n => n === 1)) return { cor: "black", texto: "🔁 Inversão: Apostar Preto", previsao: 2 };
    if (ult3.every(n => n === 2)) return { cor: "red", texto: "🔁 Inversão: Apostar Vermelho", previsao: 1 };

    const pretos = ult10.filter(n => n === 2).length;
    const vermelhos = ult10.filter(n => n === 1).length;
    if (pretos >= 7) return { cor: "red", texto: "📊 Tendência Preto → Vermelho", previsao: 1 };
    if (vermelhos >= 7) return { cor: "black", texto: "📊 Tendência Vermelho → Preto", previsao: 2 };

    const ult20 = h.slice(0, 20);
    if (!ult20.includes(0)) return { cor: "white", texto: "⚪️ Alerta de Branco", previsao: 0 };

    return pretos > vermelhos
      ? { cor: "red", texto: "🤖 Probabilidade: Vermelho", previsao: 1 }
      : { cor: "black", texto: "🤖 Probabilidade: Preto", previsao: 2 };
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
