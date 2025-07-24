// ==UserScript==
// @name         Blaze IA Corrigida
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  IA com proteção no branco e assertividade alta para Roleta Blaze
// @match        https://blaze.com/*
// @grant        none
// ==/UserScript==

(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: fixed; top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 15px; border-radius: 10px;
      z-index: 9999; font-family: Arial, sans-serif;
      width: 280px; box-shadow: 0 0 10px rgba(0,0,0,0.4);
      cursor: move;
    }
    #doubleBlackPainel h1 { margin: 0 0 10px; font-size: 16px; text-align: center; }
    #sugestaoBox {
      padding: 10px; text-align: center;
      font-weight: bold; border-radius: 8px;
      background-color: #222; margin-bottom: 10px;
    }
    #historicoBox {
      display: flex; gap: 4px; justify-content: center;
      flex-wrap: wrap; margin-bottom: 10px;
    }
    .bolaHist { width: 20px; height: 20px; border-radius: 50%; }
    .pretoHist { background: black; }
    .vermelhoHist { background: red; }
    .brancoHist { background: white; border: 1px solid #999; }
    #acertosBox { text-align: center; font-size: 14px; margin-top: 5px; }
  `;
  document.head.appendChild(style);

  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Blaze IA</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
  `;
  document.body.appendChild(painel);

  let isDragging = false, startX, startY, initialLeft, initialTop;
  painel.addEventListener("mousedown", e => {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX; startY = e.clientY;
    initialLeft = painel.offsetLeft; initialTop = painel.offsetTop;
  });
  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    painel.style.left = initialLeft + (e.clientX - startX) + "px";
    painel.style.top = initialTop + (e.clientY - startY) + "px";
  });
  document.addEventListener("mouseup", () => isDragging = false);

  // --- IA Variables ---
  const historico = [];
  let ultimoId = null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;

  async function fetchUltimo() {
    try {
      const res = await fetch("https://blaze.com/api/roulette_games/recent");
      const data = await res.json();
      const rodada = data[0];
      const cor = rodada.color;
      const id = rodada.id;

      if (id !== ultimoId && cor !== undefined) {
        historico.unshift(cor);
        if (historico.length > 100) historico.pop();

        if (ultimaPrevisao !== null) {
          if (cor === ultimaPrevisao || (ultimaPrevisao === 2 && cor === 0)) {
            acertos++;
          } else {
            erros++;
          }
        }

        ultimoId = id;
        atualizarPainel();
      }
    } catch (e) {
      console.log("❌ Erro na API:", e);
    }
  }

  function prever(h) {
    if (h.length < 5) {
      return { texto: "⏳ Coletando dados...", cor: "#333", previsao: null };
    }

    const ult7 = h.slice(0, 7);
    const ult40 = h.slice(0, 40);

    const count = (arr, val) => arr.filter(x => x === val).length;
    const pretos = count(ult7, 2);
    const vermelhos = count(ult7, 1);
    const brancos = count(ult40, 0);

    // Repetição
    if (ult7.slice(0, 4).every(c => c === 2)) return { texto: "🔁 Inversão: Apostar Vermelho ⚪", cor: "red", previsao: 1 };
    if (ult7.slice(0, 4).every(c => c === 1)) return { texto: "🔁 Inversão: Apostar Preto ⚪", cor: "black", previsao: 2 };

    // Tendência
    if (pretos >= 5) return { texto: "📊 Tendência: Apostar Vermelho ⚪", cor: "red", previsao: 1 };
    if (vermelhos >= 5) return { texto: "📊 Tendência: Apostar Preto ⚪", cor: "black", previsao: 2 };

    // Branco só com muita certeza (nenhum em 40 e previsão anterior não era branco)
    if (!ult40.includes(0) && ultimaPrevisao !== 0)
      return { texto: "⚪ Alerta de Branco", cor: "white", previsao: null };

    return { texto: "⏳ Aguardando padrão...", cor: "#333", previsao: null };
  }

  function atualizarPainel() {
    const { texto, cor, previsao } = prever(historico);
    ultimaPrevisao = previsao;

    const sugestao = document.getElementById("sugestaoBox");
    sugestao.textContent = previsao !== null ? `✅ Apostar: ${texto}` : texto;
    sugestao.style.background = cor;
    sugestao.style.color = cor === "white" ? "#000" : "#fff";

    const box = document.getElementById("historicoBox");
    box.innerHTML = "";
    historico.slice(0, 12).forEach(c => {
      const div = document.createElement("div");
      div.className = "bolaHist " + (c === 0 ? "brancoHist" : c === 2 ? "pretoHist" : "vermelhoHist");
      box.appendChild(div);
    });

    const total = acertos + erros;
    const taxa = total ? ((acertos / total) * 100).toFixed(1) : "0.0";
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  await fetchUltimo();
  setInterval(fetchUltimo, 3000);
})();
