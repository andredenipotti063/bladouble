(async function () {
  if (window.doubleBlackIA) return;
  window.doubleBlackIA = true;

  // === ESTILO ===
  const style = document.createElement("style");
  style.innerHTML = `
    #painelIA {
      position: fixed; top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 15px; border-radius: 10px;
      z-index: 999999; font-family: Arial, sans-serif;
      width: 300px; box-shadow: 0 0 10px rgba(0,0,0,0.5); cursor: move;
    }
    #painelIA h1 { font-size: 16px; margin-bottom: 10px; text-align: center; }
    #previsaoBox { font-weight: bold; text-align: center; margin-bottom: 10px; padding: 10px; border-radius: 8px; }
    #historicoBox { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; margin-bottom: 10px; }
    .corBall { width: 20px; height: 20px; border-radius: 50%; }
    .cor-0 { background: white; border: 1px solid #aaa; }
    .cor-1 { background: red; }
    .cor-2 { background: black; }
    #acertosBox, #ultAcaoBox { text-align: center; font-size: 14px; margin-top: 5px; }
    #btnReset { width: 100%; margin-top: 8px; background: #444; color: white; border: none; padding: 6px; border-radius: 6px; cursor: pointer; }
  `;
  document.head.appendChild(style);

  // === HTML DO PAINEL ===
  const painel = document.createElement("div");
  painel.id = "painelIA";
  painel.innerHTML = `
    <h1>🎯 IA Roleta Blaze</h1>
    <div id="previsaoBox">⏳ Inicializando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
    <div id="ultAcaoBox"></div>
    <button id="btnReset">🔄 Resetar Histórico</button>
  `;
  document.body.appendChild(painel);

  // === MOVER PAINEL ===
  let isDrag = false, startX, startY, startLeft, startTop;
  painel.addEventListener("mousedown", e => {
    isDrag = true;
    startX = e.clientX; startY = e.clientY;
    startLeft = painel.offsetLeft; startTop = painel.offsetTop;
  });
  document.addEventListener("mousemove", e => {
    if (!isDrag) return;
    painel.style.left = startLeft + (e.clientX - startX) + "px";
    painel.style.top = startTop + (e.clientY - startY) + "px";
  });
  document.addEventListener("mouseup", () => isDrag = false);

  // === VARIÁVEIS ===
  let historico = JSON.parse(localStorage.getItem("historicoBlazeIA") || "[]");
  let ultimaPrevisao = null, ultimoId = null;
  let acertos = +localStorage.getItem("acertosIA") || 0;
  let erros = +localStorage.getItem("errosIA") || 0;

  // === IA: TENSORFLOW.JS ===
  const tfScript = document.createElement("script");
  tfScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js";
  document.head.appendChild(tfScript);
  await new Promise(res => tfScript.onload = res);

  const inputSize = 5;
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [inputSize], units: 16, activation: "relu" }));
  model.add(tf.layers.dense({ units: 3, activation: "softmax" }));
  model.compile({ loss: "categoricalCrossentropy", optimizer: "adam" });

  function treinarIA() {
    if (historico.length < inputSize + 1) return;

    const xs = [], ys = [];
    for (let i = 0; i < historico.length - inputSize; i++) {
      const entrada = historico.slice(i, i + inputSize).map(Number);
      const saida = [0, 0, 0];
      saida[historico[i + inputSize]] = 1;
      xs.push(entrada);
      ys.push(saida);
    }

    const xsTensor = tf.tensor2d(xs);
    const ysTensor = tf.tensor2d(ys);
    model.fit(xsTensor, ysTensor, { epochs: 10 }).then(() => {
      logar("🧠 IA atualizada.");
    });
  }

  function preverIA() {
    if (historico.length < inputSize) return null;
    const entrada = tf.tensor2d([historico.slice(-inputSize)]);
    const pred = model.predict(entrada);
    const index = pred.argMax(1).dataSync()[0];
    return index;
  }

  function preverLogica(h) {
    const ult = h.slice(-7);
    if (ult.length < 5) return null;

    const count = v => ult.filter(x => x === v).length;
    if (ult.slice(0, 4).every(x => x === 2)) return 1;
    if (ult.slice(0, 4).every(x => x === 1)) return 2;
    if (count(2) >= 5) return 1;
    if (count(1) >= 5) return 2;
    if (!h.slice(-40).includes(0) && ultimaPrevisao !== 0) return 0;
    return count(2) > count(1) ? 1 : 2;
  }

  function logar(msg) {
    const box = document.getElementById("ultAcaoBox");
    box.textContent = msg;
    setTimeout(() => box.textContent = "", 5000);
  }

  function atualizarPainel(cor, texto) {
    const box = document.getElementById("previsaoBox");
    box.style.background = cor === "white" ? "#fff" : cor;
    box.style.color = cor === "white" ? "#000" : "#fff";
    box.textContent = texto;

    const histBox = document.getElementById("historicoBox");
    histBox.innerHTML = "";
    historico.slice(-12).reverse().forEach(c => {
      const b = document.createElement("div");
      b.className = "corBall cor-" + c;
      histBox.appendChild(b);
    });

    const total = acertos + erros;
    const taxa = total ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  // === BOTÃO RESET ===
  document.getElementById("btnReset").onclick = () => {
    historico = [];
    acertos = 0; erros = 0;
    localStorage.removeItem("historicoBlazeIA");
    localStorage.removeItem("acertosIA");
    localStorage.removeItem("errosIA");
    logar("🔄 Histórico resetado.");
    atualizarPainel("gray", "⏳ Aguardando...");
  };

  // === FETCH LOOP ===
  async function fetchRodada() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color;
      const id = data[0]?.id;

      if (!id || cor === undefined || id === ultimoId) return;

      historico.push(cor);
      ultimaPrevisao !== null && (
        cor === ultimaPrevisao ? acertos++ : erros++
      );

      ultimaPrevisao = null;
      ultimoId = id;
      localStorage.setItem("historicoBlazeIA", JSON.stringify(historico));
      localStorage.setItem("acertosIA", acertos);
      localStorage.setItem("errosIA", erros);

      treinarIA();
      const prevIA = preverIA();
      const prevLogica = preverLogica(historico);

      if (prevIA !== null && prevLogica !== null && prevIA === prevLogica) {
        ultimaPrevisao = prevIA;
        const texto = ["⚪️ Branco", "🔴 Vermelho", "⚫️ Preto"][prevIA];
        const corTxt = ["white", "red", "black"][prevIA];
        atualizarPainel(corTxt, `✅ Alta Confiança: ${texto}`);
      } else {
        atualizarPainel("gray", "⌛ Aguardando padrão...");
      }

    } catch (e) {
      console.warn("Erro ao buscar rodada:", e);
    }
  }

  setInterval(fetchRodada, 3000);
})();
