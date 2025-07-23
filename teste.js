// ==UserScript==
// @name         Blaze Roleta IA + Proteção ⚪ + Histórico Completo
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  IA real com TensorFlow.js + lógica tradicional combinadas com previsão ⚪ Protegida, histórico persistente e confiável — compatível com PC e celular
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// ==/UserScript==

(async function () {
  if (window.hasRunBlazeIA) return;
  window.hasRunBlazeIA = true;

  // Carregar TensorFlow.js
  const tfScript = document.createElement('script');
  tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.14.0/dist/tf.min.js';
  document.head.appendChild(tfScript);
  await new Promise(res => tfScript.onload = res);

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const HIST_LIMIT_PADRAO = 12;
  let historico = JSON.parse(localStorage.getItem("historicoBlazeIA") || "[]");

  // Reset se histórico corrompido
  if (!Array.isArray(historico) || historico.some(h => typeof h.cor !== "number")) {
    historico = [];
    localStorage.removeItem("historicoBlazeIA");
  }

  let acertos = 0, erros = 0, ultimaPrevisao = null, expandirHistorico = false;

  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [7], units: 20, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 10, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
  model.compile({ loss: 'categoricalCrossentropy', optimizer: 'adam' });

  // Criar painel
  const painel = document.createElement("div");
  painel.id = "painelBlazeIA";
  painel.innerHTML = `
    <div id="sugestaoBox">⏳ Coletando dados...</div>
    <div id="historicoBox"></div>
    <div id="estatisticas">
      <div><b>Jogadas:</b> <span id="contador">0</span></div>
      <div><b>Taxa de Acerto:</b> <span id="taxa">0%</span></div>
    </div>
    <div id="botoes">
      <button id="btnExpandir">Expandir Histórico</button>
      <button id="btnReset">Resetar Histórico</button>
    </div>
    <div id="mensagemTemp"></div>
  `;
  document.body.appendChild(painel);

  const style = document.createElement("style");
  style.textContent = `
    #painelBlazeIA {
      position: fixed;
      top: 10px;
      left: 10px;
      background: #111;
      color: white;
      padding: 10px;
      z-index: 9999;
      font-family: Arial;
      width: 250px;
      border: 2px solid #555;
    }
    #sugestaoBox {
      padding: 10px;
      margin-bottom: 10px;
      font-size: 18px;
      text-align: center;
      font-weight: bold;
      background: #333;
      color: white;
    }
    #historicoBox {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 8px;
    }
    .corBox {
      width: 20px;
      height: 20px;
      margin: 1px;
      border-radius: 50%;
    }
    .cor-0 { background: white; border: 1px solid #999; }
    .cor-1 { background: red; }
    .cor-2 { background: black; }
    #estatisticas {
      font-size: 13px;
      margin-bottom: 8px;
    }
    #botoes button {
      margin-right: 5px;
      margin-top: 4px;
      font-size: 11px;
    }
    #mensagemTemp {
      margin-top: 6px;
      font-size: 13px;
      color: yellow;
    }
  `;
  document.head.appendChild(style);

  document.getElementById("btnExpandir").onclick = () => {
    expandirHistorico = !expandirHistorico;
    document.getElementById("btnExpandir").innerText = expandirHistorico ? "Recolher Histórico" : "Expandir Histórico";
    atualizarPainel();
  };

  document.getElementById("btnReset").onclick = () => {
    historico = [];
    localStorage.removeItem("historicoBlazeIA");
    acertos = 0;
    erros = 0;
    ultimaPrevisao = null;
    mostrarMensagem("Histórico resetado.");
    atualizarPainel();
  };

  function mostrarMensagem(msg) {
    const el = document.getElementById("mensagemTemp");
    el.innerText = msg;
    setTimeout(() => el.innerText = "", 5000);
  }

  async function treinarIA() {
    if (historico.length < 8) return;
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
    if (historico.length < 8) return null;
    const entrada = historico.slice(-7).map(x => x.cor / 2);
    const input = tf.tensor2d([entrada]);
    const output = model.predict(input);
    const array = await output.data();
    input.dispose(); output.dispose();

    const max = Math.max(...array);
    if (max < 0.9) return null;
    return array.indexOf(max);
  }

  function preverTradicional(hist) {
    if (hist.length < 3) return null;
    const ultimas = hist.slice(-3).map(h => h.cor);
    const vermelhos = ultimas.filter(c => c === 1).length;
    const pretos = ultimas.filter(c => c === 2).length;
    if (vermelhos >= 2) return 2;
    if (pretos >= 2) return 1;
    return null;
  }

  async function atualizarPainel() {
    const ult = historico.slice(0, expandirHistorico ? historico.length : HIST_LIMIT_PADRAO).map(x => x.cor);
    const prevTrad = preverTradicional(historico);
    const prevIA = await preverIA();

    const sugestao = document.getElementById("sugestaoBox");
    let texto = "⏳ Coletando dados...", corTexto = "#333";

    if (historico.length < 8) {
      texto = `⏳ Esperando ${8 - historico.length} resultados...`;
    } else if (prevIA !== null && prevIA === prevTrad) {
      ultimaPrevisao = prevIA;
      texto = ["⚪", "🔴 + ⚪", "⚫ + ⚪"][prevIA];
      corTexto = ["white", "red", "black"][prevIA];
    } else {
      ultimaPrevisao = null;
    }

    sugestao.textContent = texto;
    sugestao.style.background = corTexto;
    sugestao.style.color = corTexto === "white" ? "#000" : "#fff";

    // histórico
    const hBox = document.getElementById("historicoBox");
    hBox.innerHTML = ult.map(c => `<div class="corBox cor-${c}"></div>`).join("");

    // taxa
    const total = acertos + erros;
    document.getElementById("contador").innerText = historico.length;
    document.getElementById("taxa").innerText = total > 0 ? `${Math.round(acertos * 100 / total)}%` : "0%";
  }

  async function fetchUltimo() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const json = await res.json();
      const color = json[0]?.color;
      const rodada = json[0]?.created_at;

      if (typeof color === "number" && rodada !== historico[0]?.rodada) {
        historico.unshift({ cor: color, rodada });
        localStorage.setItem("historicoBlazeIA", JSON.stringify(historico));

        if (ultimaPrevisao !== null) {
          if (color === ultimaPrevisao || color === 0) {
            acertos++;
            mostrarMensagem("✅ Vitória!");
          } else {
            erros++;
            mostrarMensagem("❌ Derrota!");
          }
        }

        await treinarIA();
        atualizarPainel();
      }
    } catch (e) {
      console.error("Erro ao buscar resultado:", e);
    }
  }

  fetchUltimo();
  setInterval(fetchUltimo, 3500);
})();
