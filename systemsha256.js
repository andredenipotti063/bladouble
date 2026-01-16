(() => {
  const ID = 'cyberpunk-hack';
  if (document.getElementById(ID)) document.getElementById(ID).remove();

  const API = 'https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1';
  const INTERVAL = 1200;
  const BAR_TIME = 1000;
  const MAX_ENTRIES = 10;

  const GOLD = '#ffb000';
  const RED  = '#ff003c';

  const SEQ = [
    'black','red','red','black','red',
    'black','red','red','black','red'
  ];

  let idx = 0, lastId = null, minimized = false;
  let entries = 0;
  let finished = false;

  /* ================= CSS ================= */
  const style = document.createElement('style');
  style.innerHTML = `
  #${ID}{
    position:fixed;
    top:20px;
    right:20px;
    width:260px;
    background:#050400;
    border:2px solid ${GOLD};
    box-shadow:0 0 24px ${GOLD};
    font-family:monospace;
    color:#fff;
    z-index:999999;
  }

  .head{
    cursor:move;
    padding:6px 8px;
    font-size:12px;
    font-weight:900;
    color:${GOLD};
    display:flex;
    justify-content:space-between;
    align-items:center;
    border-bottom:1px solid rgba(255,176,0,.45);
    background:#070500;
    user-select:none;
  }

  .min-btn{cursor:pointer}
  .body{padding:6px; position:relative}

  .status{
    text-align:center;
    font-size:12px;
    font-weight:900;
    margin-bottom:6px;
  }

  .black{color:#ccc}

  /* 🔴 VERMELHO NORMAL (SEM NEON) */
  .red{
    color:${RED};
    text-shadow:none;
  }

  .diamond-wrap{
    position:absolute;
    inset:-18px;
    display:flex;
    align-items:center;
    justify-content:center;
    pointer-events:none;
    z-index:0;
  }

  .diamond{
    width:130px;
    height:130px;
    transform:rotate(45deg);
    background:linear-gradient(135deg,
      rgba(255,176,0,.22),
      rgba(255,176,0,.06),
      rgba(255,176,0,.22)
    );
    box-shadow:
      0 0 24px ${GOLD},
      0 0 60px rgba(255,176,0,.8),
      inset 0 0 22px rgba(255,176,0,.7);
    animation:diamondPulse 2.4s ease-in-out infinite;
  }

  .diamond-border{
    position:absolute;
    width:150px;
    height:150px;
    transform:rotate(45deg);
    border:2px solid rgba(255,176,0,.7);
    filter:drop-shadow(0 0 18px ${GOLD});
    animation:diamondSpin 8s linear infinite;
  }

  @keyframes diamondPulse{
    0%,100%{opacity:.65}
    50%{opacity:1}
  }

  @keyframes diamondSpin{
    to{transform:rotate(405deg)}
  }

  .radar-bg{
    position:relative;
    width:96px;
    height:96px;
    margin:6px auto;
    border-radius:50%;
    background:radial-gradient(circle, rgba(255,176,0,.18), transparent 70%);
    box-shadow:0 0 30px rgba(255,176,0,.9);
    z-index:2;
  }

  .radar{
    position:absolute;
    inset:8px;
    border-radius:50%;
    background:radial-gradient(circle, rgba(255,176,0,.45), transparent 65%);
    box-shadow:0 0 22px rgba(255,176,0,1);
    overflow:hidden;
  }

  .radar::before{
    content:'';
    position:absolute;
    inset:0;
    background:
      repeating-linear-gradient(0deg,rgba(255,176,0,.25) 0 1px,transparent 1px 10px),
      repeating-linear-gradient(90deg,rgba(255,176,0,.25) 0 1px,transparent 1px 10px);
    opacity:.35;
  }

  .sweep{
    position:absolute;
    inset:-25%;
    background:conic-gradient(
      rgba(255,176,0,0),
      rgba(255,176,0,1),
      rgba(255,176,0,0)
    );
    animation:sweep 1s linear infinite;
  }

  @keyframes sweep{to{transform:rotate(360deg)}}

  .ring{
    position:absolute;
    inset:0;
    border-radius:50%;
    background:conic-gradient(${GOLD} var(--p), rgba(255,176,0,.25) 0);
    mask:radial-gradient(circle, transparent 60%, #000 62%);
  }

  .percent{
    position:absolute;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:11px;
    font-weight:900;
    color:#000;
    text-shadow:0 0 6px #000;
    z-index:5;
  }

  .log-wrapper{
    max-height:0;
    overflow:hidden;
    border-top:1px solid rgba(255,176,0,.45);
    margin-top:6px;
    transition:max-height .25s ease;
  }

  #${ID}:hover .log-wrapper{max-height:140px}

  .log-wrapper div{
    font-size:11px;
    padding:2px 4px;
  }

  .footer{
    text-align:center;
    font-size:9px;
    color:${GOLD};
    margin-top:4px;
  }

  .online{
    color:#7CFF00;
    text-shadow:0 0 6px #7CFF00;
  }

  .minimized .body{display:none}

  .final-msg{
    position:absolute;
    inset:0;
    display:flex;
    align-items:center;
    justify-content:center;
    background:rgba(0,0,0,.9);
    z-index:50;
    font-size:20px;
    font-weight:900;
    color:${GOLD};
    text-align:center;
    text-shadow:
      0 0 12px ${GOLD},
      0 0 28px ${GOLD},
      0 0 60px rgba(255,176,0,1);
    animation:finalPulse 1.8s ease-in-out infinite;
  }

  @keyframes finalPulse{
    0%,100%{opacity:.6}
    50%{opacity:1}
  }
  `;
  document.head.appendChild(style);

  /* ================= HTML ================= */
  const box = document.createElement('div');
  box.id = ID;
  box.innerHTML = `
    <div class="head">
      <span>⚠ FALHA SYSTEM SHA256</span>
      <span class="min-btn">—</span>
    </div>

    <div class="body">
      <div id="status" class="status">AGUARDANDO...</div>

      <div class="radar-bg">
        <div class="diamond-wrap">
          <div class="diamond"></div>
          <div class="diamond-border"></div>
        </div>

        <div id="radar" class="radar" style="--p:0%">
          <div class="ring"></div>
          <div class="sweep"></div>
          <div id="percent" class="percent">0%</div>
        </div>
      </div>

      <div class="log-wrapper" id="log"></div>

      <div class="footer">
        SYNC BLAZE API • <span class="online">● ONLINE</span>
      </div>
    </div>
  `;
  document.body.appendChild(box);

  const head = box.querySelector('.head');
  const minBtn = box.querySelector('.min-btn');
  const statusEl = box.querySelector('#status');
  const radar = box.querySelector('#radar');
  const percentEl = box.querySelector('#percent');
  const logEl = box.querySelector('#log');
  const bodyEl = box.querySelector('.body');

  let dx, dy, drag=false;
  head.onmousedown=e=>{
    drag=true;
    dx=e.clientX-box.offsetLeft;
    dy=e.clientY-box.offsetTop;
  };
  document.onmousemove=e=>{
    if(drag){
      box.style.left=e.clientX-dx+'px';
      box.style.top=e.clientY-dy+'px';
      box.style.right='auto';
    }
  };
  document.onmouseup=()=>drag=false;

  minBtn.onclick=()=>{
    minimized=!minimized;
    box.classList.toggle('minimized',minimized);
    minBtn.textContent=minimized?'+':'—';
  };

  function runRadar(){
    let s=Date.now();
    const t=setInterval(()=>{
      const p=Math.min(100,((Date.now()-s)/BAR_TIME)*100);
      radar.style.setProperty('--p',p+'%');
      percentEl.textContent=(p|0)+'%';
      if(p>=100) clearInterval(t);
    },16);
  }

  function addLog(c){
    const d=document.createElement('div');
    d.className=c;
    d.textContent='Exploit • '+(c==='red'?'RED':'BLACK');
    logEl.prepend(d);
  }

  function showFinal(){
    if(finished) return;
    finished = true;
    const msg=document.createElement('div');
    msg.className='final-msg';
    msg.textContent='BUG SYSTEM FINISHED';
    bodyEl.appendChild(msg);
  }

  async function poll(){
    if(finished) return;
    try{
      const r=await fetch(API,{cache:'no-store'});
      const d=await r.json();
      const g=d[0];
      if(!g) return;
      const id=g.id||g.created_at;
      if(id!==lastId){
        lastId=id;
        const c=SEQ[idx++ % SEQ.length];
        statusEl.className='status '+c;
        statusEl.textContent='CONNECTED '+(c==='red'?'VERMELHO':'PRETO');
        addLog(c);
        runRadar();
        entries++;
        if(entries>=MAX_ENTRIES) showFinal();
      }
    }catch{}
  }

  setInterval(poll,INTERVAL);
  poll();
})();
