// ==UserScript==
// @name         Blaze Roleta IA com TensorFlow.js + Proteção no Branco
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Previsão com IA + Lógica tradicional + Proteção ⚪ + Aprendizado online + Histórico expandível
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// ==/UserScript==

(async function () {
  if (window.hasRunBlazeIA) return;
  window.hasRunBlazeIA = true;

  const tfScript = document.createElement('script');
  tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.14.0/dist/tf.min.js';
  document.head.appendChild(tfScript);
  await new Promise(res => tfScript.onload = res);

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const HIST_LIMIT_PADRAO = 12;

  let historico = JSON.parse(localStorage.getItem("historicoBlazeIA") || "[]");
  let acertos = 0, erros = 0, ultimaPrevisao = null, expandirHistorico = false;

  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [7], units: 20, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 10, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
  model.compile({ loss: 'categoricalCrossentropy', optimizer: 'adam' });

  // Estilo do painel
  const style = document.createElement("style");
  style.innerHTML = `
    #blazePainelIA {
      position: fixed; top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 15px; border-radius: 10px;
      z-index: 9999; font-family: Arial, sans-serif;
      width: 320px; box-shadow: 0 0 10px rgba(0,0,0,0.4); cursor: move;
    }
    #blazePainelIA h1 { margin: 0 0 10px; font-size: 16px; text-align: center; }
    #sugestaoBox { padding: 10px; text-align: center; font-weight: bold;
      border-radius: 8px; background-color: #222; margin-bottom: 10px; }
    #historicoBox { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; margin-bottom: 10px; max-height: 100px; overflow-y: auto; }
    .bolaHist { width: 20px; height: 20px; border-radius: 50%; }
    .pretoHist { background: black; }
    .vermelhoHist { background: red; }
    .brancoHist { background: white; border: 1px solid #999; }
    #acertosBox, #contadorBox { text-align: center; font-size: 14px; margin-top: 5px; }
    #ultimaAcaoBox { text-align: center; font-size: 12px; margin-top: 5px; color: #ccc; }
    #btnReset, #btnExpandir {
      background: #444; color: white; padding: 5px 10px;
      border-radius: 6px; margin: 5px auto 0;
      display: block; cursor: pointer; text-align: center; border: none;
      width: 90%;
    }
  `;
  document.head.appendChild(style);

  // Painel
  const painel = document.createElement("div");
  painel.id = "blazePainelIA";
  painel.innerHTML = `
    <h1>🔮 Blaze IA + Lógica</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="contadorBox">Coletados: 0</div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
    <div id="ultimaAcaoBox"></div>
    <button id="btnExpandir">🔼 Expandir Histórico</button>
    <button id="btnReset">🔁 Resetar Histórico</button>
  `;
  document.body.appendChild(painel);

  // Movimento do painel
  let isDragging = false, startX, startY, initialLeft, initialTop;
  painel.addEventListener("mousedown", e => {
    e.preventDefault(); isDragging = true;
    startX = e.clientX; startY = e.clientY;
    initialLeft = painel.offsetLeft; initialTop = painel.offsetTop;
  });
  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    painel.style.left = initialLeft + (e.clientX - startX) + "px";
    painel.style.top = initialTop + (e.clientY - startY) + "px";
  });
  document.addEventListener("mouseup", () => isDragging = false);

  // Touch para celular
  painel.addEventListener("touchstart", e => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      isDragging = true;
      startX = t.clientX;
      startY = t.clientY;
      initialLeft = painel.offsetLeft;
      initialTop = painel.offsetTop;
    }
  }, { passive: false });
  document.addEventListener("touchmove", e => {
    if (isDragging && e.touches.length === 1) {
      const t = e.touches[0];
      painel.style.left = initialLeft + (t.clientX - startX) + "px";
      painel.style.top = initialTop + (t.clientY - startY) + "px";
    }
  }, { passive: false });
  document.addEventListener("touchend", () => isDragging = false);

  function mostrarAcao(msg) {
    const box = document.getElementById("ultimaAcaoBox");
    box.textContent = msg;
    setTimeout(() => { box.textContent = ""; }, 5000);
  }

  document.getElementById("btnReset").onclick = () => {
    historico = [];
    acertos = 0; erros = 0;
    localStorage.removeItem("historicoBlazeIA");
    mostrarAcao("Histórico resetado.");
    atualizarPainel();
  };

  document.getElementById("btnExpandir").onclick = () => {
    expandirHistorico = !expandirHistorico;
    document.getElementById("btnExpandir").textContent = expandirHistorico ? "🔽 Recolher Histórico" : "🔼 Expandir Histórico";
    atualizarPainel();
  };

  function preverTradicional(h) {
    if (h.length < 7) return null;
    const ult7 = h.slice(0, 7).map(x => x.cor);
    const count = (arr, val) => arr.filter(n => n === val).length;
    const pretos = count(ult7, 2), vermelhos = count(ult7, 1);
    if (pretos >= 5) return 1;
    if (vermelhos >= 5) return 2;
    return pretos > vermelhos ? 1 : 2;
  }

  async function treinarIA() {
    if (historico.length < 20) return;
    const entradas = [], saidas = [];
    for (let i = 7; i < historico.length; i++) {
      const input = historico.slice(i - 7, i).map(x => x.cor / 2);
      const output = [0, 0, 0];
      output[historico[i].cor] = 1;
      entradas.push(input);
      saidas.push(output);
    }
    const xs = tf.tensor2d(entradas);
    const ys = tf.tensor2d(saidas);
    await model.fit(xs, ys, { epochs: 2 });
    xs.dispose(); ys.dispose();
  }

  async function preverIA() {
    if (historico.length < 7) return null;
    const input = tf.tensor2d([historico.slice(0, 7).map(x => x.cor / 2)]);
    const pred = model.predict(input);
    const data = await pred.data();
    const conf = Math.max(...data);
    const index = data.indexOf(conf);
    input.dispose(); pred.dispose();
    return conf >= 0.9 ? index : null;
  }

  async function fetchUltimo() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const { id, color } = data[0];
      if (!id || color === undefined) return;
      if (historico[0]?.id === id) return;

      historico.unshift({ cor: color, id });
      localStorage.setItem("historicoBlazeIA", JSON.stringify(historico));

      if (ultimaPrevisao !== null) {
        if (color === ultimaPrevisao || (ultimaPrevisao !== 0 && color === 0)) {
          acertos++;
        } else {
          erros++;
        }
      }

      await treinarIA();
      atualizarPainel();
    } catch (e) {
      console.error("Erro:", e);
    }
  }

  async function atualizarPainel() {
    const ult = historico.slice(0, expandirHistorico ? historico.length : HIST_LIMIT_PADRAO).map(x => x.cor);
    const prevTrad = preverTradicional(historico);
    const prevIA = await preverIA();

    const sugestao = document.getElementById("sugestaoBox");
    let texto = "⏳ Coletando dados...", corTexto = "#333";

    if (historico.length < 20) {
      texto = `⏳ Esperando ${20 - historico.length} resultados...`;
    } else if (prevIA !== null && prevIA === prevTrad) {
      ultimaPrevisao = prevIA;
      texto = ["⚪ Branco", "🔴 Vermelho + ⚪", "⚫ Preto + ⚪"][prevIA];
      corTexto = ["white", "red", "black"][prevIA];
    } else {
      ultimaPrevisao = null;
    }

    sugestao.textContent = texto;
    sugestao.style.background = corTexto;
    sugestao.style.color = corTexto === "white" ? "#000" : "#fff";

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
    document.getElementById("contadorBox").textContent = `Coletados: ${historico.length}`;
  }

  fetchUltimo();
  setInterval(fetchUltimo, 3500);
})();
