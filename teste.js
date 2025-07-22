(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: fixed;
      top: 30px;
      right: 30px;
      background: #111;
      color: #fff;
      padding: 15px;
      border-radius: 10px;
      z-index: 9999;
      font-family: Arial, sans-serif;
      width: 280px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
    }
    #doubleBlackPainel h1 {
      margin: 0 0 10px;
      font-size: 16px;
      text-align: center;
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
      width: 20px;
      height: 20px;
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

  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0</div>
  `;
  document.body.appendChild(painel);

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

        // Compara previsão anterior com resultado atual
        if (ultimaPrevisao !== null) {
          if (cor === ultimaPrevisao) acertos++;
          else erros++;
        }

        ultimoId = id;
        atualizarPainel();
      }
    } catch (e) {
      console.error("❌ Erro ao buscar a API:", e);
    }
  }

  function prever(ultimos) {
    if (ultimos.length < 5) return { cor: "#333", texto: "⌛ Coletando dados...", previsao: null };

    const u5 = ultimos.slice(0, 5);
    const p5 = u5.filter(n => n === 2).length;
    const v5 = u5.filter(n => n === 1).length;
    const bTot = ultimos.filter(n => n === 0).length;

    if (p5 >= 4) return { cor: "red", texto: "🔁 Inversão: Apostar Vermelho", previsao: 1 };
    if (v5 >= 4) return { cor: "black", texto: "🔁 Inversão: Apostar Preto", previsao: 2 };

    const p10 = ultimos.slice(0, 10).filter(n => n === 2).length;
    const v10 = ultimos.slice(0, 10).filter(n => n === 1).length;

    if (p10 >= 6) return { cor: "red", texto: "📊 Tendência Preto → Vermelho", previsao: 1 };
    if (v10 >= 6) return { cor: "black", texto: "📊 Tendência Vermelho → Preto", previsao: 2 };

    if (bTot <= 1 && ultimos[0] !== 0) return { cor: "white", texto: "⚪️ Branco possível", previsao: 0 };

    return p5 > v5
      ? { cor: "black", texto: "🤖 Probabilidade: Preto", previsao: 2 }
      : { cor: "red", texto: "🤖 Probabilidade: Vermelho", previsao: 1 };
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

    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros}`;
  }

  await fetchLast();
  setInterval(fetchLast, 3000);
})();
