(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

  // ESTILO
  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: absolute;
      top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 15px; border-radius: 10px;
      z-index: 9999;
      font-family: Arial, sans-serif;
      width: 260px;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
    }
    #doubleBlackPainel h1 {
      font-size: 16px; margin-bottom: 10px;
      text-align: center;
    }
    #sugestaoBox {
      text-align: center;
      padding: 10px;
      background: #222;
      border-radius: 8px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    #historicoBox {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 10px;
    }
    .bolaHist {
      width: 20px; height: 20px;
      border-radius: 50%;
    }
    .pretoHist { background: black; }
    .vermelhoHist { background: red; }
    .brancoHist { background: white; border: 1px solid #999; }
    #acertosBox {
      text-align: center;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);

  // HTML PAINEL
  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Aguardando resultados...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
  `;
  document.body.appendChild(painel);

  // LÓGICA
  const historico = [];
  let ultimoId = null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;

  async function buscarUltimoResultado() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const dados = await res.json();
      const resultado = dados[0];
      const cor = resultado?.color;
      const id = resultado?.id;

      if (id && cor !== undefined && id !== ultimoId) {
        historico.unshift(cor);
        if (historico.length > 50) historico.pop();

        if (ultimaPrevisao !== null) {
          if (cor === ultimaPrevisao || (cor === 0 && ultimaPrevisao !== null)) acertos++;
          else erros++;
        }

        ultimoId = id;
        atualizarPainel();
      }
    } catch (e) {
      console.error("Erro ao buscar resultado:", e);
    }
  }

  function preverCor(h) {
    if (h.length < 7) return null;

    const ult7 = h.slice(0, 7);
    const ult40 = h.slice(0, 40);
    const count = (arr, val) => arr.filter(n => n === val).length;

    // Inversão por repetição
    if (ult7.slice(0, 4).every(n => n === 2)) return { cor: 1 };
    if (ult7.slice(0, 4).every(n => n === 1)) return { cor: 2 };

    // Tendência
    const pretos = count(ult7, 2);
    const vermelhos = count(ult7, 1);
    if (pretos >= 5) return { cor: 1 };
    if (vermelhos >= 5) return { cor: 2 };

    // Alerta de branco
    if (!ult40.includes(0)) return null;

    // Probabilidade leve
    if (pretos > vermelhos) return { cor: 1 };
    if (vermelhos > pretos) return { cor: 2 };

    return null;
  }

  function atualizarPainel() {
    const sugestaoBox = document.getElementById("sugestaoBox");
    const historicoBox = document.getElementById("historicoBox");

    historicoBox.innerHTML = "";
    historico.slice(0, 12).forEach(cor => {
      const bola = document.createElement("div");
      bola.classList.add("bolaHist");
      if (cor === 2) bola.classList.add("pretoHist");
      else if (cor === 1) bola.classList.add("vermelhoHist");
      else bola.classList.add("brancoHist");
      historicoBox.appendChild(bola);
    });

    const previsao = preverCor(historico);
    if (previsao) {
      ultimaPrevisao = previsao.cor;
      const corNome = previsao.cor === 1 ? "Vermelho" : "Preto";
      const corBg = previsao.cor === 1 ? "red" : "black";
      sugestaoBox.textContent = `✅ Apostar: ${corNome} + ⚪`;
      sugestaoBox.style.background = corBg;
      sugestaoBox.style.color = "#fff";
    } else {
      ultimaPrevisao = null;
      sugestaoBox.textContent = "⏳ Aguardando oportunidade...";
      sugestaoBox.style.background = "#222";
      sugestaoBox.style.color = "#fff";
    }

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : "0.0";
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  await buscarUltimoResultado();
  setInterval(buscarUltimoResultado, 3000);
})();
