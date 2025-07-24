// ==UserScript==
// @name         Blaze Roleta IA com Proteção ⚪
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Previsão inteligente com IA real (TensorFlow.js) e proteção no branco ⚪ - Alta assertividade combinada com lógica tradicional
// @author       GPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.16.0/dist/tf.min.js
// ==/UserScript==

(function () {
  if (document.getElementById("doubleBlackPainel")) return;

  let historico = JSON.parse(localStorage.getItem("historicoCoresIA") || "[]");
  let modeloIA = null;
  let emTreinamento = false;

  const coresMap = { red: 1, black: 2, white: 0 };
  const coresReverse = ["Branco", "Vermelho", "Preto"];
  const coresEmoji = ["⚪", "🔴", "⚫"];
  let ultimasCores = [];

  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: fixed;
      top: 30px;
      left: 30px;
      background: #111;
      color: #fff;
      padding: 12px;
      border-radius: 12px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 9999;
      width: 300px;
      box-shadow: 0 0 10px #000;
    }
    #doubleBlackPainel button {
      margin-top: 8px;
      margin-right: 4px;
      padding: 5px 10px;
      background: #333;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
    #previsao {
      font-size: 18px;
      margin: 10px 0;
      font-weight: bold;
    }
    #historico {
      max-height: 150px;
      overflow-y: auto;
      margin-top: 8px;
      display: block;
    }
  `;
  document.head.appendChild(style);

  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <div id="status">🤖 Carregando IA...</div>
    <div id="previsao">⏳ Aguardando dados...</div>
    <div id="contador">Jogadas coletadas: 0</div>
    <button id="resetar">🔄 Resetar Histórico</button>
    <button id="toggle">🔽 Recolher Histórico</button>
    <div id="historico"></div>
  `;
  document.body.appendChild(painel);

  document.getElementById("resetar").onclick = () => {
    historico = [];
    localStorage.removeItem("historicoCoresIA");
    document.getElementById("historico").innerHTML = "";
    document.getElementById("previsao").innerText = "⏳ Aguardando dados...";
    document.getElementById("contador").innerText = "Jogadas coletadas: 0";
  };

  let expandido = true;
  document.getElementById("toggle").onclick = () => {
    expandido = !expandido;
    document.getElementById("historico").style.display = expandido ? "block" : "none";
    document.getElementById("toggle").innerText = expandido ? "🔽 Recolher Histórico" : "🔼 Expandir Histórico";
  };

  function atualizarHistorico(cor) {
    const div = document.createElement("div");
    div.textContent = coresEmoji[cor];
    document.getElementById("historico").appendChild(div);
    document.getElementById("contador").innerText = `Jogadas coletadas: ${historico.length}`;
  }

  async function treinarModelo() {
    if (emTreinamento || historico.length < 5) return;
    emTreinamento = true;

    const inputs = [];
    const outputs = [];
    for (let i = 5; i < historico.length; i++) {
      inputs.push(historico.slice(i - 5, i));
      outputs.push(historico[i]);
    }

    const xs = tf.tensor2d(inputs);
    const ys = tf.oneHot(tf.tensor1d(outputs, "int32"), 3);

    modeloIA = tf.sequential();
    modeloIA.add(tf.layers.dense({ inputShape: [5], units: 16, activation: "relu" }));
    modeloIA.add(tf.layers.dense({ units: 16, activation: "relu" }));
    modeloIA.add(tf.layers.dense({ units: 3, activation: "softmax" }));

    modeloIA.compile({ optimizer: "adam", loss: "categoricalCrossentropy", metrics: ["accuracy"] });
    await modeloIA.fit(xs, ys, { epochs: 30, shuffle: true });

    xs.dispose();
    ys.dispose();
    emTreinamento = false;
  }

  function preverCorIA() {
    if (!modeloIA || historico.length < 5) return null;
    const entrada = tf.tensor2d([historico.slice(-5)]);
    const saida = modeloIA.predict(entrada);
    const array = saida.dataSync();
    entrada.dispose();
    saida.dispose();

    const max = Math.max(...array);
    const index = array.indexOf(max);
    return { cor: index, confianca: max };
  }

  function logicaTradicional() {
    if (historico.length < 3) return null;
    const [a, b, c] = historico.slice(-3);
    if (a === b && b === c) return a;
    if (a !== b && b !== c) return b;
    return historico[historico.length - 1];
  }

  function atualizarPrevisao() {
    const ia = preverCorIA();
    const regra = logicaTradicional();

    if (!ia || !regra) {
      document.getElementById("previsao").innerText = "⏳ Aguardando dados...";
      return;
    }

    if (ia.cor === regra && ia.confianca > 0.9) {
      const texto = `✅ Apostar: ${coresReverse[ia.cor]} + ⚪`;
      document.getElementById("previsao").innerText = texto;
    } else {
      document.getElementById("previsao").innerText = "🤔 Sem previsão confiável...";
    }
  }

  async function observarResultados() {
    setInterval(async () => {
      try {
        const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
        const data = await res.json();
        const corTexto = data[0]?.color;
        const corNum = coresMap[corTexto];

        if (corNum === undefined || historico[historico.length - 1] === corNum) return;

        historico.push(corNum);
        localStorage.setItem("historicoCoresIA", JSON.stringify(historico));
        atualizarHistorico(corNum);
        await treinarModelo();
        atualizarPrevisao();
      } catch (e) {
        console.error("Erro ao obter resultado:", e);
      }
    }, 4000);
  }

  observarResultados();
})();
