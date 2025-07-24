// ==UserScript==
// @name         Blaze Roleta com IA (Previsão Inteligente + Proteção ⚪)
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  IA com TensorFlow.js + proteção ⚪ apenas com alta confiança. Painel limpo e previsões somente quando há entrada válida.
// @author       chatGPT
// @match        https://blaze.com/pt/games/double
// @icon         https://www.google.com/s2/favicons?sz=64&domain=blaze.com
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.18.0/dist/tf.min.js
// ==/UserScript==

(function () {
  if (window.doubleBlazePainelIA) return;
  window.doubleBlazePainelIA = true;

  const CORES = ['⚪', '🔴', '⚫'];
  const corNome = ['Branco', 'Vermelho', 'Preto'];
  const apiURL = 'https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1';
  const intervaloColeta = 4000;

  let historico = JSON.parse(localStorage.getItem('historicoBlazeIA') || '[]');
  let modeloIA = null;

  // Interface
  const painel = document.createElement('div');
  painel.id = 'painelIA';
  painel.style = `
    position: fixed; top: 20px; left: 20px;
    background: #111; color: white;
    padding: 12px 16px; font-family: Arial;
    border-radius: 12px;
    z-index: 9999; box-shadow: 0 0 10px #000;
    max-width: 240px;
  `;
  painel.innerHTML = `
    <div style="font-size: 16px; font-weight: bold;">🔮 Blaze IA</div>
    <div id="previsaoBlaze" style="margin: 6px 0; font-size: 15px; color: #0f0;"></div>
    <div id="historicoBlaze" style="font-size: 13px; margin-top: 6px;"></div>
    <div id="contadorBlaze" style="font-size: 12px; color: #999;">Jogadas coletadas: 0</div>
  `;
  document.body.appendChild(painel);

  function atualizarHistoricoDisplay() {
    const h = historico.map(c => CORES[c]).join(' ');
    document.getElementById('historicoBlaze').textContent = h;
    document.getElementById('contadorBlaze').textContent = `Jogadas coletadas: ${historico.length}`;
  }

  function treinarIA() {
    if (historico.length < 6) return;
    const xs = [], ys = [];
    for (let i = 0; i < historico.length - 5; i++) {
      xs.push(historico.slice(i, i + 5));
      ys.push(historico[i + 5]);
    }
    const input = tf.tensor2d(xs, [xs.length, 5]);
    const output = tf.oneHot(tf.tensor1d(ys, 'int32'), 3);
    modeloIA = tf.sequential();
    modeloIA.add(tf.layers.dense({ units: 10, inputShape: [5], activation: 'relu' }));
    modeloIA.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
    modeloIA.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });
    modeloIA.fit(input, output, { epochs: 20, verbose: 0 });
  }

  async function preverProximaCor() {
    if (!modeloIA || historico.length < 5) return;
    const entrada = tf.tensor2d([historico.slice(-5)], [1, 5]);
    const saida = modeloIA.predict(entrada);
    const valores = await saida.data();
    const indexMax = valores.indexOf(Math.max(...valores));
    const confianca = valores[indexMax];

    const ultimaIA = indexMax;
    const logicaTradicional = historico.slice(-3).every(c => c === historico[historico.length - 1])
      ? 3 - historico[historico.length - 1]
      : historico[historico.length - 1];

    const previsao = (ultimaIA === logicaTradicional && confianca > 0.9) ? ultimaIA : null;

    const campo = document.getElementById('previsaoBlaze');
    if (previsao === null) {
      campo.textContent = '';
      return;
    }

    let texto = `✅ Apostar: ${corNome[previsao]}`;
    if (previsao === 1 || previsao === 2) texto += ' + ⚪';
    campo.textContent = texto;
  }

  async function coletarNovaJogada() {
    try {
      const res = await fetch(apiURL);
      const data = await res.json();
      const cor = data[0]?.color;
      if (typeof cor !== 'number') return;

      if (historico[historico.length - 1] !== cor) {
        historico.push(cor);
        localStorage.setItem('historicoBlazeIA', JSON.stringify(historico));
        atualizarHistoricoDisplay();
        treinarIA();
        preverProximaCor();
      }
    } catch (e) {
      console.error('Erro ao coletar:', e);
    }
  }

  atualizarHistoricoDisplay();
  setInterval(coletarNovaJogada, intervaloColeta);
})();
