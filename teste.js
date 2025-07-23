// ==UserScript==
// @name         Blaze Roleta IA com Proteção ⚪
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  IA + Lógica + Proteção no Branco ⚪ | Histórico completo | Confiança >90% | Compatível mobile/desktop
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// @run-at       document-end
// ==/UserScript==

(async function(){
  if (window.hasRunBlazeIA) return;
  window.hasRunBlazeIA = true;

  // Carrega TensorFlow.js
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js';
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });

  // CSS do painel
  const st = document.createElement("style");
  st.innerHTML = `
    #painelIA{position:fixed;top:20px;left:20px;background:#111;color:#fff;padding:12px;border-radius:8px;z-index:99999;font-family:Arial,sans-serif;width:280px;box-shadow:0 0 8px #000;}
    #painelIA h1{margin:0 0 8px;font-size:16px;text-align:center;}
    #sugestaoIA{padding:8px;border-radius:6px;text-align:center;font-weight:bold;background:#222;margin-bottom:6px;}
    #historicoIA{display:flex;flex-wrap:wrap;max-height:80px;overflow-y:auto;margin-bottom:6px;}
    .bola{width:16px;height:16px;border-radius:50%;margin:2px;}
    .branco{background:white;border:1px solid #999;}
    .vermelho{background:red;}
    .preto{background:black;}
    #contadorIA,#taxaIA{font-size:14px;text-align:center;margin:4px 0;}
    button{background:#333;color:#fff;border:none;padding:5px 8px;border-radius:5px;cursor:pointer;margin:2px;}
  `;
  document.head.appendChild(st);

  // HTML do painel
  const pnl = document.createElement("div");
  pnl.id = "painelIA";
  pnl.innerHTML = `
    <h1>🎯 Blaze IA + Lógica</h1>
    <div id="sugestaoIA">⏳ Esperando 5 resultados para iniciar a IA...</div>
    <div id="historicoIA"></div>
    <div id="contadorIA">Coletados: 0</div>
    <div id="taxaIA">✅ 0 | ❌ 0 | 🎯 0%</div>
    <div style="text-align:center;">
      <button id="resetIA">🔁 Resetar</button>
      <button id="toggleIA">Recolher</button>
    </div>
  `;
  document.body.appendChild(pnl);

  // Drag (desktop e mobile)
  let isDrag=false, sx,sy,ix,iy;
  pnl.addEventListener("mousedown", e=>{isDrag=true; sx=e.clientX; sy=e.clientY; ix=pnl.offsetLeft; iy=pnl.offsetTop;});
  window.addEventListener("mousemove", e=>{ if(isDrag){ pnl.style.left = ix+(e.clientX-sx)+"px"; pnl.style.top = iy+(e.clientY-sy)+"px"; }});
  window.addEventListener("mouseup", ()=>isDrag=false);
  pnl.addEventListener("touchstart", e=>{ if(e.touches.length===1){isDrag=true; sx=e.touches[0].clientX; sy=e.touches[0].clientY; ix=pnl.offsetLeft; iy=pnl.offsetTop;}});
  window.addEventListener("touchmove", e=>{ if(isDrag && e.touches.length===1){ pnl.style.left = ix+(e.touches[0].clientX-sx)+"px"; pnl.style.top = iy+(e.touches[0].clientY-sy)+"px"; }}, {passive:false});
  window.addEventListener("touchend", ()=>isDrag=false);

  let historico = JSON.parse(localStorage.getItem("historicoIA")||"[]");
  let expandido = true, acertos=0, erros=0, ultimaPrev = null;

  document.getElementById("resetIA").onclick = ()=> {
    historico=[]; acertos=0; erros=0; ultimaPrev=null;
    localStorage.setItem("historicoIA","[]");
    updatePanel();
  };
  document.getElementById("toggleIA").onclick = ()=> {
    expandido=!expandido;
    document.getElementById("toggleIA").innerText = expandido ? "Recolher" : "Expandir";
    updatePanel();
  };

  function renderHist(){
    const cb = document.getElementById("historicoIA");
    cb.innerHTML="";
    const arr = expandido ? historico : historico.slice(0,12);
    arr.forEach(c=>{
      const d = document.createElement("div");
      d.className = "bola " + (c===0?"branco":c===1?"vermelho":"preto");
      cb.appendChild(d);
    });
    document.getElementById("contadorIA").textContent = `Coletados: ${historico.length}`;
    document.getElementById("taxaIA").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${((acertos+erros)>0?((acertos/(acertos+erros))*100).toFixed(1):0)}%`;
  }

  // IA
  const model = tf.sequential();
  model.add(tf.layers.dense({inputShape:[5],units:10,activation:'relu'}));
  model.add(tf.layers.dense({units:3,activation:'softmax'}));
  model.compile({optimizer:'adam',loss:'categoricalCrossentropy'});

  function trainModel(){
    if (historico.length<6) return;
    const xi=[], yi=[];
    for(let i=0;i<historico.length-5;i++){
      xi.push(historico.slice(i,i+5));
      const o=[0,0,0]; o[historico[i+5]] =1;
      yi.push(o);
    }
    const xs = tf.tensor2d(xi), ys = tf.tensor2d(yi);
    model.fit(xs,ys,{epochs:5,verbose:0});
    xs.dispose(); ys.dispose();
  }
  function predIA(){
    if (historico.length <5) return null;
    const inp = tf.tensor2d([historico.slice(0,5)]);
    const out = model.predict(inp);
    const arr = out.dataSync();
    inp.dispose(); out.dispose();
    const max = Math.max(...arr);
    const cor = arr.indexOf(max);
    return { cor, conf: max*100 };
  }
  function predTrad(){
    const arr = historico.slice(0,5);
    const r = arr.filter(c=>c===1).length;
    const p = arr.filter(c=>c===2).length;
    if (r>p) return 1;
    if (p>r) return 2;
    return [1,2][Math.floor(Math.random()*2)];
  }

  async function fetchLast(){
    try{
      const r = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const j = await r.json(); const rod = j[0];
      if (!rod || rod.id===window._lastId) return;
      window._lastId = rod.id;
      historico.unshift(rod.color);
      localStorage.setItem("historicoIA",JSON.stringify(historico));

      if(ultimaPrev !== null){
        if(rod.color===ultimaPrev || rod.color===0) acertos++;
        else erros++;
      }

      trainModel();
      decide();

    }catch(e){console.error(e);}
  }

  function decide(){
    renderHist();
    const sug = document.getElementById("sugestaoIA");
    if (historico.length <5) {
      sug.textContent = `⏳ Esperando ${5-historico.length} resultados...`;
      ultimaPrev = null;
      return;
    }
    const ia = predIA(), tr = predTrad();
    if (ia && ia.conf>90 && ia.cor===tr){
      ultimaPrev = ia.cor;
      const txt = ia.cor===0?"⚪ Branco": ia.cor===1?"🔴 Vermelho + ⚪":"⚫ Preto + ⚪";
      const bg = ia.cor===0? "#fff": ia.cor===1?"red":"black";
      const corTxt = ia.cor===0? "#000":"#fff";
      sug.textContent = txt;
      sug.style.background = bg;
      sug.style.color = corTxt;
    } else {
      sug.textContent = "⏳ Aguardando previsão com confiança >90%...";
      sug.style.background = "#222";
      sug.style.color = "#fff";
      ultimaPrev = null;
    }
  }

  fetchLast();
  setInterval(fetchLast, 3000);

})();
