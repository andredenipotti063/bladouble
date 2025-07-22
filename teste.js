(function () {
  if (document.getElementById("doubleBlackPainel")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700&display=swap');
    #doubleBlackPainel {
      font-family: 'Inter', sans-serif;
      position: fixed;
      top: 30px;
      right: 30px;
      z-index: 9999;
      background: #111;
      color: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 0 20px rgba(0,0,0,0.4);
      transition: transform 0.3s ease;
      width: 260px;
      user-select: none;
    }
    #doubleBlackPainel:hover {
      box-shadow: 0 0 25px rgba(0,0,0,0.6);
    }
    #doubleBlackPainel h1 {
      font-size: 16px;
      margin: 0 0 8px;
    }
    #sugestaoBox {
      font-size: 14px;
      margin-top: 10px;
      padding: 10px;
      border-radius: 8px;
      text-align: center;
      font-weight: bold;
      background: #222;
    }
  `;
  document.head.appendChild(style);

  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🎯 Previsão Inteligente</h1>
    <div id="sugestaoBox">Carregando...</div>
  `;
  document.body.appendChild(painel);

  // arrastável
  painel.onmousedown = function (e) {
    e.preventDefault();
    let shiftX = e.clientX - painel.getBoundingClientRect().left;
    let shiftY = e.clientY - painel.getBoundingClientRect().top;
    function moveAt(pageX, pageY) {
      painel.style.left = pageX - shiftX + 'px';
      painel.style.top = pageY - shiftY + 'px';
    }
    function onMouseMove(e) {
      moveAt(e.pageX, e.pageY);
    }
    document.addEventListener('mousemove', onMouseMove);
    painel.onmouseup = function () {
      document.removeEventListener('mousemove', onMouseMove);
      painel.onmouseup = null;
    };
  };
  painel.ondragstart = () => false;

  function getHistorico(limit = 50) {
    const tiles = Array.from(document.querySelectorAll(".roulette-tile")).slice(0, limit);
    return tiles.map(tile => {
      const color = tile.classList.contains("white") ? "white" :
                    tile.classList.contains("red") ? "red" :
                    tile.classList.contains("black") ? "black" : "";
      if (color === "white") return 0;
      if (color === "black") return parseInt(tile.textContent || "0") <= 7 ? parseInt(tile.textContent) : 0;
      if (color === "red") return parseInt(tile.textContent || "0") >= 8 ? parseInt(tile.textContent) : 0;
      return 0;
    });
  }

  function preverInteligente(ultimos, ultimos50 = []) {
    if (!ultimos || ultimos.length < 10) {
      return { cor: "#444", texto: "🔍 Aguardando mais dados..." };
    }

    const u5 = ultimos.slice(0, 5);
    const u10 = ultimos.slice(0, 10);
    const branco10 = u10.filter(n => n === 0).length;
    const preto10 = u10.filter(n => n >= 1 && n <= 7).length;
    const vermelho10 = u10.filter(n => n >= 8).length;

    // 1. Sequência forte? Inverter cor
    if (u5.every(n => n >= 1 && n <= 7)) return { cor: "red", texto: "🔁 Inversão: Apostar Vermelho" };
    if (u5.every(n => n >= 8)) return { cor: "black", texto: "🔁 Inversão: Apostar Preto" };

    // 2. Alternância (pv pv …)
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

    // 3. Predomínio em 10 últimas
    if (preto10 >= 7) return { cor: "red", texto: "📊 Predomínio Preto → Apostar Vermelho" };
    if (vermelho10 >= 7) return { cor: "black", texto: "📊 Predomínio Vermelho → Apostar Preto" };

    // 4. Branco raro
    const branco50 = ultimos50.filter(n => n === 0).length;
    if (branco50 <= 1 && ultimos[0] !== 0) {
      return { cor: "white", texto: "⚪️ Branco possível (raro)" };
    }

    // 5. Caso contrário, sem sugestão
    return { cor: "#444", texto: "🕒 Sem oportunidade confiável" };
  }

  function atualizarSugestao() {
    try {
      const ultimos10 = getHistorico(10);
      const ultimos50 = getHistorico(50);
      const sugest = preverInteligente(ultimos10, ultimos50);
      const box = document.getElementById("sugestaoBox");
      box.textContent = sugest.texto;
      box.style.background = sugest.cor;
    } catch (e) {
      console.error("Erro ao atualizar sugestão:", e);
    }
  }

  atualizarSugestao();
  setInterval(atualizarSugestao, 1500);
})();
