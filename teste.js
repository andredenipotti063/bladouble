// ==UserScript== // @name         Blaze Bot - Padrões Integrados // @namespace    http://tampermonkey.net/ // @version      2.0 // @description  Script com análise de padrões integrados para roleta da Blaze // @author       Você // @match        ://blaze.bet/ // @grant        none // ==/UserScript==

(async function () { const API_BASE_URL = "https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games";

if (document.getElementById("doubleBlackPainel")) return;

const style = document.createElement("style"); style.innerHTML = #doubleBlackPainel { position: fixed; top: 30px; left: 30px; background: #111; color: #fff; padding: 15px; border-radius: 10px; z-index: 9999; font-family: Arial, sans-serif; width: 280px; box-shadow: 0 0 10px rgba(0,0,0,0.4); cursor: move; } #doubleBlackPainel h1 { margin: 0 0 10px; font-size: 16px; text-align: center; } #sugestaoBox { padding: 10px; text-align: center; font-weight: bold; border-radius: 8px; background-color: #222; margin-bottom: 10px; font-size: 14px; } #historicoBox { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; margin-bottom: 10px; } .bolaHist { width: 20px; height: 20px; border-radius: 50%; } .pretoHist { background: black; } .vermelhoHist { background: red; } .brancoHist { background: white; border: 1px solid #999; } #acertosBox { text-align: center; font-size: 14px; margin-top: 5px; }; document.head.appendChild(style);

const painel = document.createElement("div"); painel.id = "doubleBlackPainel"; painel.innerHTML = <h1>🔮 Previsão Aprimorada</h1> <div id="sugestaoBox">⏳ Carregando Histórico...</div> <div id="historicoBox"></div> <div id="acertosBox">✅ 0 | ❌ 0 | 🎯 0%</div>; document.body.appendChild(painel);

// Drag logic let isDragging = false, startX, startY, initialLeft, initialTop; const onDragStart = (x, y) => { isDragging = true; startX = x; startY = y; initialLeft = painel.offsetLeft; initialTop = painel.offsetTop; }; const onDragMove = (x, y) => { if (!isDragging) return; const dx = x - startX, dy = y - startY; painel.style.left = ${initialLeft + dx}px; painel.style.top = ${initialTop + dy}px; }; const onDragEnd = () => { isDragging = false; }; painel.addEventListener("mousedown", (e) => { e.preventDefault(); onDragStart(e.clientX, e.clientY); }); document.addEventListener("mousemove", (e) => onDragMove(e.clientX, e.clientY)); document.addEventListener("mouseup", onDragEnd); painel.addEventListener("touchstart", (e) => { if (e.touches.length === 1) { const t = e.touches[0]; onDragStart(t.clientX, t.clientY); e.preventDefault(); } }); document.addEventListener("touchmove", (e) => { if (isDragging && e.touches.length === 1) { onDragMove(e.touches[0].clientX, e.touches[0].clientY); } }); document.addEventListener("touchend", onDragEnd);

const historico = []; let ultimoId = null; let ultimaPrevisao = null; let acertos = 0, erros = 0;

function prever(h) { if (h.length < 10) return { cor: "#333", texto: "⌛ Coletando dados...", previsao: null };

const count = (arr, val) => arr.filter(n => n === val).length;

// 🔁 Padrão Duplo na 5ª casa
const ult5 = h.slice(0, 5);
if (ult5.length === 5 && ult5[0] !== 0 && ult5[1] === ult5[3] && ult5[0] !== ult5[1] && ult5[4] === ult5[3]) {
  return { cor: ult5[4] === 1 ? "red" : "black", texto: "🎯 Padrão Duplo na 5ª Casa", previsao: ult5[4] };
}

// ♟️ Padrão Xadrez
const ult6 = h.slice(0, 6);
if (ult6.length >= 6 && ult6.every((c, i, a) => i === 0 || c !== 0 && c !== a[i - 1])) {
  return { cor: ult6[0] === 1 ? "black" : "red", texto: "♟️ Padrão Xadrez Detectado", previsao: ult6[0] === 1 ? 2 : 1 };
}

// ⚫⚫⚫ Padrão Pós-Branco
if (h[0] !== 0 && h[1] !== 0 && h[2] === 0) {
  return { cor: h[1] === 1 ? "black" : "red", texto: "🔁 Pós-Branco: Cor Oposta à Primeira", previsao: h[1] === 1 ? 2 : 1 };
}

// 🧱 Padrão Triplo
if (h[1] === h[2] && h[3] === h[4] && h[5] === h[6] && h[7] === h[8] && h[9] === h[10]) {
  return { cor: h[0] === 1 ? "red" : "black", texto: "🧱 Padrão Triplo na 5ª Casa", previsao: h[0] };
}

// 🧱 Padrão Quadruplo
if (h[1] === h[2] && h[2] === h[3] && h[4] === h[5] && h[5] === h[6] && h[7] === h[8] && h[8] === h[9]) {
  return { cor: h[0] === 1 ? "red" : "black", texto: "🧱 Padrão Quadruplo na 5ª Casa", previsao: h[0] };
}

// ➕ Padrão Branco 6/7 Casa
const idxBranco = h.findIndex(c => c === 0);
if (idxBranco >= 0 && (h[idxBranco - 6] === 0 || h[idxBranco - 7] === 0)) {
  return { cor: "white", texto: "⚪ Padrão Branco 6/7 Casa", previsao: 0 };
}

// ✴️ Genérico: sem branco nos últimos 35
if (!h.slice(0, 35).includes(0) && ultimaPrevisao !== 0) {
  return { cor: "white", texto: "🎯 ALVO: APOSTAR BRANCO", previsao: 0 };
}

// 🔁 Tendência
const ult10Cores = h.filter(c => c !== 0).slice(0, 10);
const pretos10 = count(ult10Cores, 2);
const vermelhos10 = count(ult10Cores, 1);
if (pretos10 >= 7) return { cor: "black", texto: "📈 Tendência: Manter no Preto", previsao: 2 };
if (vermelhos10 >= 7) return { cor: "red", texto: "📈 Tendência: Manter no Vermelho", previsao: 1 };

// Padrão geral
const ultimaCorValida = h.find(c => c === 1 || c === 2);
return ultimaCorValida === 2
  ? { cor: "red", texto: "🤖 Padrão: Apostar Vermelho", previsao: 1 }
  : { cor: "black", texto: "🤖 Padrão: Apostar Preto", previsao: 2 };

}

function atualizarPainel() { const { cor, texto, previsao } = prever(historico); ultimaPrevisao = previsao; const sugestao = document.getElementById("sugestaoBox"); sugestao.textContent = texto; sugestao.style.background = cor; sugestao.style.color = cor === "white" ? "#000" : "#fff"; const box = document.getElementById("historicoBox"); box.innerHTML = historico.slice(0, 15).map(n => <div class="bolaHist ${n === 0 ? "brancoHist" : n === 2 ? "pretoHist" : "vermelhoHist"}"></div>).join(''); const total = acertos + erros; const taxa = total > 0 ? ((acertos / total) * 100).toFixed(1) : 0; document.getElementById("acertosBox").textContent = ✅ ${acertos} | ❌ ${erros} | 🎯 ${taxa}%; }

function processarNovoResultado(novoResultado) { if (!novoResultado || !novoResultado.id || novoResultado.id === ultimoId) return false; historico.unshift(novoResultado.color); if (historico.length > 50) historico.pop(); if (ultimaPrevisao !== null) { const acertou = (novoResultado.color === ultimaPrevisao) || (novoResultado.color === 0 && (ultimaPrevisao === 1 || ultimaPrevisao === 2)); if (acertou) acertos++; else erros++; } ultimoId = novoResultado.id; return true; }

async function carregarHistoricoInicial() { try { const res = await fetch(${API_BASE_URL}/recent); const data = await res.json(); if (data && data.length > 0) { historico.length = 0; data.reverse().forEach(item => historico.unshift(item.color)); ultimoId = data[data.length - 1].id; atualizarPainel(); } } catch (e) { document.getElementById("sugestaoBox").textContent = "❌ Erro ao carregar."; } }

async function verificarUltimo() { try { const res = await fetch(${API_BASE_URL}/recent/1); const data = await res.json(); if (processarNovoResultado(data[0])) { atualizarPainel(); } } catch (e) { console.error("Erro ao verificar último:", e); } }

await carregarHistoricoInicial(); setInterval(verificarUltimo, 3500);

})();

