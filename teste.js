// ==UserScript==
// @name         Blaze Roleta IA com Proteção ⚪
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Previsões com IA (TensorFlow.js) + Lógica Tradicional | Proteção automática no branco ⚪ | Aprendizado em tempo real | Histórico completo com painel flutuante compatível com celular e PC
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// @run-at       document-end
// ==/UserScript==

(async function() {
  if (window.hasRunBlazeIA) return;
  window.hasRunBlazeIA = true;

  // Carrega TensorFlow.js
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

  const style = document.createElement("style");
  style.innerHTML = `
    #painelIA {
      position: fixed;
      top: 20px; left: 20px;
      background: #111; color: #fff;
      padding: 15px; border-radius: 10px;
      z-index: 99999; font-family: Arial, sans-serif;
      width: 300px; box-shadow: 0 0 10px #000; font-size: 14px;
    }
    #painelIA h1 { margin: 0 0 10px; font-size: 16px; text-align: center; }
    .bola { width: 16px; height: 16px; border-radius: 50%; display: inline-block; margin: 2px; }
    .branco { background: white; border: 1px solid #999; }
    .preto { background: black; }
    .vermelho { background: red; }
    #historicoIA { display: flex; flex-wrap: wrap; max-height: 80px; overflow-y: auto; margin-bottom: 10px; }
    #sugestaoIA { padding: 10px; border-radius: 6px; text-align: center; font-weight: bold; }
    #controlesIA { margin-top: 10px; text-align: center; }
    button { background: #222; color: #fff; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin: 3px; }
    #contadorIA { text-align: center; margin-top: 5px; }
  `;
  document.head.appendChild(style);

  const painel = document.createElement("div");
  painel.id = "painelIA";
  painel.innerHTML = `
    <h1>🎯 Blaze IA + Lógica</h1>
    <div id="sugestaoIA">⏳ Esperando 5 resultados para iniciar a IA...</div>
    <div id="historicoIA"></div>
    <div id="contadorIA">Coletados: 0</div>
    <div id="controlesIA">
      <button id="resetIA">Resetar Histórico</button>
      <button id="toggleIA">Recolher Histórico</button>
    </div>
  `;
  document.body.appendChild(painel);

  let historico = JSON.parse(localStorage.getItem("historicoIA") || "[]");
  let expandido = true;
  let acertos = 0, erros = 0;
  let ultimaPrevisao = null;

  function renderHistorico() {
    const el = document.getElementById("historicoIA");
    el.innerHTML = "";
    const h = expandido ? historico : historico.slice(0, 12);
    h.forEach(cor => {
      const b = document.createElement("div");
      b.className = "bola " + (cor === 0 ? "branco" : cor === 1 ? "vermelho" : "preto");
      el.appendChild(b);
    });
    document.getElementById("contadorIA").textContent = `Coletados: ${historico.length}`;
  }

  document.getElementById("resetIA").onclick = () => {
    historico = [];
    localStorage.setItem("historicoIA", "[]");
    renderHistorico();
    document.getElementById("sugestaoIA").textContent = "⏳ Esperando 5 resultados para iniciar a IA...";
    ultimaPrevisao = null;
  };

  document.getElementById("toggleIA").onclick = () => {
    expandido = !expandido;
    renderHistorico();
  };

  // IA via TensorFlow.js
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [5], units: 10, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
  model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });

  function treinarModelo() {
    if (historico.length < 6) return;
    const inputs = [], outputs = [];
    for (let i = 0; i < historico.length - 5; i++) {
      inputs.push(historico.slice(i, i + 5));
      const out = [0, 0, 0];
      out[historico[i + 5]] = 1;
      outputs.push(out);
    }
    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(outputs);
    model.fit(xs, ys, { epochs: 5, verbose: 0 });
  }

  async function obterUltimaRodada() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const rodada = data[0];
      return { id: rodada.id, cor: rodada.color };
    } catch (e) {
      console.error("Erro ao buscar rodada:", e);
      return null;
    }
  }

  function preverCorIA() {
    if (historico.length < 5) return null;
    const entrada = tf.tensor2d([historico.slice(0, 5)]);
    const saida = model.predict(entrada);
    const valores = saida.dataSync();
    const confianca = Math.max(...valores);
    const cor = valores.indexOf(confianca);
    return { cor, confianca: confianca * 100 };
  }

  function preverTradicional() {
    const ult5 = historico.slice(0, 5);
    const reds = ult5.filter(c => c === 1).length;
    const blacks = ult5.filter(c => c === 2).length;
    if (reds > blacks) return 2;
    if (blacks > reds) return 1;
    return Math.random() < 0.5 ? 1 : 2;
  }

  async function atualizar() {
    const rodada = await obterUltimaRodada();
    if (!rodada || rodada.id === window.ultimaRodadaId) return;
    window.ultimaRodadaId = rodada.id;
    historico.unshift(rodada.cor);
    localStorage.setItem("historicoIA", JSON.stringify(historico));
    renderHistorico();

    if (ultimaPrevisao !== null) {
      if (rodada.cor === ultimaPrevisao || rodada.cor === 0) acertos++;
      else erros++;
    }

    if (historico.length >= 6) treinarModelo();

    if (historico.length < 5) {
      document.getElementById("sugestaoIA").textContent = "⏳ Esperando 5 resultados para iniciar a IA...";
      return;
    }

    const ia = preverCorIA();
    const logica = preverTradicional();

    if (ia && ia.confianca > 90 && ia.cor === logica) {
      const corTexto = ia.cor === 1 ? "🔴 Vermelho" : ia.cor === 2 ? "⚫ Preto" : "⚪ Branco";
      document.getElementById("sugestaoIA").innerHTML = `🎯 Apostar: ${corTexto} + ⚪`;
      ultimaPrevisao = ia.cor;
    } else {
      document.getElementById("sugestaoIA").textContent = "⏳ Aguardando previsão com alta confiança...";
      ultimaPrevisao = null;
    }
  }

  renderHistorico();
  setInterval(atualizar, 3000);
})();
