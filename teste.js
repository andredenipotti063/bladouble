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

  function getHistorico(limit = 50) {
    const tiles = Array.from(document.querySelectorAll('[class*="tile"]')).slice(0, limit);
    return tiles.map(tile => {
      const classList = tile.className.toLowerCase();
      const numero = parseInt(tile.textContent.trim());
      if (classList.includes("white")) return 0;
      if (classList.includes("black")) return numero <= 7 ? numero : 1;
      if (classList.includes("red")) return numero >= 8 ? numero : 8;
      return 0;
    });
  }

  function prever(ultimos, ultimos50) {
    const u5 = ultimos.slice(0, 5);
    const u10 = ultimos.slice(0, 10);
    const branco10 = u10.filter(n => n === 0).length;
    const preto10 = u10.filter(n => n >= 1 && n <= 7).length;
    const vermelho10 = u10.filter(n => n >= 8).length;

    if (u5.every(n => n >= 1 && n <= 7)) return { cor: "red", texto: "🔁 Inversão: Apostar Vermelho" };
    if (u5.every(n => n >= 8)) return { cor: "black", texto: "🔁 Inversão: Apostar Preto" };

    const alt = u5.map(n => {
      if (n === 0) return 'b';
      return n <= 7 ? 'p' : 'v';
    }).join('');
    if (/^(pv){2,}$|^(vp){2,}$/.test(alt)) {
      const ult = ultimos[0];
      return ult <= 7
        ? { cor: "red", texto: "🔄 Alternância: Vermelho" }
        : { cor: "black", texto: "🔄 Alternância: Preto" };
    }

    if (preto10 >= 6) return { cor: "red", texto: "📊 Tendência Preto → Vermelho" };
    if (vermelho10 >= 6) return { cor: "black", texto: "📊 Tendência Vermelho → Preto" };

    const branco50 = ultimos50.filter(n => n === 0).length;
    if (branco50 <= 1 && ultimos[0] !== 0) {
      return { cor: "white", texto: "⚪️ Branco possível (raro)" };
    }

    const contagem = { red: 0, black: 0 };
    u5.forEach(n => {
      if (n >= 1 && n <= 7) contagem.black++;
      if (n >= 8) contagem.red++;
    });
    return contagem.black > contagem.red
      ? { cor: "black", texto: "🤖 Sugestão: Preto (probabilístico)" }
      : { cor: "red", texto: "🤖 Sugestão: Vermelho (probabilístico)" };
  }

  function atualizarPainel() {
    const ultimos = getHistorico(12);
    const ultimos50 = getHistorico(50);
    const { cor, texto } = prever(ultimos, ultimos50);

    const sugestao = document.getElementById("sugestaoBox");
    sugestao.textContent = texto;
    sugestao.style.background = cor === "white" ? "#eee" : cor;

    const histBox = document.getElementById("historicoBox");
    histBox.innerHTML = "";
    ultimos.slice(0, 12).reverse().forEach(n => {
      const el = document.createElement("div");
      el.className = "bolaHist " + (
        n === 0 ? "brancoHist" :
        n <= 7 ? "pretoHist" : "vermelhoHist"
      );
      histBox.appendChild(el);
    });
  }

  setInterval(atualizarPainel, 1000);
})();
