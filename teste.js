(function () {
  if (document.getElementById("painelCrashIA00")) return;

  // Função para processar HTML da TipMiner
  async function obterHistorico() {
    try {
      const res = await fetch("https://www.tipminer.com/br/historico/blaze/crash?candle=1.50");
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Seleciona linhas da tabela que mostram multiplicador crash
      const valores = Array.from(doc.querySelectorAll(".history-table__row .history-table__multiplier"))
        .slice(0, 10) // pega os 10 mais recentes
        .map(el => parseFloat(el.innerText.replace('x', '').trim()))
        .filter(v => !isNaN(v));

      return valores;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  // Função para prever próximo valor usando média simples
  function preverMedia(lista) {
    const soma = lista.reduce((a, b) => a + b, 0);
    return (soma / lista.length);
  }

  // Cria painel
  const style = document.createElement("style");
  style.textContent = "@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600&display=swap');";
  document.head.appendChild(style);

  const painel = document.createElement("div");
  painel.id = "painelCrashIA00";
  painel.style = `
    position: fixed; top: 100px; left: 20px; width: 320px;
    padding: 15px; border-radius: 15px; font-family: monospace;
    background: #000c; color: #0f0; z-index: 999999999;
    box-shadow: 0 0 25px #0f0;
  `;
  painel.innerHTML = `
    <h2 style="text-align:center;">🚀 Crash I.A 00</h2>
    <div id="sugestaoCrash" style="text-align:center;margin:10px;">
      Aguardando previsão...
    </div>
    <div id="assertCrash" style="text-align:center;font-family:'Orbitron';font-size:18px;">
      --%
    </div>
    <button id="btnPrev" style="width:100%;padding:10px;margin-top:10px;">
      💥 Prever próxima rodada
    </button>
  `;
  document.body.appendChild(painel);

  document.getElementById("btnPrev").addEventListener("click", async () => {
    const lista = await obterHistorico();
    if (!lista || lista.length < 3) {
      document.getElementById("sugestaoCrash").innerText = "Erro ao obter histórico";
      return;
    }

    const media = preverMedia(lista);
    document.getElementById("sugestaoCrash").innerHTML =
      `🧠 Previsão: <b>${media.toFixed(2)}x</b>`;
    document.getElementById("assertCrash").innerText =
      `Com base em ${lista.length} últimas entradas`;
  });

})();
