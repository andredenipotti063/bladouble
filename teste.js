(async function () {
  if (document.getElementById("doubleBlackPainel")) return;

  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: absolute; top: 30px; left: 30px;
      background: #111; color: #fff;
      padding: 15px; border-radius: 10px;
      z-index: 9999; font-family: Arial, sans-serif;
      width: 280px; box-shadow: 0 0 10px rgba(0,0,0,0.4); cursor: move;
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
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
  `;
  document.body.appendChild(painel);

  // Arrastar painel
  let isDragging = false, startX, startY, initialLeft, initialTop;
  function onDragStart(x, y) {
    isDragging = true;
    startX = x; startY = y;
    initialLeft = painel.offsetLeft;
    initialTop = painel.offsetTop;
  }
  function onDragMove(x, y) {
    if (!isDragging) return;
    const dx = x - startX, dy = y - startY;
    painel.style.left = initialLeft + dx + "px";
    painel.style.top = initialTop + dy + "px";
  }

  painel.addEventListener("mousedown", (e) => {
    e.preventDefault(); onDragStart(e.clientX, e.clientY);
  });
  document.addEventListener("mousemove", (e) => onDragMove(e.clientX, e.clientY));
  document.addEventListener("mouseup", () => isDragging = false);
  painel.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      onDragStart(touch.clientX, touch.clientY);
    }
  }, { passive: false });
  document.addEventListener("touchmove", (e) => {
    if (isDragging && e.touches.length === 1) {
      const touch = e.touches[0];
      onDragMove(touch.clientX, touch.clientY);
    }
  }, { passive: false });
  document.addEventListener("touchend", () => isDragging = false);

  const historico = [];
  let ultimoId = null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;

  async function fetchLast() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color;
      const id = data[0]?.id;

      if (id && cor !== undefined && id !== ultimoId) {
        historico.unshift(cor);
        if (historico.length > 50) historico.pop();

        if (ultimaPrevisao !== null) {
          if (cor === ultimaPrevisao) acertos++;
          else erros++;
        }

        ultimoId = id;
        atualizarPainel();
      }
    } catch (e) {
      console.error("❌ Erro ao buscar API:", e);
    }
  }

  function prever(h) {
    if (h.length < 7) return { cor: \"#333\", texto: \"⌛ Coletando dados...\", previsao: null };

    const ult7 = h.slice(0, 7);
    const ult12 = h.slice(0, 12);
    const ult40 = h.slice(0, 40);
    const count = (arr, val) => arr.filter(n => n === val).length;

    // Estratégia 1: Tendência (repetição)
    const pretos = count(ult7, 2);
    const vermelhos = count(ult7, 1);
    if (pretos >= 5) return { cor: \"red\", texto: \"📊 Tendência: Preto → Vermelho\", previsao: 1 };
    if (vermelhos >= 5) return { cor: \"black\", texto: \"📊 Tendência: Vermelho → Preto\", previsao: 2 };

    // Estratégia 2: Alternância (zigue-zague)
    const alterna = ult7.slice(0, 6).every((val, i, arr) =>
      i === 0 || (val !== 0 && arr[i - 1] !== 0 && val !== arr[i - 1])
    );
    if (alterna) {
      const ultima = ult7[0];
      const proxima = ultima === 1 ? 2 : 1;
      const corTxt = proxima === 1 ? \"Vermelho\" : \"Preto\";
      const corEstilo = proxima === 1 ? \"red\" : \"black\";
      return { cor: corEstilo, texto: `🔁 Zigue-zague: Apostar ${corTxt}`, previsao: proxima };
    }

    // Estratégia 3: Branco por ausência
    if (!ult40.includes(0) && ultimaPrevisao !== 0) {
      return { cor: \"white\", texto: \"⚪️ Alerta: Branco ausente há 40+ rodadas\", previsao: 0 };
    }

    // Estratégia 4: Quebra de padrão com branco
    const ult5 = h.slice(0, 5);
    const repetida = ult5.every((v) => v === ult5[0]) && ult5[0] !== 0;
    if (repetida && h[5] === 0) {
      return { cor: \"white\", texto: \"🚨 Quebra de padrão com Branco!\", previsao: 0 };
    }

    // Estratégia 5: Gatilho visual (quebra incomum)
    if (ult7[0] === 0 && (ult7[1] === ult7[2] && ult7[2] === ult7[3])) {
      const corBase = ult7[1] === 1 ? \"Preto\" : \"Vermelho\";
      const corStyle = ult7[1] === 1 ? \"black\" : \"red\";
      return { cor: corStyle, texto: `🎯 Branco após padrão ${corBase}`, previsao: 0 };
    }

    // Default: Probabilidade simples
    return pretos > vermelhos
      ? { cor: \"red\", texto: \"🤖 Probabilidade: Vermelho\", previsao: 1 }
      : { cor: \"black\", texto: \"🤖 Probabilidade: Preto\", previsao: 2 };
  }

  function atualizarPainel() {
    const ult = historico.slice(0, 12);
    const { cor, texto, previsao } = prever(historico);
    ultimaPrevisao = previsao;

    const sugestao = document.getElementById(\"sugestaoBox\");
    sugestao.textContent = texto;
    sugestao.style.background = cor;
    sugestao.style.color = cor === \"white\" ? \"#000\" : \"#fff\";

    const box = document.getElementById(\"historicoBox\");
    box.innerHTML = \"\";
    ult.forEach(n => {
      const el = document.createElement(\"div\");
      el.className = \"bolaHist \" + (n === 0 ? \"brancoHist\" : n === 2 ? \"pretoHist\" : \"vermelhoHist\");
      box.appendChild(el);
    });

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById(\"acertosBox\").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  await fetchLast();
  setInterval(fetchLast, 3000);
})();
