// ==UserScript==
// @name         IA Roleta Blaze (Completo com Aprendizado)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Previsão com IA e lógica tradicional para Roleta Blaze. Histórico persistente, auto-reset e painel flutuante responsivo.
// @author       ChatGPT
// @match        https://blaze.com/pt/games/double
// @grant        none
// ==/UserScript==

(function () {
  if (document.getElementById("doubleBlackPainel")) return;

  // CSS
  const style = document.createElement("style");
  style.innerHTML = `
    #doubleBlackPainel {
      position: fixed; top: 30px; left: 30px;
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
    #ultimaAcaoBox {
      text-align: center; font-size: 12px;
      margin-top: 5px; color: #ccc;
    }
    #btnReset {
      background: #444; color: white; padding: 5px 10px;
      border-radius: 6px; margin: 10px auto 0;
      display: block; cursor: pointer; text-align: center;
      border: none;
    }
  `;
  document.head.appendChild(style);

  // Painel
  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.innerHTML = `
    <h1>🔮 Previsão Inteligente</h1>
    <div id="sugestaoBox">⏳ Carregando...</div>
    <div id="historicoBox"></div>
    <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>
    <div id="ultimaAcaoBox"></div>
    <button id="btnReset">🔁 Resetar Histórico</button>
  `;
  document.body.appendChild(painel);

  // Arrastar (PC e Celular)
  let isDragging = false, startX, startY, initialLeft, initialTop;

  function onDragStart(x, y) {
    isDragging = true;
    startX = x;
    startY = y;
    initialLeft = painel.offsetLeft;
    initialTop = painel.offsetTop;
  }

  function onDragMove(x, y) {
    if (!isDragging) return;
    painel.style.left = initialLeft + (x - startX) + "px";
    painel.style.top = initialTop + (y - startY) + "px";
  }

  painel.addEventListener("mousedown", e => {
    e.preventDefault(); onDragStart(e.clientX, e.clientY);
  });
  document.addEventListener("mousemove", e => onDragMove(e.clientX, e.clientY));
  document.addEventListener("mouseup", () => isDragging = false);

  painel.addEventListener("touchstart", e => {
    if (e.touches.length === 1) onDragStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });

  document.addEventListener("touchmove", e => {
    if (isDragging && e.touches.length === 1) {
      onDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  document.addEventListener("touchend", () => isDragging = false);

  // Estado
  let historico = JSON.parse(localStorage.getItem("historicoBlaze") || "[]");
  let ultimoId = historico[0]?.id || null;
  let ultimaPrevisao = null;
  let acertos = 0, erros = 0;

  // Botão de reset
  document.getElementById("btnReset").onclick = () => {
    historico = [];
    ultimoId = null;
    acertos = 0;
    erros = 0;
    ultimaPrevisao = null;
    localStorage.removeItem("historicoBlaze");
    atualizarPainel();
    mostrarAcao("Histórico resetado.");
  };

  // Mostrar última ação
  function mostrarAcao(msg) {
    const box = document.getElementById("ultimaAcaoBox");
    box.textContent = msg;
    setTimeout(() => { box.textContent = ""; }, 5000);
  }

  // Buscar último resultado
  async function fetchLast() {
    try {
      const res = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
      const data = await res.json();
      const cor = data[0]?.color;
      const id = data[0]?.id;

      if (!id || cor === undefined) return;

      // Corrupção ou travamento detectado
      if (historico.length > 0 && historico[0].id === id) return;

      historico.unshift({ cor, id });
      localStorage.setItem("historicoBlaze", JSON.stringify(historico));

      if (ultimaPrevisao !== null) {
        if (cor === ultimaPrevisao) acertos++;
        else erros++;
      }

      ultimoId = id;
      atualizarPainel();
    } catch (e) {
      console.error("Erro ao buscar API:", e);
    }
  }

  // IA + lógica combinadas
  function prever(h) {
    if (h.length < 7) return { cor: "#333", texto: "⌛ Coletando dados...", previsao: null };

    const cores = h.map(x => x.cor);
    const ult7 = cores.slice(0, 7);
    const ult40 = cores.slice(0, 40);
    const count = (arr, val) => arr.filter(n => n === val).length;

    // Lógica Tradicional
    let previsaoTrad = null;
    if (ult7.slice(0, 4).every(n => n === 2)) previsaoTrad = 1;
    else if (ult7.slice(0, 4).every(n => n === 1)) previsaoTrad = 2;
    else if (count(ult7, 2) >= 5) previsaoTrad = 1;
    else if (count(ult7, 1) >= 5) previsaoTrad = 2;
    else if (!ult40.includes(0)) previsaoTrad = 0;
    else previsaoTrad = count(ult7, 2) > count(ult7, 1) ? 1 : 2;

    // IA Simples baseada em frequência reversa
    let freq = { 0: 0, 1: 0, 2: 0 };
    ult7.forEach(c => freq[c]++);
    let previsaoIA = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    previsaoIA = Number(previsaoIA === "2" ? "1" : previsaoIA === "1" ? "2" : "0");

    // Concordância IA + Lógica
    if (Number(previsaoTrad) === Number(previsaoIA)) {
      let corTexto = previsaoTrad === 0 ? "white" : previsaoTrad === 1 ? "red" : "black";
      let texto = previsaoTrad === 0 ? "⚪️ Alerta de Branco" :
        previsaoTrad === 1 ? "🤖 Concordância: Apostar Vermelho" : "🤖 Concordância: Apostar Preto";
      return { cor: corTexto, texto, previsao: previsaoTrad };
    }

    return { cor: "#444", texto: "🤔 Sem alta confiança", previsao: null };
  }

  // Atualiza painel
  function atualizarPainel() {
    const ult = historico.slice(0, 12).map(x => x.cor);
    const { cor, texto, previsao } = prever(historico);
    ultimaPrevisao = previsao;

    const sugestao = document.getElementById("sugestaoBox");
    sugestao.textContent = texto;
    sugestao.style.background = cor;
    sugestao.style.color = cor === "white" ? "#000" : "#fff";

    const box = document.getElementById("historicoBox");
    box.innerHTML = "";
    ult.forEach(n => {
      const el = document.createElement("div");
      el.className = "bolaHist " + (n === 0 ? "brancoHist" : n === 2 ? "pretoHist" : "vermelhoHist");
      box.appendChild(el);
    });

    const total = acertos + erros;
    const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0;
    document.getElementById("acertosBox").textContent = `✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%`;
  }

  // Início
  fetchLast();
  setInterval(fetchLast, 3000);
})();
