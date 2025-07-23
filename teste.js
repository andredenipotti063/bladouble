// ==UserScript==
// @name         Blaze Roleta IA + Lógica
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Previsão da roleta Blaze com IA + Lógica Tradicional combinadas para alta confiança
// @author       GPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.18.0/dist/tf.min.js
// ==/UserScript==

(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

  const salvarHistorico = (data) => localStorage.setItem("historicoBlazeIA", JSON.stringify(data));
  const carregarHistorico = () => {
    try {
      const raw = localStorage.getItem("historicoBlazeIA");
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) throw new Error("Histórico inválido");
      return data;
    } catch {
      return [];
    }
  };

  let historico = carregarHistorico();
  let ultimoId = null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;
  let modeloIA = null;
  let rodadasTreinadas = 0;

  // ========== ELEMENTOS UI ==========
  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: absolute; top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 15px; border-radius: 10px;
      z-index: 9999; font-family: Arial, sans-serif;
      width: 280px; box-shadow: 0 0 10px rgba(0,0,0,0.4); cursor: move;
    }
    #doubleBlackPainel h1 { margin: 0 0 10px; font-size: 16px; text-align: center; }
    #sugestaoBox {
      padding: 10px; text-align: center;
      font-weight: bold; border-radius: 8px;
      background-color: #222; margin-bottom: 10px;
    }
    #historicoBox {
      display: flex; gap: 4px; justify-content: center;
      flex-wrap: wrap; margin-bottom: 10px;
    }
    .bolaHist { width: 20px; height: 20px; border-radius: 50%; }
    .pretoHist { background: black; }
    .vermelhoHist { background: red; }
    .brancoHist { background: white; border: 1px solid #999; }
    #acertosBox { text-align: center; font-size: 14px; margin-top: 5px; }
    #resetBtn { margin-top: 8px; display: block; text-align: center; cursor: pointer; color: #aaa; font-size: 13px; }
    #ultimaAcao { text-align: center; font-size: 13px; margin-top: 5px; color: #ccc; }
  `;
  document.head.appendChild(style);

  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
    <div id="ultimaAcao"></div>
    <div id="resetBtn">🔁 Resetar histórico</div>
  `;
  document.body.appendChild(painel);

  const sugestaoBox = document.getElementById("sugestaoBox");
  const historicoBox = document.getElementById("historicoBox");
  const acertosBox = document.getElementById("acertosBox");
  const ultimaAcao = document.getElementById("ultimaAcao");
  const resetBtn = document.getElementById("resetBtn");

  function mostrarMensagem(texto) {
    ultimaAcao.textContent = texto;
    setTimeout(() => (ultimaAcao.textContent = ""), 5000);
  }

  resetBtn.onclick = () => {
    historico = [];
    salvarHistorico([]);
    rodadasTreinadas = 0;
    modeloIA = null;
    mostrarMensagem("🔁 Histórico resetado.");
  };

  // Movimento (PC + celular)
  let isDragging = false, startX, startY, initialLeft, initialTop;
  function onDragStart(x, y) {
    isDragging = true;
    startX = x;
    startY = y;
    initialLeft = painel.offsetLeft;
    initialTop = painel.offsetTop;
  }
  function onDragMove(x, y) {
    if (!isDragging) return;
    painel.style.left = initialLeft + (x - startX) + "px";
    painel.style.top = initialTop + (y - startY) + "px";
  }
  painel.addEventListener("mousedown", (e) => onDragStart(e.clientX, e.clientY));
  document.addEventListener("mousemove", (e) => onDragMove(e.clientX, e.clientY));
  document.addEventListener("mouseup", () => isDragging = false);
  painel.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) onDragStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  document.addEventListener("touchmove", (e) => {
    if (isDragging && e.touches.length === 1)
      onDragMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  document.addEventListener("touchend", () => isDragging = false);

  // ========= IA ===========
  function prepararDados(h) {
    const entrada = h.slice(1).map(c => [c === 1 ? 1 : 0, c === 2 ? 1 : 0, c === 0 ? 1 : 0]);
    const saida = h[0];
    return { entrada, saida };
  }

  function criarModelo() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [5 * 3], units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
    model.compile({ loss: 'categoricalCrossentropy', optimizer: 'adam' });
    return model;
  }

  async function treinarIA() {
    if (historico.length < 6) return;

    if (!modeloIA) modeloIA = criarModelo();

    const { entrada, saida } = prepararDados(historico.slice(0, 6));
    const xs = tf.tensor2d([entrada.flat()]);
    const ys = tf.tensor2d([[saida === 1 ? 1 : 0, saida === 2 ? 1 : 0, saida === 0 ? 1 : 0]]);
    await modeloIA.fit(xs, ys, { epochs: 10, verbose: 0 });

    rodadasTreinadas++;
  }

  async function preverIA() {
    if (!modeloIA || historico.length < 5) return null;
    const entrada = historico.slice(0, 5).map(c => [c === 1 ? 1 : 0, c === 2 ? 1 : 0, c === 0 ? 1 : 0]);
    const xs = tf.tensor2d([entrada.flat()]);
    const output = modeloIA.predict(xs);
    const array = await output.data();
    const index = array.indexOf(Math.max(...array));
    return index; // 0=branco, 1=vermelho, 2=preto
  }

  // ======= LÓGICA PADRÃO =======
  function preverLogica() {
    if (historico.length < 7) return null;

    const ult7 = historico.slice(0, 7);
    const ult40 = historico.slice(0, 40);
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

  function atualizarPainel(previsaoFinal) {
    const ult = historico.slice(0, 12);
    historicoBox.innerHTML = "";
    ult.forEach(n => {
      const el = document.createElement("div");
      el.className = "bolaHist " + (n === 0 ? "brancoHist" : n === 2 ? "pretoHist" : "vermelhoHist");
      historicoBox.appendChild(el);
    });

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    acertosBox.textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;

    if (previsaoFinal !== null) {
      ultimaPrevisao = previsaoFinal;
      let texto = "", cor = "#444";
      if (previsaoFinal === 0) { cor = "white"; texto = "⚪️ Alerta de Branco"; }
      if (previsaoFinal === 1) { cor = "red"; texto = "🔥 Alta Confiança: Vermelho"; }
      if (previsaoFinal === 2) { cor = "black"; texto = "🔥 Alta Confiança: Preto"; }
      sugestaoBox.textContent = texto;
      sugestaoBox.style.background = cor;
      sugestaoBox.style.color = cor === "white" ? "#000" : "#fff";
    } else {
      sugestaoBox.textContent = "🤔 Padrões incertos – aguardando confirmação";
      sugestaoBox.style.background = "#444";
    }
  }

  // ========= LOOP PRINCIPAL =========
  async function checarAPI() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color;
      const id = data[0]?.id;

      if (!id || cor === undefined) return;

      if (id !== ultimoId) {
        if (ultimaPrevisao !== null) {
          if (cor === ultimaPrevisao) acertos++;
          else erros++;
        }

        historico.unshift(cor);
        salvarHistorico(historico);
        ultimoId = id;

        await treinarIA();

        const prevIA = await preverIA();
        const prevLOG = preverLogica();
        const previsaoFinal = (prevIA === prevLOG) ? prevIA : null;

        atualizarPainel(previsaoFinal);
      }
    } catch (e) {
      console.error("❌ Erro API", e);
    }
  }

  setInterval(checarAPI, 3000);
  await checarAPI();
})();
