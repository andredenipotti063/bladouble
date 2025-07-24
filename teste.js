(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

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

  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Aguardando jogadas...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
  `;
  document.body.appendChild(painel);

  // Movimento do painel
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;
  function onDragStart(x, y) {
    isDragging = true;
    startX = x; startY = y;
    initialLeft = painel.offsetLeft;
    initialTop = painel.offsetTop;
  }
  function onDragMove(x, y) {
    if (!isDragging) return;
    painel.style.left = initialLeft + (x - startX) + "px";
    painel.style.top = initialTop + (y - startY) + "px";
  }
  painel.addEventListener("mousedown", e => {
    e.preventDefault();
    onDragStart(e.clientX, e.clientY);
  });
  document.addEventListener("mousemove", e => onDragMove(e.clientX, e.clientY));
  document.addEventListener("mouseup", () => isDragging = false);

  // Toque móvel
  painel.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      onDragStart(touch.clientX, touch.clientY);
    }
  }, { passive: false });
  document.addEventListener("touchmove", e => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      onDragMove(touch.clientX, touch.clientY);
    }
  }, { passive: false });
  document.addEventListener("touchend", () => isDragging = false);

  // Lógica
  const historico = [];
  let ultimoId = null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;

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
          if (cor === ultimaPrevisao || (cor === 0 && ultimaPrevisao !== null)) acertos++;
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
    if (h.length < 7) return null;

    const ult7 = h.slice(0, 7);
    const ult40 = h.slice(0, 40);
    const count = (arr, val) => arr.filter(n => n === val).length;

    if (ult7.slice(0, 4).every(n => n === 2)) return { entrada: 1, texto: "🔁 Inverter: Apostar Vermelho" };
    if (ult7.slice(0, 4).every(n => n === 1)) return { entrada: 2, texto: "🔁 Inverter: Apostar Preto" };

    const pretos = count(ult7, 2);
    const vermelhos = count(ult7, 1);
    if (pretos >= 5) return { entrada: 1, texto: "📊 Tendência: Apostar Vermelho" };
    if (vermelhos >= 5) return { entrada: 2, texto: "📊 Tendência: Apostar Preto" };

    if (!ult40.includes(0) && ultimaPrevisao !== 0) {
      return { entrada: null, texto: "⚠️ Alerta de Branco — Não apostar agora" };
    }

    // Probabilidade simples
    if (pretos > vermelhos) return { entrada: 1, texto: "🤖 Probabilidade: Apostar Vermelho" };
    if (vermelhos > pretos) return { entrada: 2, texto: "🤖 Probabilidade: Apostar Preto" };

    return null;
  }

  function atualizarPainel() {
    const ult = historico.slice(0, 12);
    const sugestao = document.getElementById("sugestaoBox");
    const box = document.getElementById("historicoBox");

    const previsao = prever(historico);
    box.innerHTML = "";
    ult.forEach(n => {
      const el = document.createElement("div");
      el.className = "bolaHist " + (n === 0 ? "brancoHist" : n === 2 ? "pretoHist" : "vermelhoHist");
      box.appendChild(el);
    });

    if (previsao && previsao.entrada !== null) {
      ultimaPrevisao = previsao.entrada;
      const corTexto = previsao.entrada === 2 ? "Preto" : "Vermelho";
      const corBg = previsao.entrada === 2 ? "black" : "red";
      sugestao.textContent = `✅ Apostar: ${corTexto} + ⚪`;
      sugestao.style.background = corBg;
      sugestao.style.color = "#fff";
    } else {
      ultimaPrevisao = null;
      sugestao.textContent = previsao ? previsao.texto : "⏳ Coletando dados...";
      sugestao.style.background = "#222";
      sugestao.style.color = "#fff";
    }

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  await fetchLast();
  setInterval(fetchLast, 3000);
})();
