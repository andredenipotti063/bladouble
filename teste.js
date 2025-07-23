// ==UserScript==
// @name         Blaze Roleta IA + Proteção ⚪
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Previsões inteligentes para Roleta Blaze com IA + lógica tradicional + proteção automática no branco
// @author       ChatGPT
// @match        https://blaze.bet/*
// @grant        none
// ==/UserScript==

(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

  // Carregar TensorFlow.js
  const tfScript = document.createElement("script");
  tfScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js";
  document.head.appendChild(tfScript);
  await new Promise(resolve => tfScript.onload = resolve);

  // Estilo
  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: fixed; top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 15px; border-radius: 10px;
      z-index: 9999; font-family: Arial, sans-serif;
      width: 290px; box-shadow: 0 0 10px rgba(0,0,0,0.4); cursor: move;
    }
    #doubleBlackPainel h1 { margin: 0 0 10px; font-size: 16px; text-align: center; }
    #sugestaoBox {
      padding: 10px; text-align: center;
      font-weight: bold; border-radius: 8px;
      background-color: #222; margin-bottom: 10px;
    }
    #historicoBox {
      display: flex; gap: 4px; flex-wrap: wrap;
      justify-content: center; margin-bottom: 10px;
      max-height: 80px; overflow-y: auto;
    }
    .bolaHist { width: 20px; height: 20px; border-radius: 50%; }
    .pretoHist { background: black; }
    .vermelhoHist { background: red; }
    .brancoHist { background: white; border: 1px solid #999; }
    #acertosBox, #contadorBox { text-align: center; font-size: 13px; margin-top: 5px; }
    #botoesControle { text-align: center; margin-top: 8px; }
    #botoesControle button {
      background: #333; color: white; border: none; padding: 5px 10px;
      border-radius: 5px; margin: 0 3px; cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // HTML Painel
  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Esperando 5 resultados para iniciar a IA…</div>
    <div id="contadorBox">Coletados: 0</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
    <div id="botoesControle">
      <button id="btnExpandir">Expandir</button>
      <button id="btnResetar">Resetar</button>
    </div>
  `;
  document.body.appendChild(painel);

  // Arrastar painel
  let isDragging = false, startX, startY, initialLeft, initialTop;
  painel.addEventListener("mousedown", e => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = painel.offsetLeft;
    initialTop = painel.offsetTop;
  });
  document.addEventListener("mousemove", e => {
    if (isDragging) {
      painel.style.left = `${initialLeft + e.clientX - startX}px`;
      painel.style.top = `${initialTop + e.clientY - startY}px`;
    }
  });
  document.addEventListener("mouseup", () => isDragging = false);

  // Variáveis
  const historico = JSON.parse(localStorage.getItem("historicoBlaze") || "[]");
  let ultimoId = null, ultimaPrevisao = null;
  let acertos = 0, erros = 0, expandido = false;

  // IA TensorFlow.js
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [5], units: 10, activation: "relu" }));
  model.add(tf.layers.dense({ units: 3, activation: "softmax" }));
  model.compile({ optimizer: "adam", loss: "categoricalCrossentropy", metrics: ["accuracy"] });

  async function treinarIA() {
    if (historico.length < 6) return;

    const xs = [];
    const ys = [];
    for (let i = 0; i < historico.length - 5; i++) {
      const entrada = historico.slice(i, i + 5);
      const saida = historico[i + 5];
      xs.push(entrada);
      ys.push([saida === 0 ? 1 : 0, saida === 1 ? 1 : 0, saida === 2 ? 1 : 0]);
    }

    const inputTensor = tf.tensor2d(xs);
    const outputTensor = tf.tensor2d(ys);
    await model.fit(inputTensor, outputTensor, { epochs: 15, batchSize: 4, shuffle: true });
  }

  async function obterPrevisaoIA() {
    if (historico.length < 5) return null;
    const entrada = tf.tensor2d([historico.slice(-5)]);
    const resultado = model.predict(entrada);
    const dados = await resultado.data();
    const confianca = Math.max(...dados);
    const cor = dados.indexOf(confianca);
    return { cor, confianca };
  }

  async function buscarResultado() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const rodada = data[0];
      if (!rodada || rodada.id === ultimoId) return;

      const cor = rodada.color;
      historico.push(cor);
      localStorage.setItem("historicoBlaze", JSON.stringify(historico));
      if (historico.length > 1000) historico.shift(); // nunca apagar o mais antigo, apenas se ultrapassar 1000

      if (ultimaPrevisao !== null) {
        if (cor === ultimaPrevisao || cor === 0) acertos++;
        else erros++;
      }

      await treinarIA();
      ultimaPrevisao = null;
      atualizarPainel();
      ultimoId = rodada.id;
    } catch (e) {
      console.error("Erro ao buscar resultado:", e);
    }
  }

  async function atualizarPainel() {
    document.getElementById("contadorBox").innerText = `Coletados: ${historico.length}`;
    const box = document.getElementById("historicoBox");
    box.innerHTML = "";
    const ult = expandido ? historico : historico.slice(-12);
    ult.forEach(n => {
      const div = document.createElement("div");
      div.className = "bolaHist " + (n === 0 ? "brancoHist" : n === 1 ? "vermelhoHist" : "pretoHist");
      box.appendChild(div);
    });

    const sugestao = document.getElementById("sugestaoBox");
    if (historico.length < 5) {
      sugestao.textContent = "⏳ Esperando 5 resultados para iniciar a IA…";
      sugestao.style.background = "#222";
      return;
    }

    const ia = await obterPrevisaoIA();
    const regra = preverTradicional(historico);
    if (!ia || ia.confianca < 0.9 || ia.cor !== regra) {
      sugestao.textContent = "🤖 IA sem alta confiança ainda...";
      sugestao.style.background = "#444";
      return;
    }

    ultimaPrevisao = ia.cor;
    const texto = ia.cor === 0 ? "⚪ Proteção no Branco" : ia.cor === 1 ? "🔴 Entrar Vermelho + ⚪" : "⚫ Entrar Preto + ⚪";
    sugestao.textContent = texto;
    sugestao.style.background = ia.cor === 0 ? "white" : ia.cor === 1 ? "red" : "black";
    sugestao.style.color = ia.cor === 0 ? "#000" : "#fff";

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("acertosBox").innerText = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  function preverTradicional(h) {
    const ult5 = h.slice(-5);
    const pretos = ult5.filter(n => n === 2).length;
    const vermelhos = ult5.filter(n => n === 1).length;
    return pretos > vermelhos ? 2 : 1;
  }

  document.getElementById("btnExpandir").onclick = () => {
    expandido = !expandido;
    document.getElementById("btnExpandir").innerText = expandido ? "Recolher" : "Expandir";
    atualizarPainel();
  };

  document.getElementById("btnResetar").onclick = () => {
    localStorage.removeItem("historicoBlaze");
    historico.length = 0;
    acertos = erros = 0;
    atualizarPainel();
  };

  setInterval(buscarResultado, 3000);
  buscarResultado();
})();
