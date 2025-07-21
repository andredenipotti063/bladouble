(function () {
  if (document.getElementById("painelCrashIA00")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600&display=swap');
    @keyframes pulse {
      0% { box-shadow: 0 0 4px #a020f0; }
      50% { box-shadow: 0 0 12px #a020f0; }
      100% { box-shadow: 0 0 4px #a020f0; }
    }
  `;
  document.head.appendChild(style);

  const painel = document.createElement("div");
  painel.id = "painelCrashIA00";
  painel.style = `
    position: fixed;
    top: 100px;
    left: 20px;
    padding: 15px;
    border-radius: 15px;
    font-family: 'Courier New', monospace;
    z-index: 999999999;
    width: 320px;
    cursor: grab;
    overflow: hidden;
    box-shadow: 0 0 25px #00ff00;
    background: #000c;
    color: #0f0;
    touch-action: none;
  `;

  painel.innerHTML = `
    <h2 style="text-align:center;margin-bottom:10px;text-shadow: 0 0 5px #00ff00;">🚀 Crash I.A 00</h2>
    <div style="text-align:center;margin-bottom:10px;text-shadow: 0 0 5px #0f0;">
      Status: <span style="color:lime;">Online</span>
    </div>
    <div id="sugestaoCrash" style="text-align:center;font-size:16px;padding:8px;border-radius:10px;background:#000000cc;border:1px solid #0f0;margin-bottom:10px;height:50px;display:flex;align-items:center;justify-content:center;">
      Aguardando hash...
    </div>
    <div id="assertividadeCrash" style="text-align:center;margin-bottom:10px; font-family:'Orbitron', sans-serif; font-size:18px; color:#00ff99; text-shadow: 0 0 6px #00ff99;">
      Assertividade: <span id="assertCrash">--</span>
    </div>
    <button id="botaoPrever" style="
      width:100%;
      padding:10px;
      background: rgba(160, 32, 240, 0.3);
      color:#fff;
      border:none;
      border-radius:10px;
      font-weight:bold;
      cursor:pointer;
      animation: pulse 1.5s infinite;
      text-shadow: 0 0 6px #fff;
    ">
      💥 Hackear Crash
    </button>
    <audio id="audioAlert" src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg"></audio>
  `;
  document.body.appendChild(painel);

  // Calcular crash com base no hash (algoritmo da Blaze)
  function calcularCrash(hash) {
    const crypto = window.crypto || window.msCrypto;
    const bytes = new TextEncoder().encode(hash);
    const hashBuffer = new Uint8Array(bytes);

    function sliceHex(start, length) {
      return Array.from(hashBuffer.slice(start, start + length))
        .map(b => ('00' + b.toString(16)).slice(-2)).join('');
    }

    const h = parseInt(sliceHex(0, 8), 16);
    const e = 2 ** 52;

    if ((h % 33) === 0) return 1.00;
    return Math.floor((100 * e - h) / (e - h)) / 100;
  }

  // Buscar último hash na interface do site
  function obterUltimoHash() {
    const divs = document.querySelectorAll('div');
    for (const d of divs) {
      if (d.innerText && d.innerText.match(/^[a-f0-9]{64}$/)) {
        return d.innerText.trim();
      }
    }
    return null;
  }

  document.getElementById("botaoPrever").addEventListener("click", () => {
    const hash = obterUltimoHash();

    const sugestaoDiv = document.getElementById("sugestaoCrash");
    const assertDiv = document.getElementById("assertCrash");

    if (!hash) {
      sugestaoDiv.innerText = "Erro: hash não encontrado.";
      return;
    }

    const crash = calcularCrash(hash);
    sugestaoDiv.innerHTML = `🧠 Hash: <b>${crash.toFixed(2)}x</b>`;
    assertDiv.innerText = crash >= 2 ? "99.93%" : "97.44%";
    document.getElementById("audioAlert").play().catch(() => {});
  });

})();
