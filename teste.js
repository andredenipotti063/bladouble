// ==UserScript==
// @name         Blaze Previsão IA Melhorada
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  IA + lógica + proteção branco ⚪ + histórico expansível + contador + início rápido (5 jogadas)
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// @run-at       document-end
// ==/UserScript==

(async function(){
  if (window.hasRunBlazeScript) return;
  window.hasRunBlazeScript = true;

  // Carrega TensorFlow.js
  await new Promise((res,rej)=>{
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js';
    s.onload=res; s.onerror=rej;
    document.head.appendChild(s);
  });

  const HIST_LIMIT=50;
  let historico = JSON.parse(localStorage.getItem("blazeHist")||"[]");
  let acertos=0, erros=0, ultimaPrev=null, expandido=true;

  // Estilo
  const st=document.createElement("style");
  st.innerHTML=`
    #blazePainel{position:fixed;top:20px;left:20px;
      background:#111;color:#fff;padding:12px;border-radius:8px;
      z-index:99999;width:300px;font-family:Arial,sans-serif;box-shadow:0 0 8px #000;cursor:move;}
    #blazePainel h1{margin:0 0 8px;font-size:16px;text-align:center;}
    #sugestao{padding:8px;border-radius:6px;text-align:center;
      font-weight:bold;background:#222;margin-bottom:6px;}
    #historico{display:flex;flex-wrap:wrap;max-height:80px;overflow-y:auto;margin-bottom:6px;}
    .bola{width:16px;height:16px;border-radius:50%;margin:2px;}
    .branco{background:white;border:1px solid #999;}
    .vermelho{background:red;}
    .preto{background:black;}
    #contador,#taxa{font-size:14px;text-align:center;margin:4px 0;}
    button{background:#333;color:#fff;border:none;padding:5px 8px;
      border-radius:5px;cursor:pointer;margin:2px;width:48%;}
  `;
  document.head.appendChild(st);

  // HTML
  const pnl=document.createElement("div"); pnl.id="blazePainel";
  pnl.innerHTML=`
    <h1>🎯 Blaze IA + Lógica</h1>
    <div id="sugestao">⏳ Esperando 5 resultados para iniciar IA...</div>
    <div id="historico"></div>
    <div id="contador">Coletados: ${historico.length}</div>
    <div id="taxa">✅ 0 | ❌ 0 | 🎯 0%</div>
    <div style="text-align:center;">
      <button id="reset">🔁 Reset</button>
      <button id="toggle">🔼 Recolher</button>
    </div>`;
  document.body.appendChild(pnl);

  // Drag suporte mobile/desktp
  let drag=false,sx,sy,ix,iy;
  pnl.addEventListener("mousedown",e=>{drag=true; sx=e.clientX; sy=e.clientY; ix=pnl.offsetLeft; iy=pnl.offsetTop;});
  window.addEventListener("mousemove",e=>{if(drag){pnl.style.left=ix+(e.clientX-sx)+"px"; pnl.style.top=iy+(e.clientY-sy)+"px";}});
  window.addEventListener("mouseup",()=>drag=false);
  pnl.addEventListener("touchstart",e=>{if(e.touches.length===1){drag=true; sx=e.touches[0].clientX; sy=e.touches[0].clientY; ix=pnl.offsetLeft; iy=pnl.offsetTop;}}, {passive:false});
  window.addEventListener("touchmove",e=>{if(drag&&e.touches.length===1){pnl.style.left=ix+(e.touches[0].clientX-sx)+"px"; pnl.style.top=iy+(e.touches[0].clientY-sy)+"px"; }}, {passive:false});
  window.addEventListener("touchend",()=>drag=false);

  document.getElementById("reset").onclick=()=>{
    historico=[];acertos=0;erros=0;ultimaPrev=null;
    localStorage.removeItem("blazeHist");
    render();
  };
  document.getElementById("toggle").onclick=()=>{
    expandido=!expandido;
    document.getElementById("toggle").textContent= expandido?"🔽 Recolher":"🔼 Expandir";
    render();
  };

  function render(){
    const histBox=document.getElementById("historico");
    histBox.innerHTML="";
    (expandido ? historico : historico.slice(0,12)).forEach(c=>{
      const d=document.createElement("div");
      d.className="bola "+(c===0?"branco":c===1?"vermelho":"preto");
      histBox.appendChild(d);
    });
    document.getElementById("contador").textContent=`Coletados: ${historico.length}`;
    const total=acertos+erros;
    document.getElementById("taxa").textContent=`✅ ${acertos} | ❌ ${erros} | 🎯 ${total>0?((acertos/total)*100).toFixed(1):0}%`;
  }

  // IA
  const model=tf.sequential();
  model.add(tf.layers.dense({inputShape:[5],units:10,activation:'relu'}));
  model.add(tf.layers.dense({units:3,activation:'softmax'}));
  model.compile({optimizer:'adam',loss:'categoricalCrossentropy'});

  function train(){
    if(historico.length<10) return;
    const X=[],Y=[];
    for(let i=0;i<=historico.length-6;i++){
      X.push(historico.slice(i,i+5));
      const o=[0,0,0]; o[historico[i+5]]=1;
      Y.push(o);
    }
    const xs=tf.tensor2d(X), ys=tf.tensor2d(Y);
    model.fit(xs,ys,{epochs:5,verbose:0});
    xs.dispose(); ys.dispose();
  }

  function predIA(){
    if(historico.length<5) return null;
    const inp=tf.tensor2d([historico.slice(0,5)]);
    const out=model.predict(inp);
    const arr=out.dataSync();
    inp.dispose(); out.dispose();
    const mx=Math.max(...arr), idx=arr.indexOf(mx);
    return { cor: idx, conf: mx*100 };
  }

  function predTrad(){
    const a=historico.slice(0,5);
    const r=a.filter(c=>c===1).length;
    const p=a.filter(c=>c===2).length;
    return r>p?1:(p>r?2:[1,2][Math.floor(Math.random()*2)]);
  }

  async function fetchLast(){
    try{
      const r=await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const j=await r.json(), rod=j[0];
      if(!rod?.id || rod.id===window._lastId) return;
      window._lastId=rod.id;
      historico.unshift(rod.color);
      if(historico.length>HIST_LIMIT) historico.pop();
      localStorage.setItem("blazeHist", JSON.stringify(historico));
      if(ultimaPrev!==null){
        if(rod.color===ultimaPrev || rod.color===0) acertos++; else erros++;
      }
      train(); decide(); render();
    }catch(e){console.error(e);}
  }

  function decide(){
    const sug=document.getElementById("sugestao");
    if(historico.length<5){
      sug.textContent=`⏳ Esperando ${5-historico.length} resultados...`;
      sug.style.background="#222"; ultimaPrev=null;
      return;
    }
    const ia=predIA(), tr=predTrad();
    if(ia && ia.conf>90 && ia.cor===tr){
      ultimaPrev=ia.cor;
      const txt= ia.cor===0?"⚪ Branco": ia.cor===1?"🔴 Vermelho + ⚪":"⚫ Preto + ⚪";
      const bg= ia.cor===0?"white": ia.cor===1?"red":"black";
      const colorText= ia.cor===0?"#000":"#fff";
      sug.textContent=txt;
      sug.style.background=bg;
      sug.style.color=colorText;
    } else {
      sug.textContent="⏳ Aguardando confiança >90% + concordância...";
      sug.style.background="#222"; sug.style.color="#fff";
      ultimaPrev=null;
    }
  }

  fetchLast();
  setInterval(fetchLast,3000);
})();
