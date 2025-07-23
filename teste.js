// ==UserScript==
// @name         Blaze Roleta IA com TensorFlow.js + Proteção no Branco
// @namespace    http://tampermonkey.net/
// @version      2.6
// @description  IA + lógica + proteção ⚪ + histórico completo e expandível + botões + contadores
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// ==/UserScript==

(async function () {
  if (window.hasRunBlazeIA) return;
  window.hasRunBlazeIA = true;

  // Carrega TensorFlow.js
  const tfScript = document.createElement('script');
  tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.14.0/dist/tf.min.js';
  document.head.appendChild(tfScript);
  await new Promise(res => tfScript.onload = res);

  const HIST_LIMIT_PADRAO = 12;
  let historico = JSON.parse(localStorage.getItem("historicoBlazeIA") || "[]");
  let acertos = 0, erros = 0, ultimaPrevisao = null, expandir = false;

  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [7], units: 20, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 10, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));
  model.compile({ loss: 'categoricalCrossentropy', optimizer: 'adam' });

  // Estilos do painel
  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: fixed; top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 10px; border-radius: 10px;
      z-index: 999999; font-family: Arial, sans-serif;
      width: 300px; box-shadow: 0 0 10px rgba(0,0,0,0.5);
      cursor: move;
    }
    #doubleBlackPainel h1 { margin:0 0 8px;font-size:16px;text-align:center;}
    #sugestaoBox {
      padding: 8px; text-align:center; font-weight:bold;
      border-radius:6px; background:#222; margin-bottom:8px;
    }
    #historicoBox {
      display:flex; gap:4px; flex-wrap:wrap; justify-content:center;
      margin-bottom:8px; max-height:80px;
      overflow-y:auto;
    }
    .bolaHist { width:18px;height:18px;border-radius:50%; }
    .pretoHist { background:black; }
    .vermelhoHist { background:red; }
    .brancoHist { background:white; border:1px solid #999; }
    #contadorBox, #acertosBox, #ultimaAcaoBox {
      text-align:center; font-size:13px; margin:4px 0;
    }
    #btnExpandir, #btnReset {
      width:90%; margin:4px auto;
      padding:6px; border:none; border-radius:6px;
      background:#444;color:#fff;cursor:pointer;
      display:block;
    }
  `;
  document.head.appendChild(style);

  // Painel HTML
  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Blaze IA + Lógica</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="contadorBox">Coletados: ${historico.length}</div>
    <div id="acertosBox">✅ ${acertos} | ❌ ${erros} | 🎯 0%</div>
    <div id="ultimaAcaoBox"></div>
    <button id="btnExpandir">🔼 Expandir Histórico</button>
    <button id="btnReset">🔁 Resetar Histórico</button>
  `;
  document.body.appendChild(painel);

  // Função mover painel
  let dragging = false, sX, sY, iL, iT;
  const toMouse = e => ({ x:e.clientX, y:e.clientY });
  painel.addEventListener("mousedown", e => {
    dragging = true;
    const p = toMouse(e);
    sX = p.x; sY = p.y;
    iL = painel.offsetLeft; iT = painel.offsetTop;
  });
  document.addEventListener("mousemove", e => {
    if (!dragging) return;
    const p = toMouse(e);
    painel.style.left = (iL + (p.x - sX)) + "px";
    painel.style.top = (iT + (p.y - sY)) + "px";
  });
  document.addEventListener("mouseup", () => dragging = false);
  painel.addEventListener("touchstart", e => {
    if (e.touches.length !== 1) return;
    dragging = true;
    const t = e.touches[0]; sX = t.clientX; sY = t.clientY;
    iL = painel.offsetLeft; iT = painel.offsetTop;
  }, {passive:false});
  document.addEventListener("touchmove", e => {
    if (!dragging || e.touches.length!==1) return;
    const t = e.touches[0];
    painel.style.left = (iL + (t.clientX - sX)) + "px";
    painel.style.top = (iT + (t.clientY - sY)) + "px";
  }, {passive:false});
  document.addEventListener("touchend", () => dragging = false);

  function mostrar(msg){
    const box = document.getElementById("ultimaAcaoBox");
    box.textContent = msg;
    setTimeout(()=>box.textContent="",5000);
  }

  document.getElementById("btnReset").onclick = () => {
    historico = []; acertos=0; erros=0; ultimaPrevisao=null;
    localStorage.removeItem("historicoBlazeIA");
    atualizar();
    mostrar("✅ Histórico resetado");
  };

  document.getElementById("btnExpandir").onclick = () => {
    expandir = !expandir;
    document.getElementById("btnExpandir").textContent = expandir ? "🔽 Recolher Histórico" : "🔼 Expandir Histórico";
    atualizar();
  };

  // Previsão tradicional
  function prevTrad(h){
    if (h.length < 7) return null;
    const last7 = h.slice(0,7).map(x=>x.cor);
    const cnt = (v)=> last7.filter(z=>z===v).length;
    const p = cnt(2), r = cnt(1);
    if (p>=5) return 1;
    if (r>=5) return 2;
    return p>r?1:2;
  }

  // Treinar IA
  async function treinarIA(){
    if (historico.length < 8) return;
    const X=[], Y=[];
    for(let i=7;i<historico.length;i++){
      const inp = historico.slice(i-7,i).map(x=>x.cor/2);
      const out= [0,0,0]; out[historico[i].cor]=1;
      X.push(inp); Y.push(out);
    }
    const xs=tf.tensor2d(X), ys=tf.tensor2d(Y);
    await model.fit(xs, ys, {epochs:2});
    xs.dispose(); ys.dispose();
  }

  // Previsão IA com confiança ≥0.9
  async function prevIA(){
    if (historico.length < 8) return null;
    const inp=tf.tensor2d([historico.slice(0,7).map(x=>x.cor/2)]);
    const pred=model.predict(inp);
    const arr=await pred.data();
    inp.dispose(); pred.dispose();
    const cf=Math.max(...arr), idx=arr.indexOf(cf);
    return cf >= 0.9 ? idx : null;
  }

  // Captura nova rodada
  async function fetchLast(){
    try{
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const d = await res.json();
      const {id, color:cor} = d[0]||{};
      if (!id||cor===undefined || historico[0]?.id===id) return;

      historico.unshift({id, cor});
      localStorage.setItem("historicoBlazeIA", JSON.stringify(historico));

      if (ultimaPrevisao!==null){
        if (cor===ultimaPrevisao || (ultimaPrevisao!==0 && cor===0)) acertos++;
        else erros++;
      }

      await treinarIA();
      atualizar();
    }catch(e){
      console.error(e);
    }
  }

  // Atualiza o painel
  async function atualizar(){
    const ult = historico.slice(0, expandir?historico.length:HIST_LIMIT_PADRAO).map(x=>x.cor);
    const pt = prevTrad(historico);
    const pi = await prevIA();

    let texto="⏳ Carregando...", bg="#333";
    if (historico.length<8){
      texto=`⏳ Esperando ${8-historico.length} resultados...`;
    } else if (pi!==null && pi===pt){
      ultimaPrevisao = pi;
      texto = ["⚪ Branco + ⚪","🔴 Vermelho + ⚪","⚫ Preto + ⚪"][pi];
      bg = ["white","red","black"][pi];
    } else {
      ultimaPrevisao = null;
    }

    const sbox = document.getElementById("sugestaoBox");
    sbox.textContent = texto;
    sbox.style.background = bg;
    sbox.style.color = bg === "white"? "#000":"#fff";

    const box = document.getElementById("historicoBox");
    box.innerHTML = '';
    ult.forEach(c=>{
      const div = document.createElement("div");
      div.className = "bolaHist " + (c===0?"brancoHist":c===2?"pretoHist":"vermelhoHist");
      box.appendChild(div);
    });

    const total = acertos + erros;
    const taxa = total?((acertos/total)*100).toFixed(1):0;
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
    document.getElementById("contadorBox").textContent = `Coletados: ${historico.length}`;
  }

  fetchLast();
  setInterval(fetchLast, 3000);

})();
