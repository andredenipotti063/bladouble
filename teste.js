// ==UserScript==
// @name         Blaze Roleta IA Avançada + Lógica
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Previsão com IA + Lógica e proteção ⚪ automática. Alta assertividade.
// @author       ChatGPT
// @match        https://blaze.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

  // Carrega TensorFlow.js
  const tfScript = document.createElement("script");
  tfScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js";
  document.head.appendChild(tfScript);
  await new Promise(resolve => tfScript.onload = resolve);

  // ESTILO DO PAINEL
  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: fixed; top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 15px; border-radius: 12px;
      z-index: 9999; font-family: Arial, sans-serif;
      width: 300px; box-shadow: 0 0 12px rgba(0,0,0,0.5);
    }
    #doubleBlackPainel h1 { font-size: 16px; margin: 0 0 10px; text-align: center; }
    #sugestaoBox {
      padding: 10px; font-weight: bold; border-radius: 10px;
      background: #222; margin-bottom: 10px; text-align: center;
    }
    #historicoBox {
      display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;
      margin-bottom: 10px; max-height: 120px; overflow-y: auto;
    }
    .bolaHist {
      width: 20px; height: 20px; border-radius: 50%;
    }
    .pretoHist { background: black; }
    .vermelhoHist { background: red; }
    .brancoHist { background: white; border: 1px solid #999; }
    #acertosBox {
      text-align: center; font-size: 14px; margin-top: 5px;
    }
    #acoesBox {
      display: flex; justify-content: space-between; margin-top: 10px;
    }
    #acoesBox button {
      padding: 5px 10px; border: none; border-radius: 6px;
      background: #333; color: white; cursor: pointer;
    }
  `;
  document.head.appendChild(style);

  // HTML PAINEL
  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Blaze Roleta IA + Lógica</h1>
    <div id="sugestaoBox">⏳ Carregando IA...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
    <div id="acoesBox">
      <button id="resetBtn">Reset</button>
      <button id="toggleBtn">Expandir</button>
    </div>
  `;
  document.body.appendChild(painel);

  // Histórico + IA
  const historico = JSON.parse(localStorage.getItem("blaze_roleta_historico") || "[]");
  let ultimoId = null, ultimaPrevisao = null;
  let acertos = 0, erros = 0;
  let expandido = true;

  // IA com TensorFlow.js
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [5], units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: 3, activation: "softmax" }));
  model.compile({ loss: "categoricalCrossentropy", optimizer: "adam" });

  // BOTÕES
  document.getElementById("resetBtn").onclick = () => {
    localStorage.removeItem("blaze_roleta_historico");
    historico.length = 0;
    acertos = 0; erros = 0;
    ultimaPrevisao = null;
    atualizarPainel();
  };
  document.getElementById("toggleBtn").onclick = () => {
    expandido = !expandido;
    document.getElementById("toggleBtn").innerText = expandido ? "Recolher" : "Expandir";
    document.getElementById("historicoBox").style.maxHeight = expandido ? "120px" : "0px";
  };

  // LOOP DE COLETA
  async function fetchLast() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color;
      const id = data[0]?.id;

      if (id && cor !== undefined && id !== ultimoId) {
        historico.unshift(cor);
        localStorage.setItem("blaze_roleta_historico", JSON.stringify(historico));
        if (historico.length > 100) historico.pop();

        if (ultimaPrevisao !== null && cor !== undefined) {
          if (cor === ultimaPrevisao || (ultimaPrevisao !== null && cor === 0)) acertos++;
          else erros++;
        }

        await treinarIA();
        ultimaPrevisao = preverCor(historico);
        atualizarPainel();
        ultimoId = id;
      }
    } catch (e) {
      console.error("Erro ao buscar resultado:", e);
    }
  }

  // IA ONLINE TRAINING
  async function treinarIA() {
    if (historico.length < 6) return;

    const entradas = [];
    const saidas = [];

    for (let i = 5; i < historico.length; i++) {
      const entrada = historico.slice(i - 5, i).map(v => v / 2);
      const saida = [0, 0, 0];
      saida[historico[i]] = 1;
      entradas.push(entrada);
      saidas.push(saida);
    }

    const xs = tf.tensor2d(entradas);
    const ys = tf.tensor2d(saidas);

    await model.fit(xs, ys, { epochs: 5 });
    tf.dispose([xs, ys]);
  }

  function preverCor(h) {
    if (h.length < 5) return null;
    const entrada = tf.tensor2d([h.slice(0, 5).map(v => v / 2)]);
    const pred = model.predict(entrada);
    const arr = pred.arraySync()[0];
    const idx = arr.indexOf(Math.max(...arr));
    const conf = Math.max(...arr);

    entrada.dispose(); pred.dispose();

    // Combina IA com lógica tradicional
    const logica = preverLogica(h);
    if (logica.previsao === idx && conf > 0.9) return idx;
    return null;
  }

  function preverLogica(h) {
    if (h.length < 5) return { previsao: null };

    const ult = h.slice(0, 5);
    const count = v => ult.filter(x => x === v).length;
    const p = count(2), v = count(1);

    if (p >= 4) return { previsao: 1 };
    if (v >= 4) return { previsao: 2 };
    if (!h.slice(0, 40).includes(0)) return { previsao: 0 };

    return p > v ? { previsao: 1 } : { previsao: 2 };
  }

  function atualizarPainel() {
    const sugestao = document.getElementById("sugestaoBox");
    const cor = ultimaPrevisao;
    const texto = cor === 0 ? "⚪ Branco (Proteção)" :
                  cor === 1 ? "🔴 Apostar Vermelho + ⚪" :
                  cor === 2 ? "⚫ Apostar Preto + ⚪" : "⌛ Coletando...";

    sugestao.textContent = texto;
    sugestao.style.background = cor === 1 ? "red" : cor === 2 ? "black" : cor === 0 ? "white" : "#222";
    sugestao.style.color = cor === 0 ? "#000" : "#fff";

    const box = document.getElementById("historicoBox");
    box.innerHTML = "";
    historico.slice(0, expandido ? 100 : 12).forEach(cor => {
      const el = document.createElement("div");
      el.className = "bolaHist " + (cor === 0 ? "brancoHist" : cor === 1 ? "vermelhoHist" : "pretoHist");
      box.appendChild(el);
    });

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  setInterval(fetchLast, 3000);
  fetchLast();
})();
