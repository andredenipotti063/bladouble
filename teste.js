(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

  // 🔹 Estilo do painel
  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel { position:fixed; top:30px; right:30px; background:#111; color:#fff;
      padding:15px; border-radius:10px; z-index:9999; font-family:Arial,sans-serif;
      width:260px; box-shadow:0 0 10px rgba(0,0,0,0.4); }
    #doubleBlackPainel h1 { margin:0 0 10px; font-size:16px; text-align:center; }
    #sugestaoBox { padding:10px; text-align:center; font-weight:bold; border-radius:8px;
      background-color:#222; margin-bottom:10px; }
    #historicoBox { display:flex; gap:4px; justify-content:center; flex-wrap:wrap; }
    .bolaHist { width:20px; height:20px; border-radius:50%; }
    .pretoHist { background:black; }
    .vermelhoHist { background:red; }
    .brancoHist { background:white; border:1px solid #999; }
  `;
  document.head.appendChild(style);

  // 🔹 Elementos
  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Aguardando dados...</div>
    <div id="historicoBox"></div>
  `;
  document.body.appendChild(painel);

  // 🔢 Histórico local
  const historico = [];

  async function fetchLast() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const color = data[0]?.color;

      if (color === 0 || color === 1 || color === 2) {
        if (historico[0] !== color) {
          historico.unshift(color);
          if (historico.length > 50) historico.pop();
        }
      } else {
        console.warn("⚠️ Color inválido ou API vazia:", data);
      }
    } catch (e) {
      console.error("❌ Erro ao buscar API:", e);
    }
  }

  function prever(ultimos) {
    if (ultimos.length < 5) return { cor: "#333", texto: "⌛ Coletando dados..." };

    const u5 = ultimos.slice(0, 5);
    const p5 = u5.filter(n => n === 2).length;
    const v5 = u5.filter(n => n === 1).length;
    const bTot = ultimos.filter(n => n === 0).length;

    if (p5 >= 4) return { cor: "red", texto: "🔁 Inversão: Apostar Vermelho" };
    if (v5 >= 4) return { cor: "black", texto: "🔁 Inversão: Apostar Preto" };

    const p10 = ultimos.slice(0, 10).filter(n => n === 2).length;
    const v10 = ultimos.slice(0, 10).filter(n => n === 1).length;

    if (p10 >= 6) return { cor: "red", texto: "📊 Tendência Preto → Vermelho" };
    if (v10 >= 6) return { cor: "black", texto: "📊 Tendência Vermelho → Preto" };

    if (bTot <= 1 && ultimos[0] !== 0) return { cor: "white", texto: "⚪️ Branco possível" };

    return p5 > v5
      ? { cor: "black", texto: "🤖 Probabilidade: Preto" }
      : { cor: "red", texto: "🤖 Probabilidade: Vermelho" };
  }

  function atualizarPainel() {
    const ult = historico.slice(0, 12);
    const { cor, texto } = prever(historico);

    const sugestao = document.getElementById("sugestaoBox");
    sugestao.textContent = texto;
    sugestao.style.background = cor;

    const box = document.getElementById("historicoBox");
    box.innerHTML = "";
    ult.forEach(n => {
      const el = document.createElement("div");
      el.className = "bolaHist " + (n === 0 ? "brancoHist" : n === 2 ? "pretoHist" : "vermelhoHist");
      box.appendChild(el);
    });
  }

  // 🔁 Loop
  await fetchLast(); atualizarPainel();
  setInterval(async () => {
    await fetchLast();
    atualizarPainel();
  }, 3000);
})();
