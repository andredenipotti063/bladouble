(function () {
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
      width: 260px;
      box-shadow: 0 0 10px rgba(0,0,0,0.4);
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
    }
    .bolaHist {
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }
    .pretoHist { background: black; }
    .vermelhoHist { background: red; }
    .brancoHist { background: white; border: 1px solid #999; }
  `;
  document.head.appendChild(style);

  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">Carregando...</div>
    <div id="historicoBox"></div>
  `;
  document.body.appendChild(painel);

  async function getHistorico() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/50");
      const data = await res.json();
      return data.map(j => j.color); // color: 0=branco, 1=vermelho, 2=preto
    } catch (e) {
      console.error("Erro ao obter histórico:", e);
      return [];
    }
  }

  function prever(ultimos) {
    const u5 = ultimos.slice(0, 5);
    const u10 = ultimos.slice(0, 10);
    const branco10 = u10.filter(n => n === 0).length;
    const preto10 = u10.filter(n => n === 2).length;
    const vermelho10 = u10.filter(n => n === 1).length;

    if (u5.every(n => n === 2)) return { cor: "red", texto: "🔁 Inversão: Apostar Vermelho" };
    if (u5.every(n => n === 1)) return { cor: "black", texto: "🔁 Inversão: Apostar Preto" };

    const alt = u5.map(n => n === 0 ? "b" : (n === 2 ? "p" : "v")).join('');
    if (/^(pv){2,}$|^(vp){2,}$/.test(alt)) {
      return ultimos[0] === 2
        ? { cor: "red", texto: "🔄 Alternância: Vermelho" }
        : { cor: "black", texto: "🔄 Alternância: Preto" };
    }

    if (preto10 >= 6) return { cor: "red", texto: "📊 Tendência Preto → Vermelho" };
    if (vermelho10 >= 6) return { cor: "black", texto: "📊 Tendência Vermelho → Preto" };

    const branco50 = ultimos.filter(n => n === 0).length;
    if (branco50 <= 1 && ultimos[0] !== 0) {
      return { cor: "white", texto: "⚪️ Branco possível (raro)" };
    }

    const contagem = { red: 0, black: 0 };
    u5.forEach(n => {
      if (n === 2) contagem.black++;
      if (n === 1) contagem.red++;
    });
    return contagem.black > contagem.red
      ? { cor: "black", texto: "🤖 Sugestão: Preto (probabilístico)" }
      : { cor: "red", texto: "🤖 Sugestão: Vermelho (probabilístico)" };
  }

  async function atualizarPainel() {
    const ultimos = await getHistorico();
    if (!ultimos.length) return;

    const { cor, texto } = prever(ultimos);

    const sugestao = document.getElementById("sugestaoBox");
    sugestao.textContent = texto;
    sugestao.style.background = cor === "white" ? "#eee" : cor;

    const histBox = document.getElementById("historicoBox");
    histBox.innerHTML = "";
    ultimos.slice(0, 12).forEach(n => {
      const el = document.createElement("div");
      el.className = "bolaHist " + (
        n === 0 ? "brancoHist" :
        n === 2 ? "pretoHist" : "vermelhoHist"
      );
      histBox.appendChild(el);
    });
  }

  setInterval(atualizarPainel, 3000);
  atualizarPainel(); // inicial
})();
