// ==UserScript==
// @name         Blaze Roleta IA + Proteção (TensorFlow.js)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  IA real com proteção automática no branco, lógica tradicional e painel interativo (desktop + mobile)
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// ==/UserScript==

(async function () {
  if (window.hasRunBlazeIAFinal) return;
  window.hasRunBlazeIAFinal = true;

  const tfScript = document.createElement('script');
  tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.14.0/dist/tf.min.js';
  document.head.appendChild(tfScript);
  await new Promise(res => tfScript.onload = res);

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const style = document.createElement("style");
  style.innerHTML = `
    #blazePainelIA {
      position: fixed; top: 30px; left: 30px; background: #111; color: #fff;
      padding: 15px; border-radius: 10px; z-index: 9999; font-family: Arial;
      width: 310px; box-shadow: 0 0 10px rgba(0,0,0,0.4);
    }
    #blazePainelIA h1 { margin: 0 0 10px; font-size: 16px; text-align: center; }
    #sugestaoBox { padding: 10px; text-align: center; font-weight: bold;
      border-radius: 8px; background-color: #222; margin-bottom: 10px;
    }
    #historicoBox {
      display: flex; gap: 4px; flex-wrap: wrap;
      justify-content: center; margin-bottom: 10px; max-height: 50px;
      overflow-y: hidden; transition: max-height 0.3s ease;
    }
    .bolaHist { width: 20px; height: 20px; border-radius: 50%; }
    .pretoHist { background: black; }
    .vermelhoHist { background: red; }
    .brancoHist { background: white; border: 1px solid #999; }
    #btnReset, #btnToggleHist {
      background: #444; color: white; padding: 5px 10px;
      border-radius: 6px; margin: 5px; cursor: pointer; border: none;
    }
    #contadores { text-align: center; font-size: 14px; margin-top: 5px; }
    #ultimaAcaoBox { text-align: center; font-size: 12px; margin-top: 5px; color: #ccc; }
  `;
  document.head.appendChild(style);

  const painel = document.createElement("div");
  painel.id = "blazePainelIA";
  painel.innerHTML = `
    <h1>🔮 Blaze IA + Proteção ⚪</h1>
    <div id="sugestaoBox">⏳ Esperando 20 resultados para iniciar a IA…</div>
    <div id="historicoBox"></div>
    <div style="text-align: center;">
      <button id="btnToggleHist">⬇️ Expandir Histórico</button>
      <button id="btnReset">🔁 Resetar Histórico</button>
    </div>
    <div id="contadores">Jogadas: 0 | ✅ 0 | ❌ 0 | 🎯 0%</div>
    <div id="ultimaAcaoBox"></div>
  `;
  document.body.appendChild(painel);

  let historico = JSON.parse(localStorage.getItem("historicoBlazeIA") || "[]");
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;
  let expandido = false;

  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [7], units: 20, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 10, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
  model.compile({ loss: 'categoricalCrossentropy', optimizer: 'adam' });

  function mostrarAcao(msg) {
    const box = document.getElementById("ultimaAcaoBox");
    box.textContent = msg;
    setTimeout(() => { box.textContent = ""; }, 4000);
  }

  document.getElementById("btnReset").onclick = () => {
    historico = [];
    acertos = 0; erros = 0;
    ultimaPrevisao = null;
    localStorage.removeItem("historicoBlazeIA");
    atualizarPainel();
    mostrarAcao("Histórico resetado.");
  };

  document.getElementById("btnToggleHist").onclick = () => {
    expandido = !expandido;
    const box = document.getElementById("historicoBox");
    box.style.maxHeight = expandido ? "500px" : "50px";
    document.getElementById("btnToggleHist").innerText = expandido ? "⬆️ Recolher Histórico" : "⬇️ Expandir Histórico";
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
        if (color === ultimaPrevisao || color === 0) {
          acertos++;
        } else {
          erros++;
        }
      }

      await treinarIA();
      atualizarPainel();
    } catch (e) {
      console.error("Erro ao buscar resultados:", e);
    }
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
    await model.fit(xs, ys, { epochs: 3 });
    xs.dispose(); ys.dispose();
  }

  async function preverIA() {
    if (historico.length < 7) return { cor: null, confianca: 0 };
    const input = tf.tensor2d([historico.slice(0, 7).map(x => x.cor / 2)]);
    const pred = model.predict(input);
    const data = await pred.data();
    const index = data.indexOf(Math.max(...data));
    const confianca = data[index];
    input.dispose(); pred.dispose();
    return { cor: index, confianca };
  }

  async function atualizarPainel() {
    const ult = historico.slice(0, 100).map(x => x.cor);
    const prevTrad = preverTradicional(historico);
    const { cor: prevIA, confianca } = await preverIA();

    const sugestao = document.getElementById("sugestaoBox");

    if (historico.length < 20) {
      sugestao.textContent = "⏳ Esperando 20 resultados para iniciar a IA…";
      sugestao.style.background = "#333";
      return;
    }

    if (prevIA !== null && prevIA === prevTrad && confianca > 0.9) {
      ultimaPrevisao = prevIA;
      const corNome = ["⚪ Branco", "🔴 Vermelho", "⚫ Preto"][prevIA];
      sugestao.innerHTML = `${corNome} + ⚪ Proteção`;
      sugestao.style.background = ["white", "red", "black"][prevIA];
      sugestao.style.color = prevIA === 0 ? "#000" : "#fff";
    } else {
      ultimaPrevisao = null;
      sugestao.textContent = "⌛ Sem previsão com alta confiança.";
      sugestao.style.background = "#444";
    }

    const box = document.getElementById("historicoBox");
    box.innerHTML = "";
    ult.forEach(n => {
      const el = document.createElement("div");
      el.className = "bolaHist " + (n === 0 ? "brancoHist" : n === 2 ? "pretoHist" : "vermelhoHist");
      box.appendChild(el);
    });

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("contadores").textContent =
      `Jogadas: ${historico.length} | ✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  fetchUltimo();
  setInterval(fetchUltimo, 3500);
})();
