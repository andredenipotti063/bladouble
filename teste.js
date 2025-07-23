// ==UserScript==
// @name         Blaze IA Roleta com TensorFlow.js
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Previsão de cores com IA (TensorFlow.js) + lógica tradicional + proteção no branco
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js
// ==/UserScript==

(function () {
  if (document.getElementById("doubleBlackPainel")) return;

  // === CSS e Painel Flutuante ===
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
    <h1>🔮 IA Roleta Blaze</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
    <div id="ultimaAcaoBox"></div>
    <button id="btnReset">🔁 Resetar Histórico</button>
  `;
  document.body.appendChild(painel);

  // === Drag (Desktop/Mobile) ===
  let isDragging = false, startX, startY, initialLeft, initialTop;
  function onDragStart(x, y) {
    isDragging = true; startX = x; startY = y;
    initialLeft = painel.offsetLeft; initialTop = painel.offsetTop;
  }
  function onDragMove(x, y) {
    if (!isDragging) return;
    painel.style.left = initialLeft + (x - startX) + "px";
    painel.style.top = initialTop + (y - startY) + "px";
  }
  painel.addEventListener("mousedown", e => { e.preventDefault(); onDragStart(e.clientX, e.clientY); });
  document.addEventListener("mousemove", e => onDragMove(e.clientX, e.clientY));
  document.addEventListener("mouseup", () => isDragging = false);
  painel.addEventListener("touchstart", e => {
    if (e.touches.length === 1) onDragStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  document.addEventListener("touchmove", e => {
    if (isDragging && e.touches.length === 1) onDragMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  document.addEventListener("touchend", () => isDragging = false);

  // === Lógica ===
  let historico = JSON.parse(localStorage.getItem("historicoBlaze") || "[]");
  let ultimoId = null, ultimaPrevisao = null, acertos = 0, erros = 0;

  document.getElementById("btnReset").onclick = () => {
    historico = []; ultimoId = null; acertos = 0; erros = 0;
    localStorage.removeItem("historicoBlaze");
    atualizarPainel(); mostrarAcao("Histórico resetado.");
  };

  function mostrarAcao(msg) {
    const box = document.getElementById("ultimaAcaoBox");
    box.textContent = msg;
    setTimeout(() => box.textContent = "", 5000);
  }

  // === Modelo IA TensorFlow.js (Rede Neural Simples) ===
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [10], units: 20, activation: "relu" }));
  model.add(tf.layers.dense({ units: 3, activation: "softmax" }));
  model.compile({ optimizer: "adam", loss: "categoricalCrossentropy" });

  function treinarIA() {
    if (historico.length < 30) return;

    const entradas = [];
    const saidas = [];

    for (let i = 10; i < historico.length; i++) {
      const input = historico.slice(i - 10, i).map(x => x.cor / 2); // Normalizado: 0, 0.5, 1
      const saida = [0, 0, 0];
      saida[historico[i].cor] = 1;

      entradas.push(input);
      saidas.push(saida);
    }

    const xs = tf.tensor2d(entradas);
    const ys = tf.tensor2d(saidas);
    model.fit(xs, ys, { epochs: 10, shuffle: true }).then(() => xs.dispose() && ys.dispose());
  }

  function preverIA() {
    if (historico.length < 10) return null;
    const input = tf.tensor2d([historico.slice(0, 10).map(x => x.cor / 2)]);
    const pred = model.predict(input);
    const idx = pred.argMax(1).dataSync()[0];
    input.dispose(); pred.dispose();
    return idx;
  }

  function preverTradicional(h) {
    if (h.length < 7) return null;
    const cores = h.map(x => x.cor);
    const ult7 = cores.slice(0, 7);
    const pretos = ult7.filter(n => n === 2).length;
    const vermelhos = ult7.filter(n => n === 1).length;

    if (pretos >= 5) return 1;
    if (vermelhos >= 5) return 2;
    if (!cores.slice(0, 40).includes(0)) return 0;

    return pretos > vermelhos ? 1 : 2;
  }

  function preverCombinado() {
    const ia = preverIA();
    const tradicional = preverTradicional(historico);
    if (ia === null || tradicional === null) return { cor: "#333", texto: "⌛ Coletando IA...", previsao: null };

    if (ia === tradicional) {
      const corTxt = ia === 0 ? "⚪️ Proteção: Branco" : ia === 1 ? "🔴 Vermelho + ⚪️" : "⚫ Preto + ⚪️";
      const corBg = ia === 0 ? "white" : ia === 1 ? "red" : "black";
      return { cor: corBg, texto: corTxt, previsao: ia };
    } else {
      return { cor: "#555", texto: "🔍 IA e lógica divergentes", previsao: null };
    }
  }

  async function fetchLast() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color;
      const id = data[0]?.id;

      if (!id || cor === undefined) return;
      if (historico[0]?.id === id) return;

      historico.unshift({ cor, id });
      localStorage.setItem("historicoBlaze", JSON.stringify(historico));
      if (ultimaPrevisao !== null) {
        if (cor === ultimaPrevisao) acertos++;
        else erros++;
      }

      ultimoId = id;
      treinarIA();
      atualizarPainel();
    } catch (e) {
      console.error("Erro na API:", e);
    }
  }

  function atualizarPainel() {
    const ult = historico.slice(0, 12).map(x => x.cor);
    const { cor, texto, previsao } = preverCombinado();
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

  fetchLast();
  setInterval(fetchLast, 3000);
})();
