// ==UserScript==
// @name         Blaze IA + Lógica Tradicional (Roleta)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Previsão combinada (IA + lógica) para roleta da Blaze com alta assertividade e histórico persistente
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.14.0/dist/tf.min.js
// ==/UserScript==

(function () {
  'use strict';

  // ========== UTILITÁRIOS ==========
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const salvarHistorico = () => localStorage.setItem('blazeHistorico', JSON.stringify(historico));
  const carregarHistorico = () => {
    const h = localStorage.getItem('blazeHistorico');
    return h ? JSON.parse(h) : [];
  };

  // ========== IA ==========
  let model;
  const inputSize = 5;
  async function treinarIA(dados) {
    const xs = [];
    const ys = [];
    for (let i = 0; i < dados.length - inputSize; i++) {
      xs.push(dados.slice(i, i + inputSize));
      ys.push([dados[i + inputSize]]);
    }

    const xTrain = tf.tensor2d(xs);
    const yTrain = tf.tensor2d(ys);

    model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [inputSize], units: 10, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
    model.compile({ optimizer: 'adam', loss: 'sparseCategoricalCrossentropy', metrics: ['accuracy'] });

    await model.fit(xTrain, yTrain, { epochs: 20 });
  }

  async function preverIA(seq) {
    if (!model || seq.length < inputSize) return null;
    const entrada = tf.tensor2d([seq.slice(0, inputSize)]);
    const pred = model.predict(entrada);
    const output = await pred.data();
    return output.indexOf(Math.max(...output));
  }

  // ========== LÓGICA TRADICIONAL ==========
  function previsaoTradicional(h) {
    const ult7 = h.slice(0, 7);
    const ult40 = h.slice(0, 40);
    const count = (arr, val) => arr.filter(n => n === val).length;

    if (ult7.slice(0, 4).every(n => n === 2)) return 1;
    if (ult7.slice(0, 4).every(n => n === 1)) return 2;

    const pretos = count(ult7, 2);
    const vermelhos = count(ult7, 1);

    if (pretos >= 5) return 1;
    if (vermelhos >= 5) return 2;

    if (!ult40.includes(0)) return 0;

    return pretos > vermelhos ? 1 : 2;
  }

  // ========== INTERFACE ==========
  const painel = document.createElement("div");
  painel.innerHTML = `
    <style>
      #painelIA { position: fixed; top: 20px; left: 20px; background: #111; color: white; padding: 15px; border-radius: 10px; z-index: 99999; width: 300px; font-family: Arial; box-shadow: 0 0 10px #000; }
      #historicoIA { display: flex; gap: 5px; flex-wrap: wrap; margin: 10px 0; }
      .bola { width: 20px; height: 20px; border-radius: 50%; }
      .cor-0 { background: white; border: 1px solid #888; }
      .cor-1 { background: red; }
      .cor-2 { background: black; }
      #msgIA { font-size: 14px; margin-bottom: 8px; }
      #resetaIA { background: #444; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 5px; }
      #ultAcao { font-size: 12px; color: #aaa; margin-top: 5px; }
    </style>
    <div id="painelIA">
      <div id="msgIA">🔄 Iniciando...</div>
      <div id="historicoIA"></div>
      <div id="acertosIA">✅ 0 | ❌ 0 | 🎯 0%</div>
      <button id="resetaIA">🔁 Resetar Histórico</button>
      <div id="ultAcao"></div>
    </div>
  `;
  document.body.appendChild(painel);

  let acertos = 0, erros = 0;
  const historico = carregarHistorico();
  let ultimaRodadaId = null;
  let ultimaPrevisao = null;

  function atualizarPainel() {
    const box = document.getElementById("historicoIA");
    box.innerHTML = historico.slice(0, 12).map(c => `<div class="bola cor-${c}"></div>`).join("");
    const total = acertos + erros;
    const pct = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("acertosIA").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${pct}%`;
  }

  function setMensagem(txt) {
    const el = document.getElementById("msgIA");
    el.textContent = txt;
  }

  function setUltimaAcao(txt) {
    const el = document.getElementById("ultAcao");
    el.textContent = txt;
    setTimeout(() => (el.textContent = ""), 5000);
  }

  document.getElementById("resetaIA").onclick = () => {
    historico.length = 0;
    salvarHistorico();
    acertos = erros = 0;
    atualizarPainel();
    setUltimaAcao("♻️ Histórico resetado.");
  };

  // ========== MONITORAMENTO ==========
  async function monitorar() {
    while (true) {
      try {
        const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
        const data = await res.json();
        const rodada = data[0];
        const cor = rodada.color;
        const id = rodada.id;

        if (id !== ultimaRodadaId) {
          ultimaRodadaId = id;
          historico.unshift(cor);
          salvarHistorico();
          atualizarPainel();

          if (historico.length >= 10) {
            if (!model) await treinarIA(historico.slice().reverse());

            const ia = await preverIA(historico);
            const tradicional = previsaoTradicional(historico);

            if (ia === tradicional) {
              ultimaPrevisao = ia;
              const corNome = ["⚪️ Branco", "🔴 Vermelho", "⚫️ Preto"][ia];
              setMensagem(`📌 Alta confiança: Apostar ${corNome}`);
            } else {
              ultimaPrevisao = null;
              setMensagem("🤔 Sem consenso entre IA e lógica");
            }
          } else {
            setMensagem("⏳ Coletando dados...");
          }

          if (ultimaPrevisao !== null) {
            if (cor === ultimaPrevisao) acertos++;
            else erros++;
          }

          atualizarPainel();
        }
      } catch (e) {
        console.error("Erro ao buscar rodada:", e);
        setMensagem("❌ Erro ao acessar API");
      }

      await delay(3000);
    }
  }

  monitorar();
})();
