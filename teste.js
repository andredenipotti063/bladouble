// ==UserScript==
// @name         IA Roleta Blaze com TensorFlow.js
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Previsão inteligente com IA + lógica tradicional para Roleta Blaze, com proteção no branco e aprendizado online
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.18.0/dist/tf.min.js
// ==/UserScript==

(function () {
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
    #ultimaAcaoBox {
      text-align: center; font-size: 12px;
      margin-top: 5px; color: #ccc;
    }
    #btnReset {
      background: #444; color: white; padding: 5px 10px;
      border-radius: 6px; margin: 10px auto 0;
      display: block; cursor: pointer; text-align: center;
      border: none;
    }
  `;
  document.head.appendChild(style);

  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🤖 IA Roleta Blaze</h1>
    <div id="sugestaoBox">⏳ Carregando IA...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
    <div id="ultimaAcaoBox"></div>
    <button id="btnReset">🔁 Resetar Histórico</button>
  `;
  document.body.appendChild(painel);

  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  painel.addEventListener("mousedown", e => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = painel.offsetLeft;
    initialTop = painel.offsetTop;
  });
  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    painel.style.left = `${initialLeft + dx}px`;
    painel.style.top = `${initialTop + dy}px`;
  });
  document.addEventListener("mouseup", () => isDragging = false);

  painel.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      isDragging = true;
      startX = touch.clientX;
      startY = touch.clientY;
      initialLeft = painel.offsetLeft;
      initialTop = painel.offsetTop;
    }
  }, { passive: false });

  document.addEventListener("touchmove", (e) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      painel.style.left = `${initialLeft + dx}px`;
      painel.style.top = `${initialTop + dy}px`;
    }
  }, { passive: false });

  document.addEventListener("touchend", () => isDragging = false);

  // 🔁 Variáveis
  let historico = JSON.parse(localStorage.getItem("historicoBlaze") || "[]");
  let ultimoId = null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;

  // 🔁 Botão Reset
  document.getElementById("btnReset").onclick = () => {
    historico = [];
    ultimoId = null;
    acertos = 0;
    erros = 0;
    localStorage.removeItem("historicoBlaze");
    mostrarAcao("Histórico resetado.");
    atualizarPainel();
  };

  // ✅ Mensagem de última ação
  function mostrarAcao(msg) {
    const box = document.getElementById("ultimaAcaoBox");
    box.textContent = msg;
    setTimeout(() => box.textContent = "", 5000);
  }

  // 🧠 Modelo IA com TensorFlow.js
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [5], units: 10, activation: "relu" }));
  model.add(tf.layers.dense({ units: 3, activation: "softmax" }));
  model.compile({ optimizer: "adam", loss: "categoricalCrossentropy" });

  function normalizarEntrada(array) {
    return array.map(v => v / 2); // Normaliza para faixa [0,1]
  }

  async function treinarIA() {
    if (historico.length < 6) return;

    const xs = [];
    const ys = [];

    for (let i = 0; i < historico.length - 5; i++) {
      const entrada = historico.slice(i, i + 5).map(x => x.cor);
      const saida = historico[i + 5].cor;
      const x = normalizarEntrada(entrada);
      const y = tf.oneHot([saida], 3).arraySync()[0];
      xs.push(x);
      ys.push(y);
    }

    const tx = tf.tensor2d(xs);
    const ty = tf.tensor2d(ys);
    await model.fit(tx, ty, { epochs: 5, shuffle: true });
    tx.dispose(); ty.dispose();
  }

  async function preverIA() {
    if (historico.length < 5) return null;
    const entrada = normalizarEntrada(historico.slice(0, 5).map(x => x.cor));
    const tensor = tf.tensor2d([entrada]);
    const output = model.predict(tensor);
    const data = await output.data();
    tensor.dispose();
    output.dispose();
    const maxIndex = data.indexOf(Math.max(...data));
    return maxIndex;
  }

  function logicaTradicional(h) {
    if (h.length < 7) return null;
    const ult = h.map(x => x.cor).slice(0, 7);
    const count = (arr, val) => arr.filter(x => x === val).length;

    if (ult.slice(0, 4).every(x => x === 2)) return 1; // Preto → vermelho
    if (ult.slice(0, 4).every(x => x === 1)) return 2; // Vermelho → preto

    const pretos = count(ult, 2), vermelhos = count(ult, 1);
    if (pretos >= 5) return 1;
    if (vermelhos >= 5) return 2;

    return pretos > vermelhos ? 1 : 2;
  }

  function atualizarPainel() {
    const ult = historico.slice(0, 12).map(x => x.cor);
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

  async function ciclo() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color;
      const id = data[0]?.id;

      if (!id || cor === undefined) return;

      if (historico.length > 0 && historico[0].id === id) return;

      historico.unshift({ cor, id });
      localStorage.setItem("historicoBlaze", JSON.stringify(historico));

      await treinarIA();
      const prevIA = await preverIA();
      const prevLOG = logicaTradicional(historico);

      if (prevIA !== null && prevIA === prevLOG) {
        ultimaPrevisao = prevIA;

        if (cor === ultimaPrevisao) acertos++;
        else erros++;

        const texto = `🎯 Apostar em ${prevIA === 1 ? '🔴 Vermelho' : '⚫ Preto'} + ⚪️ Proteção`;
        const corFundo = prevIA === 1 ? 'red' : 'black';
        const sugestao = document.getElementById("sugestaoBox");
        sugestao.textContent = texto;
        sugestao.style.background = corFundo;
        sugestao.style.color = "#fff";
      } else {
        const sugestao = document.getElementById("sugestaoBox");
        sugestao.textContent = "⌛ IA sem confiança ainda";
        sugestao.style.background = "#333";
        sugestao.style.color = "#fff";
      }

      atualizarPainel();
    } catch (e) {
      console.error("Erro ao buscar rodada:", e);
    }
  }

  ciclo();
  setInterval(ciclo, 3000);
})();
