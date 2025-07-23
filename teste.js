// ==UserScript==
// @name         Blaze IA Roleta com TensorFlow.js (Final)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Previsão com IA (TensorFlow.js) + lógica tradicional + proteção no branco + compatível com celular e PC
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js
// ==/UserScript==

(async function () {
  // Esperar até que TensorFlow.js esteja carregado
  function waitForTF() {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (typeof tf !== "undefined") {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  await waitForTF();

  if (document.getElementById("doubleBlackPainel")) return;

  // === Estilo do Painel ===
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
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
    <div id="ultimaAcaoBox"></div>
    <button id="btnReset">🔁 Resetar Histórico</button>
  `;
  document.body.appendChild(painel);

  // Movimentar painel
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;
  painel.addEventListener("mousedown", (e) => {
    e.preventDefault(); isDragging = true;
    startX = e.clientX; startY = e.clientY;
    initialLeft = painel.offsetLeft; initialTop = painel.offsetTop;
  });
  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    painel.style.left = initialLeft + dx + "px";
    painel.style.top = initialTop + dy + "px";
  });
  document.addEventListener("mouseup", () => isDragging = false);

  // Toque em celular
  painel.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      isDragging = true;
      startX = touch.clientX; startY = touch.clientY;
      initialLeft = painel.offsetLeft; initialTop = painel.offsetTop;
    }
  }, { passive: false });
  document.addEventListener("touchmove", (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX, dy = touch.clientY - startY;
    painel.style.left = initialLeft + dx + "px";
    painel.style.top = initialTop + dy + "px";
  }, { passive: false });
  document.addEventListener("touchend", () => isDragging = false);

  // === IA ===
  let model;
  async function criarModelo() {
    model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [10], units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });
  }

  async function treinarIA(dataset) {
    if (dataset.length < 20) return;
    const xs = tf.tensor2d(dataset.map(d => d.entrada));
    const ys = tf.tensor2d(dataset.map(d => d.saida));
    await model.fit(xs, ys, { epochs: 10, verbose: 0 });
    xs.dispose(); ys.dispose();
  }

  function preverIA(input) {
    if (!model) return null;
    const xs = tf.tensor2d([input]);
    const saida = model.predict(xs);
    const output = saida.argMax(1).dataSync()[0];
    xs.dispose(); saida.dispose();
    return output;
  }

  // === Lógica e Histórico ===
  let historico = JSON.parse(localStorage.getItem("historicoBlaze") || "[]");
  let acertos = 0, erros = 0, ultimaPrevisao = null, datasetIA = [];

  document.getElementById("btnReset").onclick = () => {
    historico = []; acertos = 0; erros = 0;
    localStorage.removeItem("historicoBlaze");
    datasetIA = [];
    atualizarPainel();
    mostrarAcao("Histórico resetado.");
  };

  function mostrarAcao(msg) {
    const box = document.getElementById("ultimaAcaoBox");
    box.textContent = msg;
    setTimeout(() => box.textContent = "", 5000);
  }

  function entradaParaIA(h) {
    const entrada = h.slice(0, 10).map(x => x.cor / 2); // Normalizado: 0, 0.5, 1
    return entrada.length === 10 ? entrada : null;
  }

  function saidaParaIA(cor) {
    const output = [0, 0, 0];
    output[cor] = 1;
    return output;
  }

  function logicaTradicional(h) {
    if (h.length < 7) return null;
    const ult7 = h.slice(0, 7).map(x => x.cor);
    const count = (arr, val) => arr.filter(x => x === val).length;
    const pretos = count(ult7, 2);
    const vermelhos = count(ult7, 1);

    if (pretos >= 5) return 1;
    if (vermelhos >= 5) return 2;
    if (!h.slice(0, 40).some(x => x.cor === 0)) return 0;

    return pretos > vermelhos ? 1 : 2;
  }

  async function fetchRodada() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const rodada = data[0];
      if (!rodada || historico.length > 0 && historico[0].id === rodada.id) return;

      historico.unshift({ cor: rodada.color, id: rodada.id });
      localStorage.setItem("historicoBlaze", JSON.stringify(historico));

      if (ultimaPrevisao !== null) {
        if (ultimaPrevisao === rodada.color) acertos++;
        else erros++;
      }

      const entrada = entradaParaIA(historico);
      if (entrada) {
        const saida = saidaParaIA(rodada.color);
        datasetIA.push({ entrada, saída: saida });
        if (datasetIA.length >= 20) await treinarIA(datasetIA);
      }

      atualizarPainel();
    } catch (e) {
      console.error("Erro ao buscar rodada:", e);
    }
  }

  function atualizarPainel() {
    const entradaIA = entradaParaIA(historico);
    const prevIA = entradaIA ? preverIA(entradaIA) : null;
    const prevTradicional = logicaTradicional(historico);

    let final = null;
    if (prevIA !== null && prevIA === prevTradicional) {
      final = prevIA;
    }

    ultimaPrevisao = final;

    const sugestaoBox = document.getElementById("sugestaoBox");
    if (final === null) {
      sugestaoBox.textContent = "⌛ Aguardando dados...";
      sugestaoBox.style.background = "#333";
    } else {
      const corTexto = final === 0 ? "⚪️ Branco (Proteção)" : final === 1 ? "🔴 Vermelho + ⚪️" : "⚫ Preto + ⚪️";
      sugestaoBox.textContent = `🎯 Apostar: ${corTexto}`;
      sugestaoBox.style.background = final === 0 ? "#fff" : final === 1 ? "red" : "black";
      sugestaoBox.style.color = final === 0 ? "#000" : "#fff";
    }

    const box = document.getElementById("historicoBox");
    box.innerHTML = "";
    historico.slice(0, 12).forEach(h => {
      const div = document.createElement("div");
      div.className = "bolaHist " + (h.cor === 0 ? "brancoHist" : h.cor === 1 ? "vermelhoHist" : "pretoHist");
      box.appendChild(div);
    });

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  await criarModelo();
  fetchRodada();
  setInterval(fetchRodada, 3000);
})();
