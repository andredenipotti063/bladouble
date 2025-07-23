// ==UserScript==
// @name         Blaze Roleta + IA Realista
// @namespace    https://chat.openai.com/
// @version      3.0
// @description  IA real via TensorFlow.js + lógica combinada | aprendizado online real-time
// @match        https://blaze.com/pt/games/double
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.18.0/dist/tf.min.js
// ==/UserScript==

(async function () {
  if (document.getElementById("blazeIaPainel")) return;

  // ===== UI =====
  const style = document.createElement("style");
  style.innerHTML = `
    #blazeIaPainel {
      position: absolute; top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 15px; border-radius: 10px; width: 300px;
      font-family: Arial, sans-serif; z-index: 9999;
      box-shadow: 0 0 10px rgba(0,0,0,0.4); cursor: move;
    }
    #blazeIaPainel h1 { font-size: 16px; margin: 0 0 10px; text-align:center; }
    #sugestaoBox {
      background:#222; color:#fff;
      padding:10px; text-align:center;
      border-radius:8px; margin-bottom:8px;
      font-weight:bold;
    }
    #historicoBox {
      display:flex; gap:4px; flex-wrap:wrap;
      justify-content:center; margin-bottom:8px;
    }
    .bolaHist { width:20px; height:20px; border-radius:50%; }
    .pretoHist{ background:black; } .vermelhoHist{ background:red; }
    .brancoHist{ background:white; border:1px solid #999; }
    #acertosBox, #ultimaAcao {
      text-align:center; font-size:14px; margin-top:5px;
    }
    #resetBtn {
      display:block; margin:6px auto;
      background:#444; color:#fff; border:none;
      padding:6px 10px; border-radius:5px;
      cursor:pointer; font-size:13px;
    }
  `;
  document.head.appendChild(style);

  const painel = document.createElement("div");
  painel.id = "blazeIaPainel";
  painel.innerHTML = `
    <h1>🔮 Blaze IA Inteligente</h1>
    <div id="sugestaoBox">⏳ Iniciando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
    <button id="resetBtn">♻️ Resetar Histórico</button>
    <div id="ultimaAcao"></div>
  `;
  document.body.appendChild(painel);

  const sugestaoBox = document.getElementById("sugestaoBox");
  const historicoBox = document.getElementById("historicoBox");
  const acertosBox = document.getElementById("acertosBox");
  const ultimaAcao = document.getElementById("ultimaAcao");
  const resetBtn = document.getElementById("resetBtn");

  function mostrar(msg) {
    ultimaAcao.textContent = msg;
    setTimeout(() => { if (ultimaAcao.textContent === msg) ultimaAcao.textContent = ""; }, 5000);
  }

  resetBtn.addEventListener("click", () => {
    localStorage.clear();
    historico = [];
    acertos = erros = 0;
    ultimoId = ultimaPrevisao = null;
    model = null; rodadasTreinadas = 0;
    atualizarUI();
    mostrar("🔁 Histórico resetado");
  });

  // ===== DRAG MOBILE/DESKTOP =====
  let dragging=false, sx, sy, ox, oy;
  painel.addEventListener("mousedown",(e)=>{dragging=true; sx=e.clientX; sy=e.clientY; ox=painel.offsetLeft; oy=painel.offsetTop;});
  document.addEventListener("mousemove",e=>{ if(dragging){ painel.style.left = ox+e.clientX-sx+"px"; painel.style.top = oy+e.clientY-sy+"px"; }});
  document.addEventListener("mouseup",()=>dragging=false);
  painel.addEventListener("touchstart",e=>{ if(e.touches.length===1){ dragging=true; sx=e.touches[0].clientX; sy=e.touches[0].clientY; ox=painel.offsetLeft; oy=painel.offsetTop;}}, {passive:false});
  document.addEventListener("touchmove",e=>{ if(dragging && e.touches.length===1){ painel.style.left = ox+e.touches[0].clientX-sx+"px"; painel.style.top = oy+e.touches[0].clientY-sy+"px"; }}, {passive:false});
  document.addEventListener("touchend", ()=>dragging=false);

  // ===== STORAGE & ESTADO =====
  let historico = Array.isArray(JSON.parse(localStorage.getItem("blazeHist")||"[]")) ? JSON.parse(localStorage.getItem("blazeHist")) : [];
  let ultimoId = null, ultimaPrevisao = null;
  let acertos = parseInt(localStorage.getItem("blazeAcertos")||"0");
  let erros = parseInt(localStorage.getItem("blazeErros")||"0");

  function salvar() {
    localStorage.setItem("blazeHist", JSON.stringify(historico));
    localStorage.setItem("blazeAcertos", acertos);
    localStorage.setItem("blazeErros", erros);
  }

  // ===== IA COM TENSORFLOW.JS =====
  let model = null, rodadasTreinadas = 0;

  function criarModelo() {
    const m = tf.sequential();
    m.add(tf.layers.dense({ inputShape: [15], units: 16, activation: "relu" }));
    m.add(tf.layers.dense({ units: 3, activation: "softmax" }));
    m.compile({ loss: "categoricalCrossentropy", optimizer: "adam" });
    return m;
  }

  async function treinarOnline() {
    if (historico.length < 6) return;
    if (!model) model = criarModelo();

    const entrada = historico.slice(-6, -1).flatMap(c => [c===0, c===1, c===2]);
    const label = historico.slice(-1)[0];
    const xs = tf.tensor2d([entrada]);
    const ys = tf.oneHot([label],3);
    await model.fit(xs, ys, { epochs: 5, verbose: 0 });
    rodadasTreinadas++;
    xs.dispose(); ys.dispose();
  }

  async function preverIA() {
    if (!model || historico.length < 5) return null;
    const entrada = historico.slice(-5).flatMap(c => [c===0, c===1, c===2]);
    const xs = tf.tensor2d([entrada]);
    const pred = model.predict(xs);
    const arr = await pred.data();
    xs.dispose(); pred.dispose();
    return arr.indexOf(Math.max(...arr)); // 0=Branco,1=Vermelho,2=Preto
  }

  // ===== LÓGICA TRADICIONAL =====
  function preverLogica() {
    if (historico.length < 7) return null;
    const ult7 = historico.slice(-7), ult40 = historico.slice(-40);
    const cnt = (v) => ult7.filter(x => x===v).length;
    if (ult7.slice(-4).every(x=>x===2)) return 1;
    if (ult7.slice(-4).every(x=>x===1)) return 2;
    if (cnt(2)>=5) return 1;
    if (cnt(1)>=5) return 2;
    if (!ult40.includes(0)) return 0;
    return cnt(2)>cnt(1)?1:2;
  }

  // ===== ATAÇÃO E UI =====
  function atualizarUI(previsao=null) {
    historicoBox.innerHTML = "";
    historico.slice(-12).reverse().forEach(c=>{
      const el = document.createElement("div");
      el.className = "bolaHist " + (c===0?"brancoHist":c===1?"vermelhoHist":"pretoHist");
      historicoBox.appendChild(el);
    });

    const total = acertos + erros;
    const taxa = total ? ((acertos/total)*100).toFixed(1) : 0;
    acertosBox.textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;

    const ia = ultimaPrevisaoIA ?? null;
    const log = ultimaPrevisao;
    if (ia !== null && ia === log) {
      const corName = ia===0?"Branco":ia===1?"Vermelho":"Preto";
      const corBack = ia===0?"white":ia===1?"red":"black";
      sugestaoBox.textContent = `✅ Confiança Alta: ${corName}`;
      sugestaoBox.style.background = corBack;
      sugestaoBox.style.color = ia===0?"#000":"#fff";
    } else {
      sugestaoBox.textContent = "⏳ Aguardando padrão";
      sugestaoBox.style.background = "#444";
      sugestaoBox.style.color = "#fff";
    }
  }

  let ultimaPrevisaoIA = null, ultimaPrevisao = null;

  // ===== LOOP PRINCIPAL =====
  async function rodada() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const j = await res.json();
      const cor = j[0]?.color, id = j[0]?.id;
      if (!Number.isInteger(cor) || !id) return;

      if (id !== ultimoId) {
        ultimoId = id;

        const logPred = preverLogica();
        const iaPred = await preverIA();

        historico.push(cor);
        ultimaPrevisao = logPred;
        ultimaPrevisaoIA = iaPred;

        if (ultimaPrevisao !== null && iaPred !== null && iaPred === logPred) {
          if (cor === iaPred) acertos++; else erros++;
        }

        await treinarOnline();
        salvar();
        atualizarUI();
      }
    } catch (err) {
      console.error(err);
    }
  }

  atualizarUI();
  await rodada();
  setInterval(rodada, 3000);

})();
