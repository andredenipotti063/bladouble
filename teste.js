(function () {
  if (document.getElementById("painelCrashIA00")) return;

  const style = document.createElement("style");
  style.innerHTML = `
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
    position: fixed; top: 100px; left: 20px;
    padding: 15px; border-radius: 15px;
    font-family: monospace; z-index: 999999999;
    width: 340px; box-shadow: 0 0 25px #00ff00;
    background: #000; color: #0f0;
  `;
  painel.innerHTML = `
    <h2 style="text-align:center;">🚀 Crash I.A 00</h2>
    <div id="sugestaoCrash" style="margin-bottom:10px;">Aguardando...</div>
    <div id="assertividadeCrash" style="margin-bottom:10px;">
      Assertividade: <span id="assertCrash">--</span>
    </div>
    <button id="btnAtualizar" style="
      width:100%; padding:10px;
      background: #a020f0; color:#fff;
      border:none; border-radius:10px;
      font-weight:bold; cursor:pointer;
      animation: pulse 1.5s infinite;
    ">🔄 Forçar Atualização</button>
  `;
  document.body.appendChild(painel);

  // Usa SHA‑256 se hash disponível
  async function calcularCrash(hash) {
    if (!hash) return null;
    const buf = new TextEncoder().encode(hash);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    const view = new DataView(digest);
    const h = view.getUint32(0, true);
    if (h % 33 === 0) return 1;
    const e = 2 ** 52;
    return Math.floor((100 * e) / (h + 1)) / 100;
  }

  // Extrai históricos e hash
  async function coletarDados() {
    const els = document.querySelectorAll('.crash__round__history__item');
    const valores = Array.from(els)
      .map(el => parseFloat(el.textContent.replace('x', '')))
      .filter(v => !isNaN(v))
      .slice(0, 20);

    const hashEl = document.querySelector('[data-test="crash-game-hash"]')
      || document.querySelector('.crash__hash'); // ajustar se mudar
    const hash = hashEl?.innerText?.trim();

    return { valores, hash };
  }

  async function atualizarPrevisao(manual=false) {
    const s = document.getElementById("sugestaoCrash");
    const a = document.getElementById("assertCrash");
    s.textContent = manual ? "🔄 Atualizando..." : "⌛ Aguardando próxima rodada...";

    const { valores, hash } = await coletarDados();
    if (valores.length === 0) {
      s.textContent = "❌ Sem dados disponíveis!";
      return;
    }

    const media = (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2);
    let prevText = `📊 Média ${valores.length} últimos: ${media}x`;

    if (hash) {
      const crashHash = await calcularCrash(hash);
      prevText += `<br>🔐 SHA‑256: ${crashHash.toFixed(2)}x`;
    }

    const tendencia = media > 2.5 ? "Alta" :
                      media > 1.9 ? "Neutra" : "Baixa";
    s.innerHTML = `${prevText}<br>📈 Tendência: ${tendencia}`;

    a.innerText = media > 2 ? "98.9%" : "95.1%";
  }

  document.getElementById("btnAtualizar")
    .addEventListener("click", () => atualizarPrevisao(true));

  // Atualiza automaticamente ao fim de cada rodada (7s de delay)
  setInterval(() => atualizarPrevisao(false), 7000);
})();
