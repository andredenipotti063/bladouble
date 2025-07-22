(function () {
  if (document.getElementById("doubleBlackPainel")) return;

  // CSS do painel
  const style = document.createElement("style");
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap');

    #doubleBlackPainel {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #111;
      color: #fff;
      padding: 20px;
      z-index: 9999;
      border-radius: 12px;
      font-family: 'Inter', sans-serif;
      box-shadow: 0 0 15px rgba(0,0,0,0.5);
      width: 260px;
      transition: all 0.3s ease;
    }

    #doubleBlackPainel h2 {
      margin: 0 0 12px 0;
      font-size: 18px;
      text-align: center;
    }

    #sugestaoBox {
      font-size: 24px;
      padding: 10px;
      margin-bottom: 10px;
      text-align: center;
      border-radius: 8px;
      font-weight: 600;
    }

    #historicoBox {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .bolaHist {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1px solid #333;
    }

    .pretoHist { background: #000; }
    .vermelhoHist { background: #c00; }
    .brancoHist { background: #fff; border: 2px solid #999; }
  `;
  document.head.appendChild(style);

  // Painel HTML
  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h2>Blaze - Previsão</h2>
    <div id="sugestaoBox">Carregando...</div>
    <div id="historicoBox"></div>
  `;
  document.body.appendChild(painel);

  // Estado
  let historico = [];
  let carregando = false;

  // Coleta via API oficial Blaze
  async function getHistorico() {
    if (carregando) return;
    carregando = true;

    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      historico = [...new Set(data.map(jogo => jogo.color))];
    } catch (e) {
      console.error("Erro ao buscar histórico:", e);
    }

    carregando = false;
  }

  // Previsão simples baseada em padrão
  function prever(historico) {
    const [a, b, c] = historico;

    if (a === 1 && b === 1 && c === 1)
      return { cor: "black", texto: "Tendência: VERMELHO → PRETO" };

    if (a === 2 && b === 2 && c === 2)
      return { cor: "red", texto: "Tendência: PRETO → VERMELHO" };

    if (a === 0 || b === 0 || c === 0)
      return { cor: "white", texto: "Chance de BRANCO!" };

    return { cor: "gray", texto: "Sem oportunidade confiável" };
  }

  // Atualizar o painel
  function atualizarPainel() {
    const ultimos = historico.slice(0, 12);
    const { cor, texto } = prever(historico);

    const sugestao = document.getElementById("sugestaoBox");
    sugestao.textContent = texto;

    if (cor === "white") {
      sugestao.style.background = "#eee";
      sugestao.style.color = "#000";
    } else {
      sugestao.style.background = cor;
      sugestao.style.color = "#fff";
    }

    const box = document.getElementById("historicoBox");
    box.innerHTML = "";

    ultimos.forEach(n => {
      const el = document.createElement("div");
      el.className = "bolaHist " + (
        n === 0 ? "brancoHist" :
        n === 2 ? "pretoHist" :
        "vermelhoHist"
      );
      box.appendChild(el);
    });
  }

  // Loop de atualização
  setInterval(() => {
    getHistorico().then(atualizarPainel);
  }, 2500);
})();
