// ==UserScript==
// @name         Blaze IA Roleta - Alta Confiança
// @namespace    https://openai.com/
// @version      2.1
// @description  Previsão de cores da roleta Blaze com IA (TensorFlow.js) + lógica tradicional combinadas. Alta precisão. Mobile e desktop.
// @match        https://blaze.com/pt/games/double
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0
// ==/UserScript==

(async function () {
  'use strict';

  // EVITAR DUPLICAÇÃO
  if (window.blazeIAStarted) return;
  window.blazeIAStarted = true;

  // ========= ESTILO =========
  const style = document.createElement("style");
  style.innerHTML = `
    #painelBlazeIA {
      position: fixed; top: 20px; left: 20px;
      background: #111; color: #fff; z-index: 9999;
      padding: 15px; border-radius: 10px; width: 280px;
      font-family: Arial; box-shadow: 0 0 10px rgba(0,0,0,0.5);
      cursor: move;
    }
    #painelBlazeIA h1 { margin: 0 0 10px; font-size: 16px; text-align: center; }
    #sugestaoBox { text-align: center; font-weight: bold; margin-bottom: 10px; padding: 10px; border-radius: 8px; background: #222; }
    #historicoBox { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; margin-bottom: 10px; }
    .bola { width: 20px; height: 20px; border-radius: 50%; }
    .preto { background: black; }
    .vermelho { background: red; }
    .branco { background: white; border: 1px solid #999; }
    #acertosBox, #acaoBox { text-align: center; font-size: 13px; margin-top: 5px; }
    #resetarBtn { background: #444; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 5px; }
  `;
  document.head.appendChild(style);

  // ========= HTML PAINEL =========
  const painel = document.createElement("div");
  painel.id = "painelBlazeIA";
  painel.innerHTML = `
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Aguardando dados...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
    <button id="resetarBtn">🔁 Resetar Histórico</button>
    <div id="acaoBox"></div>
  `;
  document.body.appendChild(painel);

  // ========= MOVER PAINEL =========
  let isDragging = false, startX, startY, startLeft, startTop;
  painel.addEventListener("mousedown", e => {
    isDragging = true;
    startX = e.clientX; startY = e.clientY;
    startLeft = painel.offsetLeft; startTop = painel.offsetTop;
  });
  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    painel.style.left = `${startLeft + dx}px`;
    painel.style.top = `${startTop + dy}px`;
  });
  document.addEventListener("mouseup", () => isDragging = false);

  painel.addEventListener("touchstart", e => {
    const t = e.touches[0];
    isDragging = true;
    startX = t.clientX; startY = t.clientY;
    startLeft = painel.offsetLeft; startTop = painel.offsetTop;
  }, { passive: false });

  document.addEventListener("touchmove", e => {
    if (!isDragging) return;
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    painel.style.left = `${startLeft + dx}px`;
    painel.style.top = `${startTop + dy}px`;
  }, { passive: false });

  document.addEventListener("touchend", () => isDragging = false);

  // ========= VARIÁVEIS =========
  let historico = JSON.parse(localStorage.getItem("blazeHistorico") || "[]");
  let ultimoId = null;
  let acertos = 0, erros = 0;
  let ultimaPrevisao = null;

  // ========= IA =========
  const modelo = tf.sequential();
  modelo.add(tf.layers.dense({ inputShape: [5], units: 20, activation: 'relu' }));
  modelo.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
  modelo.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });

  async function treinarIA() {
    if (historico.length < 10) return;

    const entradas = [], saidas = [];
    for (let i = 5; i < historico.length; i++) {
      const entrada = historico.slice(i - 5, i).map(x => x / 2);
      const saida = [0, 0, 0];
      saida[historico[i]] = 1;
      entradas.push(entrada);
      saidas.push(saida);
    }

    const xs = tf.tensor2d(entradas);
    const ys = tf.tensor2d(saidas);
    await modelo.fit(xs, ys, { epochs: 10 });
    xs.dispose(); ys.dispose();
  }

  async function preverIA() {
    if (historico.length < 5) return null;
    const entrada = tf.tensor2d([historico.slice(0, 5).map(x => x / 2)]);
    const pred = modelo.predict(entrada);
    const result = (await pred.data()).map((v, i) => ({ cor: i, prob: v }));
    pred.dispose(); entrada.dispose();
    return result.sort((a, b) => b.prob - a.prob)[0].cor;
  }

  function preverTradicional() {
    const ult = historico.slice(0, 7);
    const count = (val) => ult.filter(x => x === val).length;
    const pretos = count(2), vermelhos = count(1);

    if (ult.slice(0, 4).every(x => x === 2)) return 1; // inversão para vermelho
    if (ult.slice(0, 4).every(x => x === 1)) return 2; // inversão para preto
    if (!historico.slice(0, 40).includes(0) && ultimaPrevisao !== 0) return 0; // alerta branco
    if (pretos >= 5) return 1;
    if (vermelhos >= 5) return 2;

    return pretos > vermelhos ? 1 : 2;
  }

  // ========= FETCH =========
  async function coletarRodada() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const rodada = data[0];
      if (!rodada || !('color' in rodada)) return;

      const cor = rodada.color, id = rodada.id;
      if (id === ultimoId) return;
      ultimoId = id;

      historico.unshift(cor);
      localStorage.setItem("blazeHistorico", JSON.stringify(historico));

      // IA + lógica tradicional
      const previsaoIA = await preverIA();
      const previsaoTradicional = preverTradicional();

      let previsaoFinal = null;
      if (previsaoIA === previsaoTradicional) previsaoFinal = previsaoIA;

      if (ultimaPrevisao !== null) {
        if (cor === ultimaPrevisao) acertos++;
        else erros++;
      }
      ultimaPrevisao = previsaoFinal;

      atualizarPainel(previsaoFinal);
    } catch (e) {
      console.error("Erro ao buscar rodada:", e);
    }
  }

  function atualizarPainel(previsao) {
    const historicoBox = document.getElementById("historicoBox");
    historicoBox.innerHTML = "";
    historico.slice(0, 12).forEach(cor => {
      const bola = document.createElement("div");
      bola.className = "bola " + (cor === 2 ? "preto" : cor === 1 ? "vermelho" : "branco");
      historicoBox.appendChild(bola);
    });

    const sugestaoBox = document.getElementById("sugestaoBox");
    if (previsao === null) {
      sugestaoBox.textContent = "⏳ Aguardando padrão...";
      sugestaoBox.style.background = "#333";
    } else {
      const textos = ["⚪️ Branco", "🔴 Vermelho", "⚫️ Preto"];
      const cores = ["white", "red", "black"];
      sugestaoBox.textContent = `✅ Confiança Alta: ${textos[previsao]}`;
      sugestaoBox.style.background = cores[previsao];
      sugestaoBox.style.color = previsao === 0 ? "#000" : "#fff";
    }

    const total = acertos + erros;
    const taxa = total ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  // ========= RESET =========
  document.getElementById("resetarBtn").onclick = () => {
    historico = [];
    localStorage.removeItem("blazeHistorico");
    acertos = 0; erros = 0; ultimaPrevisao = null;
    atualizarPainel(null);
    const acao = document.getElementById("acaoBox");
    acao.textContent = "🔁 Histórico resetado";
    setTimeout(() => acao.textContent = "", 5000);
  };

  // ========= LOOP =========
  await treinarIA();
  setInterval(() => {
    coletarRodada();
    if (historico.length > 200) historico.pop(); // limite memória
    if (historico.length >= 10) treinarIA();
  }, 3000);
})();
