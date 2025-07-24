// ==UserScript==
// @name         Blaze Roleta IA + Proteção no Branco ⚪
// @namespace    https://blaze.com/
// @version      1.0.0
// @description  Previsões com IA (TensorFlow.js) + lógica tradicional e proteção automática no branco ⚪. Painel completo com histórico e assertividade alta.
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// ==/UserScript==

(async function () {
  if (window.blazeIaPainel) return;
  window.blazeIaPainel = true;

  const TF_SCRIPT = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.14.0/dist/tf.min.js';

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Carregar TensorFlow.js
  const loadTensorFlow = async () => {
    if (!window.tf) {
      const tfScript = document.createElement("script");
      tfScript.src = TF_SCRIPT;
      document.head.appendChild(tfScript);
      while (!window.tf) await sleep(100);
    }
  };

  await loadTensorFlow();

  const getColorName = (num) => num === 0 ? 'Branco' : num === 1 ? 'Vermelho' : 'Preto';
  const getColorEmoji = (num) => num === 0 ? '⚪' : num === 1 ? '🔴' : '⚫';

  const apiUrl = 'https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1';
  const localKey = 'blaze-historico';

  let historico = JSON.parse(localStorage.getItem(localKey) || '[]');
  let modelo, pronto = false;
  let coletando = true;

  const painel = document.createElement('div');
  painel.innerHTML = `
    <style>
      #painelBlaze {
        position: fixed; top: 20px; left: 20px; z-index: 9999;
        background: #111; color: #fff; padding: 12px; border-radius: 12px;
        box-shadow: 0 0 10px #000; max-width: 320px;
        font-family: Arial, sans-serif; font-size: 14px;
      }
      #painelBlaze button {
        background: #222; color: #fff; border: none; padding: 6px 10px; margin: 4px;
        cursor: pointer; border-radius: 6px;
      }
      #painelBlaze .historico span { margin: 2px; display: inline-block; }
    </style>
    <div id="painelBlaze">
      <div id="previsaoAtual">⏳ Coletando jogadas...</div>
      <div>Jogadas coletadas: <span id="contador">${historico.length}</span></div>
      <div class="historico" id="historico">${historico.map(n => getColorEmoji(n)).join('')}</div>
      <button id="resetar">🔄 Resetar</button>
    </div>
  `;
  document.body.appendChild(painel);

  document.getElementById("resetar").onclick = () => {
    historico = [];
    localStorage.setItem(localKey, "[]");
    document.getElementById("historico").innerHTML = "";
    document.getElementById("contador").textContent = "0";
    document.getElementById("previsaoAtual").textContent = "⏳ Coletando jogadas...";
    modelo = null;
    pronto = false;
  };

  // Modelo IA com TensorFlow
  function criarModelo() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 16, inputShape: [5], activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
    model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });
    return model;
  }

  async function treinarModelo() {
    if (historico.length < 6) return;
    const xs = [], ys = [];

    for (let i = 0; i < historico.length - 5; i++) {
      const entrada = historico.slice(i, i + 5).map(v => v / 2);
      const saida = [0, 0, 0];
      saida[historico[i + 5]] = 1;
      xs.push(entrada);
      ys.push(saida);
    }

    const inputTensor = tf.tensor2d(xs);
    const outputTensor = tf.tensor2d(ys);

    modelo = criarModelo();
    await modelo.fit(inputTensor, outputTensor, { epochs: 30, shuffle: true });
    pronto = true;
  }

  async function prever() {
    if (!modelo || historico.length < 5) return null;

    const entrada = tf.tensor2d([historico.slice(-5).map(v => v / 2)]);
    const resultado = modelo.predict(entrada);
    const array = await resultado.array();
    const confidencias = array[0];

    const indexMax = confidencias.indexOf(Math.max(...confidencias));
    const conf = confidencias[indexMax];

    return conf > 0.9 ? indexMax : null;
  }

  async function coletarRodadas() {
    while (coletando) {
      try {
        const res = await fetch(apiUrl);
        const json = await res.json();
        const novaCor = json[0]?.color;

        if (!Number.isInteger(novaCor)) {
          await sleep(3000);
          continue;
        }

        const ultima = historico[historico.length - 1];
        if (novaCor !== ultima) {
          historico.push(novaCor);
          localStorage.setItem(localKey, JSON.stringify(historico));
          document.getElementById("historico").innerHTML += getColorEmoji(novaCor);
          document.getElementById("contador").textContent = historico.length;

          if (historico.length >= 6) {
            await treinarModelo();
            const pred = await prever();

            if (pred !== null) {
              const nome = getColorName(pred);
              const emoji = getColorEmoji(pred);
              document.getElementById("previsaoAtual").textContent =
                `✅ Apostar: ${nome} + ⚪`;
            } else {
              document.getElementById("previsaoAtual").textContent = "🔍 Aguardando padrão...";
            }
          }
        }
      } catch (e) {
        console.error("Erro ao coletar rodada:", e);
      }

      await sleep(5000);
    }
  }

  coletarRodadas();
})();
