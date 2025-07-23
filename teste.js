// ==UserScript==
// @name         IA Roleta Blaze (Previsão)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Previsão automática da Roleta Blaze com IA básica e painel flutuante móvel
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// ==/UserScript==

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
    #statusBox { text-align:center; font-size:13px; margin-top:8px; color:#aaa; }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .spin {
      display: inline-block;
      animation: spin 1s linear infinite;
    }
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
    <div id="statusBox"></div>
  `;
  document.body.appendChild(painel);

  // Movimento do painel (mouse + toque)
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  function onDragStart(x, y) {
    isDragging = true;
    startX = x;
    startY = y;
    initialLeft = painel.offsetLeft;
    initialTop = painel.offsetTop;
  }

  function onDragMove(x, y) {
    if (!isDragging) return;
    const dx = x - startX;
    const dy = y - startY;
    painel.style.left = initialLeft + dx + "px";
    painel.style.top = initialTop + dy + "px";
  }

  painel.addEventListener("mousedown", (e) => {
    e.preventDefault();
    onDragStart(e.clientX, e.clientY);
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

  // STATUS
  let statusTimeout = null;
  function atualizarStatus(mensagem, cor = "#aaa", girar = false) {
    const status = document.getElementById("statusBox");
    if (!status) return;

    const icone = girar ? `<span class="spin">🔄</span> ` : "";
    status.innerHTML = icone + mensagem;
    status.style.color = cor;

    if (statusTimeout) clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
      status.textContent = "";
      status.style.color = "#aaa";
    }, 5000);
  }

  // Lógica de previsão
  const historico = [];
  let ultimoId = null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;

  async function fetchLast() {
    try {
      atualizarStatus("Buscando rodada...", "#0af", true);

      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color;
      const id = data[0]?.id;

      if (!id || cor === undefined) return;

      if (id === ultimoId) return;

      if (historico[0] === cor && id !== ultimoId) {
        atualizarStatus("🔁 Detecção de rodada repetida. Auto-reset...", "orange");
        historico.length = 0;
        acertos = 0;
        erros = 0;
        ultimaPrevisao = null;
      }

      historico.unshift(cor);
      if (historico.length > 50) historico.pop();

      if (ultimaPrevisao !== null) {
        if (cor === ultimaPrevisao) acertos++;
        else erros++;
      }

      ultimoId = id;
      atualizarPainel();
    } catch (e) {
      atualizarStatus("Erro ao buscar rodada", "red");
      console.error("❌ Erro ao buscar API:", e);
    }
  }

  function prever(h) {
    if (h.length < 7) return { cor: "#333", texto: "⌛ Coletando dados...", previsao: null };

    const ult7 = h.slice(0, 7);
    const ult40 = h.slice(0, 40);
    const count = (arr, val) => arr.filter(n => n === val).length;

    if (ult7.slice(0, 4).every(n => n === 2)) return { cor: "red", texto: "🔁 Inversão: Apostar Vermelho", previsao: 1 };
    if (ult7.slice(0, 4).every(n => n === 1)) return { cor: "black", texto: "🔁 Inversão: Apostar Preto", previsao: 2 };

    const pretos = count(ult7, 2);
    const vermelhos = count(ult7, 1);
    if (pretos >= 5) return { cor: "red", texto: "📊 Tendência Preto → Vermelho", previsao: 1 };
    if (vermelhos >= 5) return { cor: "black", texto: "📊 Tendência Vermelho → Preto", previsao: 2 };

    if (!ult40.includes(0) && ultimaPrevisao !== 0)
      return { cor: "white", texto: "⚪️ Alerta de Branco", previsao: 0 };

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
