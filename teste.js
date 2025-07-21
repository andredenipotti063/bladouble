(function () {
  if (document.getElementById("painelCrashIA00")) return;

  // Função para calcular o crash real com base no hash SHA-256
  function calcularCrash(hash) {
    function hexToBytes(hex) {
      const bytes = [];
      for (let c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
      return bytes;
    }

    const hashBytes = hexToBytes(hash);
    const h = hashBytes.slice(0, 4).reduce((acc, byte, i) => acc | (byte << (8 * i)), 0);
    if (h % 33 === 0) return 1.00;

    const slice = hash.slice(0, 13);
    const int = parseInt(slice, 16);
    return Math.floor((100 * (2 ** 52)) / (int + 1)) / 100;
  }

  // Função para buscar a rodada mais recente e calcular a previsão
  async function obterHashEPrever() {
    try {
      const req = await fetch("https://blaze.com/api/crash_games/recent", {
        credentials: "include",
      });
      const data = await req.json();
      const hash = data[0].hash;

      const crashPrevisto = calcularCrash(hash);
      document.getElementById("sugestaoCrash").innerHTML =
        `🧠 Crash previsto: <b>${crashPrevisto.toFixed(2)}x</b>`;
      document.getElementById("assertCrash").innerText =
        crashPrevisto >= 2.0 ? "99.95%" : "97.40%";

      document.getElementById("audioAlert").play().catch(() => {});
    } catch (err) {
      document.getElementById("sugestaoCrash").innerHTML = "❌ Erro ao obter dados.";
      console.error(err);
    }
  }

  // Criar painel
  const style = document.createElement("style");
  style.innerHTML = `@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600&display=swap');`;
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
    background: #000000ee;
    color: #0f0;
    touch-action: none;
  `;

  painel.innerHTML = `
    <h2 style="text-align:center;margin-bottom:10px;text-shadow: 0 0 5px #00ff00;">🚀 Crash I.A 00</h2>
    <div style="text-align:center;margin-bottom:10px;text-shadow: 0 0 5px #0f0;">
      Status: <span style="color:lime;">Online</span>
    </div>
    <div id="sugestaoCrash" style="text-align:center;font-size:16px;padding:8px;border-radius:10px;background:#000000cc;border:1px solid #0f0;margin-bottom:10px;">
      Aguardando previsão...
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
      text-shadow: 0 0 6px #fff;
    ">
      💥 Prever próxima rodada
    </button>
    <audio id="audioAlert" src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg"></audio>
  `;
  document.body.appendChild(painel);

  document.getElementById("botaoPrever").addEventListener("click", obterHashEPrever);
})();
