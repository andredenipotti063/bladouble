// ==UserScript==
// @name         IA Roleta Blaze (TensorFlow.js + Lógica) [Mobile/Desktop]
// @namespace    https://blaze.bet/
// @version      3.0
// @description  Previsão de cor com IA + Lógica combinada | Proteção no Branco | Histórico Completo | Painel flutuante móvel | Compatível com celular e PC
// @author       GPT-4
// @match        https://blaze.bet/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(async function() {
  'use strict';

  // === IMPORTA TENSORFLOW.JS
  const tfScript = document.createElement('script');
  tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.16.0/dist/tf.min.js';
  document.head.appendChild(tfScript);
  await new Promise(resolve => tfScript.onload = resolve);

  // === CONFIG
  const CORES = ['⚪', '🔴', '⚫']; // branco, vermelho, preto
  const MAX_HISTORICO_DISPLAY = 50;
  const MIN_PARA_PREVER = 20;
  const JANELA_ENTRADA = 5;
  const CONFIANCA_IA = 0.9;

  // === UTIL
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  // === HISTÓRICO (localStorage persistente)
  let historico = JSON.parse(localStorage.getItem('ia_roleta_historico') || '[]');

  function salvarHistorico() {
    localStorage.setItem('ia_roleta_historico', JSON.stringify(historico));
  }

  function resetarHistorico() {
    historico = [];
    salvarHistorico();
    atualizarHistoricoPainel();
  }

  // === PAINEL
  const painel = document.createElement('div');
  painel.id = 'ia-roleta-painel';
  painel.innerHTML = `
    <style>
      #ia-roleta-painel {
        position: fixed;
        top: 10px;
        left: 10px;
        background: #111;
        color: #fff;
        padding: 10px;
        border-radius: 10px;
        font-family: monospace;
        font-size: 14px;
        z-index: 999999;
        max-width: 300px;
        user-select: none;
      }
      #ia-roleta-painel h2 { margin: 0 0 5px; font-size: 16px; }
      #ia-roleta-historico span { margin-right: 3px; }
      #ia-roleta-pred { font-size: 18px; margin-top: 5px; }
      #ia-roleta-status { color: #0f0; font-size: 12px; margin-top: 5px; }
      #ia-roleta-btns button {
        margin: 5px 5px 0 0;
        font-size: 12px;
      }
      #ia-roleta-msg { margin-top: 5px; color: yellow; font-size: 12px; }
    </style>
    <h2>IA Roleta Blaze</h2>
    <div id="ia-roleta-historico">Histórico: ...</div>
    <div id="ia-roleta-contador">Jogadas coletadas: 0</div>
    <div id="ia-roleta-pred">🕑 Coletando dados...</div>
    <div id="ia-roleta-status"></div>
    <div id="ia-roleta-acertos">✅ 0 | ❌ 0 | 🎯 0%</div>
    <div id="ia-roleta-btns">
      <button id="btn-reset">Resetar Histórico</button>
      <button id="btn-expandir">Expandir</button>
    </div>
    <div id="ia-roleta-msg"></div>
  `;
  document.body.appendChild(painel);

  const elHistorico = document.getElementById('ia-roleta-historico');
  const elContador = document.getElementById('ia-roleta-contador');
  const elPred = document.getElementById('ia-roleta-pred');
  const elStatus = document.getElementById('ia-roleta-status');
  const elAcertos = document.getElementById('ia-roleta-acertos');
  const elMsg = document.getElementById('ia-roleta-msg');

  let expandido = false;
  document.getElementById('btn-expandir').onclick = () => {
    expandido = !expandido;
    atualizarHistoricoPainel();
  };
  document.getElementById('btn-reset').onclick = () => {
    resetarHistorico();
    acertos = 0;
    erros = 0;
    atualizarStats();
  };

  function exibirMensagem(msg) {
    elMsg.textContent = msg;
    setTimeout(() => elMsg.textContent = '', 5000);
  }

  function atualizarHistoricoPainel() {
    const exibir = expandido ? historico : historico.slice(-MAX_HISTORICO_DISPLAY);
    elHistorico.innerHTML = 'Histórico: ' + exibir.map(c => CORES[c]).join(' ');
    elContador.textContent = `Jogadas coletadas: ${historico.length}`;
  }

  let acertos = 0;
  let erros = 0;
  function atualizarStats() {
    const total = acertos + erros;
    const perc = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    elAcertos.textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${perc}%`;
  }

  // === IA MODEL
  let modelo = tf.sequential();
  modelo.add(tf.layers.dense({ inputShape: [JANELA_ENTRADA], units: 10, activation: 'relu' }));
  modelo.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
  modelo.compile({ loss: 'categoricalCrossentropy', optimizer: 'adam' });

  async function treinarIA() {
    if (historico.length < MIN_PARA_PREVER) return;

    const entradas = [];
    const saidas = [];

    for (let i = 0; i <= historico.length - JANELA_ENTRADA - 1; i++) {
      const entrada = historico.slice(i, i + JANELA_ENTRADA);
      const saida = historico[i + JANELA_ENTRADA];
      entradas.push(entrada);
      saidas.push([saida === 0 ? 1 : 0, saida === 1 ? 1 : 0, saida === 2 ? 1 : 0]);
    }

    const xs = tf.tensor2d(entradas);
    const ys = tf.tensor2d(saidas);
    await modelo.fit(xs, ys, { epochs: 20, verbose: 0 });
    xs.dispose();
    ys.dispose();
  }

  function preverIA(seq) {
    const entrada = tf.tensor2d([seq]);
    const pred = modelo.predict(entrada);
    const arr = pred.dataSync();
    entrada.dispose();
    pred.dispose();
    return arr;
  }

  function preverTradicional(ultimos) {
    const freq = [0, 0, 0];
    ultimos.forEach(c => freq[c]++);
    const maior = freq.indexOf(Math.max(...freq));
    return maior;
  }

  // === LOOP PRINCIPAL
  let ultimaCor = null;
  let aguardandoResultado = false;

  async function loopPrincipal() {
    try {
      const res = await fetch('https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1');
      const json = await res.json();
      const cor = json[0]?.color;

      if (cor !== undefined && cor !== ultimaCor) {
        ultimaCor = cor;

        historico.push(cor);
        salvarHistorico();
        atualizarHistoricoPainel();

        if (aguardandoResultado) {
          if (cor === corPrevisto || (corPrevisto === 1 && cor === 0)) {
            acertos++;
            exibirMensagem('✅ Vitória');
          } else {
            erros++;
            exibirMensagem('❌ Derrota');
          }
          atualizarStats();
          aguardandoResultado = false;
        }

        if (historico.length >= MIN_PARA_PREVER) {
          await treinarIA();
          const ultimos = historico.slice(-JANELA_ENTRADA);
          const predIA = preverIA(ultimos);
          const predTrad = preverTradicional(ultimos);

          const idxIA = predIA.indexOf(Math.max(...predIA));
          const confIA = predIA[idxIA];

          if (idxIA === predTrad && confIA >= CONFIANCA_IA) {
            corPrevisto = idxIA;
            aguardandoResultado = true;
            elPred.innerHTML = `🎯 Prever: ${CORES[idxIA]} + ⚪`;
          } else {
            corPrevisto = null;
            elPred.textContent = '🕑 Aguardando padrão...';
          }
        } else {
          elPred.textContent = `🕑 Esperando ${MIN_PARA_PREVER} resultados para iniciar a IA…`;
        }
      }

    } catch (e) {
      console.error('Erro ao buscar API:', e);
      elStatus.textContent = 'Erro na API';
    }

    setTimeout(loopPrincipal, 2500);
  }

  let corPrevisto = null;
  loopPrincipal();
})();
