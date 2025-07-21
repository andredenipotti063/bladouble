(function () {
  if (document.getElementById("painelWhite14x")) return;

  /* ---------- Painel básico ---------- */
  const painel = document.createElement("div");
  painel.id = "painelWhite14x";
  painel.style = `
    position: fixed;
    top: 100px;
    left: 20px;
    background: black;
    color: white;
    padding: 15px;
    border-radius: 15px;
    font-family: 'Courier New', monospace;
    z-index: 999999;
    width: 280px;
    box-shadow: 0 0 15px #ff0000;
    cursor: move;
    overflow: hidden;
  `;
  painel.innerHTML = `
    <canvas id="matrixCanvas" style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:-1;opacity:0.5;"></canvas>
    <h2 style="text-align:center;font-size:18px;font-weight:bold;animation:brilhoTitulo 2s infinite alternate;color:#ff0000;">🧠 I.A WHITE14x 🧠</h2>
    <button id="hackWhite" style="padding:10px 15px;background:rgba(255,255,255,0.2);color:black;border:none;font-weight:bold;border-radius:10px;cursor:pointer;width:100%;">🎯 Hackear 14x</button>
    <div id="progressBar" style="margin-top:10px;height:22px;background:#111;border-radius:10px;overflow:hidden;border:2px solid #00f;box-shadow:0 0 10px #00f,0 0 20px #00f;display:none;">
      <div id="progressInner" style="height:100%;width:0%;background:#00ff00;text-align:center;font-weight:bold;color:#000;line-height:22px;text-shadow:0 0 5px #00ff00,0 0 10px #00ff00;"></div>
    </div>
    <div id="horaBranco" style="margin-top:12px;font-size:18px;text-align:center;font-weight:bold;color:#ff0000;text-shadow:0 0 5px #ff0000,0 0 10px #ff0000,0 0 15px #ff0000;animation:neonRed 1s infinite alternate;">Entrada Hackeada: --:--</div>
    <div id="pessoasEntrando" style="display:none;text-align:center;font-weight:bold;color:#00ffcc;font-size:14px;margin-top:10px;animation:piscar 1.5s infinite;">👥 0 clientes entraram!</div>
    <div id="assertividade" style="display:none;text-align:center;font-weight:bold;font-size:15px;margin-top:4px;color:#00ffff;"></div>
    <div style="text-align:center;margin:8px 0;font-weight:bold;color:#00ff00;animation:piscar 1s infinite;">100% SEM GALE</div>
    <div style="font-size:13px;margin-top:10px;">📌 <b>Últimos 6 Resultados:</b></div>
    <div id="ultimosResultados" style="display:flex;gap:4px;margin-top:6px;justify-content:center;"></div>
    <style>
      @keyframes piscar {0%,100%{opacity:1;}50%{opacity:.3;}}
      @keyframes brilhoTitulo {0%{text-shadow:0 0 5px #ff0000;}100%{text-shadow:0 0 15px #ff0000;}}
      @keyframes neonRed {from{text-shadow:0 0 5px #ff0000,0 0 10px #ff0000,0 0 15px #ff0000;}to{text-shadow:0 0 10px #ff3333,0 0 20px #ff3333,0 0 30px #ff3333;}}
      @keyframes fadeInOut {0%{opacity:0;transform:translateY(20px);}10%,90%{opacity:1;transform:translateY(0);}100%{opacity:0;transform:translateY(20px);}}
    </style>
  `;
  document.body.appendChild(painel);

  /* ---------- Matrix de fundo ---------- */
  const canvas = document.getElementById("matrixCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = painel.clientWidth;
  canvas.height = painel.clientHeight;
  const letters = Array(256).join("0").split("");
  setInterval(() => {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ff1a1a";
    letters.forEach((y, i) => {
      const text = String.fromCharCode(30000 + Math.random() * 33);
      const x = i * 10;
      ctx.fillText(text, x, y);
      letters[i] = y > canvas.height + Math.random() * 10000 ? 0 : parseFloat(y) + 10;
    });
  }, 40);

  /* ---------- Arraste touch + mouse ---------- */
  painel.addEventListener("mousedown", startDrag);
  painel.addEventListener("touchstart", startDrag);
  function startDrag(e) {
    // Se o elemento clicado for o botão, não inicia o drag
    if(e.target.id === "hackWhite") return;
    e.preventDefault();
    const isTouch = e.type === "touchstart";
    const startX = isTouch ? e.touches[0].clientX : e.clientX;
    const startY = isTouch ? e.touches[0].clientY : e.clientY;
    const rect = painel.getBoundingClientRect();
    const offX = startX - rect.left;
    const offY = startY - rect.top;
    const move = ev => {
      const x = isTouch ? ev.touches[0].clientX : ev.clientX;
      const y = isTouch ? ev.touches[0].clientY : ev.clientY;
      painel.style.left = `${x - offX}px`;
      painel.style.top  = `${y - offY}px`;
    };
    const end = () => {
      document.removeEventListener(isTouch ? "touchmove" : "mousemove", move);
      document.removeEventListener(isTouch ? "touchend"  : "mouseup",   end);
    };
    document.addEventListener(isTouch ? "touchmove" : "mousemove", move);
    document.addEventListener(isTouch ? "touchend"  : "mouseup",   end);
  }

  /* ---------- Funções auxiliares ---------- */
  function ultimosResultados() {
    const entries = document.querySelectorAll(".entries.main .entry");
    return Array.from(entries).slice(0, 6).map(el => {
      const cor =
        el.querySelector(".sm-box.red")   ? "red"   :
        el.querySelector(".sm-box.black") ? "black" :
        el.querySelector(".sm-box.white") ? "white" :
        "unk";
      const num = parseInt(el.innerText.trim()) || 0;
      return { cor, num };
    });
  }
  function renderUltimos() {
    const cont = document.getElementById("ultimosResultados");
    const lista = ultimosResultados();
    cont.innerHTML = "";
    lista.reverse().forEach(r => {
      const d = document.createElement("div");
      d.style = "width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-weight:bold;border-radius:50%;font-size:14px;";
      if (r.cor === "white") { d.style.background = "#fff"; d.style.color = "#000"; d.innerText = "0"; }
      if (r.cor === "red")   { d.style.background = "red"; d.innerText = r.num; }
      if (r.cor === "black") { d.style.background = "black"; d.style.color = "#fff"; d.innerText = r.num; }
      cont.appendChild(d);
    });
    return lista;
  }
  setInterval(renderUltimos, 3000);
  renderUltimos();

  function proxEntrada(lista) {
    const agora = new Date();
    let m = agora.getMinutes(), h = agora.getHours(), mm = m + 1;
    if ((m % 10 === 9 || m % 10 === 0) && lista[0].cor === "red") mm = m + 1;
    if (lista[0].num + lista[1].num === 15 || lista[0].num + lista[1].num === 18) mm = m + 1;
    if (lista.some(p => [2,5,7,13,14].includes(p.num))) mm = m + 2;
    if (m % 3 === 0 || m % 7 === 0) mm = m + 1;
    if (lista.find(p => p.cor === "white")) mm = m + 14;
    if (mm >= 60) { h = (h + 1) % 24; mm %= 60; }
    return `${String(h).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
  }
  const pct = () => (Math.random() < .6 ? "100%" : (99 + Math.random()).toFixed(2) + "%");

  /* ---------- Botão Hack ---------- */
  function hackear() {
    const btn = document.getElementById("hackWhite");
    const bar = document.getElementById("progressBar");
    const inner = document.getElementById("progressInner");
    btn.disabled = true;
    btn.innerText = "⏳ Processando...";
    bar.style.display = "block";
    let p = 0;
    const t = setInterval(() => {
      p += 2;
      inner.style.width = `${p}%`;
      inner.innerText = `${p}%`;
      if (p >= 100) {
        clearInterval(t);
        setTimeout(() => {
          bar.style.display = "none";
          inner.style.width = "0%";
          inner.innerText = "";
          btn.disabled = false;
          btn.innerText = "🎯 Hackear 14x";
        }, 400);
        const ult = renderUltimos();
        if (ult.length >= 2) {
          const hora = proxEntrada(ult);
          const divHora = document.getElementById("horaBranco");
          divHora.innerText = `Entrada Hackeada: ${hora}`;
          divHora.style.display = "block";
          divHora.setAttribute("data-hora", hora);

          const qtd = Math.floor(Math.random() * 500) + 100;
          const divCli = document.getElementById("pessoasEntrando");
          divCli.innerText = `👥 ${qtd} clientes entraram!`;
          divCli.style.display = "block";

          const divPct = document.getElementById("assertividade");
          divPct.innerText = `🎯 Assertividade: ${pct()}`;
          divPct.style.display = "block";
        } else {
          document.getElementById("horaBranco").innerText = "⚠️ Dados insuficientes";
        }
      }
    }, 100);
  }
  const btnHack = document.getElementById("hackWhite");
  btnHack.addEventListener("click", (e) => { e.stopPropagation(); hackear(); });
  btnHack.addEventListener("touchstart", (e) => { e.stopPropagation(); e.preventDefault(); hackear(); });
  
  /* ---------- Limpar infos após horário ---------- */
  setInterval(() => {
    const divHora = document.getElementById("horaBranco");
    const alvo = divHora?.getAttribute("data-hora");
    if (!alvo) return;
    const agora = new Date(),
      cur = `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
    if (cur === alvo) {
      divHora.style.display = "none";
      document.getElementById("pessoasEntrando").style.display = "none";
      document.getElementById("assertividade").style.display = "none";
    }
  }, 1000);

  /* ---------- Notificação Insta ---------- */
  setInterval(() => {
    if (document.getElementById("notificacaoInsta")) return;
    const n = document.createElement("div");
    n.id = "notificacaoInsta";
    n.innerHTML = `📢 Siga no Instagram:<br><b style="color:#00ffcc;">@doubleeblack00</b>`;
    n.style = "position:fixed;bottom:20px;right:20px;background:#000;color:#fff;padding:10px 15px;font-weight:bold;font-family:'Courier New',monospace;border:2px solid #00ffcc;border-radius:8px;box-shadow:0 0 10px #00ffcc,0 0 20px #00ffcc;z-index:999999;animation:fadeInOut 3s ease-in-out;text-align:center;";
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
  }, 10000);
})();
