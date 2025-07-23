// ==UserScript==
// @name         IA Blaze Roleta Previsão Inteligente
// @namespace    https://chat.openai.com/
// @version      2.8
// @description  Previsões com IA + lógica tradicional | histórico completo com reset e confiança alta
// @match        https://blaze.com/pt/games/double
// @grant        none
// ==/UserScript==

(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

  // ==== ESTILO ====
  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: absolute; top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 15px; border-radius: 10px;
      z-index: 9999; font-family: Arial, sans-serif;
      width: 290px; box-shadow: 0 0 10px rgba(0,0,0,0.4); cursor: move;
    }
    #doubleBlackPainel h1 {
      margin: 0 0 10px; font-size: 16px; text-align: center;
    }
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
    #acertosBox, #ultimaAcao {
      text-align: center; font-size: 14px; margin-top: 5px;
    }
    #resetBtn {
      margin: 5px auto; display: block; padding: 6px 10px;
      background: #444; border: none; color: #fff;
      border-radius: 5px; cursor: pointer; font-size: 13px;
    }
  `;
  document.head.appendChild(style);

  // ==== HTML ====
  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
    <button id="resetBtn">♻️ Resetar Histórico</button>
    <div id="ultimaAcao"></div>
  `;
  document.body.appendChild(painel);

  // ==== MOVIMENTO ====
  let isDragging = false, startX, startY, initialLeft, initialTop;
  function onDragStart(x, y) {
    isDragging = true;
    startX = x; startY = y;
    initialLeft = painel.offsetLeft; initialTop = painel.offsetTop;
  }
  function onDragMove(x, y) {
    if (!isDragging) return;
    const dx = x - startX, dy = y - startY;
    painel.style.left = initialLeft + dx + "px";
    painel.style.top = initialTop + dy + "px";
  }
  painel.addEventListener("mousedown", (e) => {
    e.preventDefault(); onDragStart(e.clientX, e.clientY);
  });
  document.addEventListener("mousemove", (e) => onDragMove(e.clientX, e.clientY));
  document.addEventListener("mouseup", () => isDragging = false);
  painel.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      onDragStart(touch.clientX, touch.clientY);
    }
  }, { passive: false });
  document.addEventListener("touchmove", (e) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      onDragMove(touch.clientX, touch.clientY);
    }
  }, { passive: false });
  document.addEventListener("touchend", () => isDragging = false);

  // ==== LÓGICA ====
  let historico = JSON.parse(localStorage.getItem("historicoBlaze") || "[]");
  let ultimoId = null, ultimaPrevisao = null;
  let acertos = parseInt(localStorage.getItem("acertos") || "0");
  let erros = parseInt(localStorage.getItem("erros") || "0");

  function salvarEstado() {
    localStorage.setItem("historicoBlaze", JSON.stringify(historico));
    localStorage.setItem("acertos", acertos);
    localStorage.setItem("erros", erros);
  }

  function mostrarMensagem(msg) {
    const box = document.getElementById("ultimaAcao");
    box.textContent = msg;
    setTimeout(() => (box.textContent = ""), 5000);
  }

  function resetarTudo() {
    historico = [];
    acertos = 0;
    erros = 0;
    ultimoId = null;
    ultimaPrevisao = null;
    salvarEstado();
    atualizarPainel();
    mostrarMensagem("🔄 Histórico resetado.");
  }

  document.getElementById("resetBtn").onclick = resetarTudo;

  function contar(array, val) {
    return array.filter((x) => x === val).length;
  }

  function previsaoTradicional(h) {
    if (h.length < 7) return null;
    const ult7 = h.slice(-7);
    const ult40 = h.slice(-40);
    if (ult7.slice(-4).every((n) => n === 2)) return 1;
    if (ult7.slice(-4).every((n) => n === 1)) return 2;
    const pretos = contar(ult7, 2), vermelhos = contar(ult7, 1);
    if (pretos >= 5) return 1;
    if (vermelhos >= 5) return 2;
    if (!ult40.includes(0)) return 0;
    return pretos > vermelhos ? 1 : 2;
  }

  function previsaoIA(h) {
    if (h.length < 5) return null;
    const ultimos = h.slice(-5);
    const soma = ultimos.reduce((a, b) => a + b, 0);
    if (!h.includes(0) && ultimaPrevisao !== 0) return 0;
    if (soma / ultimos.length > 1.5) return 2;
    else if (soma / ultimos.length < 1) return 1;
    else return 2;
  }

  function gerarSugestao() {
    const ia = previsaoIA(historico);
    const logica = previsaoTradicional(historico);
    let cor, texto, corNum = null;

    if (ia !== null && ia === logica) {
      corNum = ia;
      cor = corNum === 0 ? "white" : corNum === 1 ? "red" : "black";
      texto = `✅ Confiança Alta: ${cor === "white" ? "Branco" : cor[0].toUpperCase() + cor.slice(1)}`;
    } else {
      cor = "#333";
      texto = "⏳ Aguardando padrão...";
    }

    return { cor, texto, previsao: corNum };
  }

  function atualizarPainel() {
    const ult = historico.slice(-12).reverse();
    const { cor, texto, previsao } = gerarSugestao();
    ultimaPrevisao = previsao;

    const sugestao = document.getElementById("sugestaoBox");
    sugestao.textContent = texto;
    sugestao.style.background = cor;
    sugestao.style.color = cor === "white" ? "#000" : "#fff";

    const box = document.getElementById("historicoBox");
    box.innerHTML = "";
    ult.forEach((n) => {
      const el = document.createElement("div");
      el.className = "bolaHist " + (n === 0 ? "brancoHist" : n === 2 ? "pretoHist" : "vermelhoHist");
      box.appendChild(el);
    });

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  async function fetchUltima() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color, id = data[0]?.id;
      if (!cor && !id) return;

      if (id !== ultimoId) {
        historico.push(cor);
        if (ultimaPrevisao !== null) {
          if (cor === ultimaPrevisao) acertos++;
          else erros++;
        }
        ultimoId = id;
        salvarEstado();
        atualizarPainel();
      }
    } catch (e) {
      console.error("Erro ao buscar API:", e);
    }
  }

  atualizarPainel();
  await fetchUltima();
  setInterval(fetchUltima, 3000);
})();
