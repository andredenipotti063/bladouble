// --- Configuração visual (CSS e painel flutuante) omitida por brevidade ---

// Função que retorna os últimos n resultados (0 = branco, 1‑7 = preto, 8‑14 = vermelho)
function coletarHistorico(max = 10) {
  const tiles = Array.from(document.querySelectorAll("#roulette-recent.entry .roulette-tile"))
                     .slice(0, max).reverse();
  return tiles
    .map(tile => {
      const txt = tile.innerText.trim();
      const num = txt === "" ? parseInt(tile.querySelector(".time-left span")?.textContent) : parseInt(txt);
      return isNaN(num) ? null : num;
    })
    .filter(n => n !== null);
}

// Lógica avançada de previsão
function preverInteligente(ultimos, ultimos50 = []) {
  if (!ultimos || ultimos.length < 10) {
    return { cor: "#444", texto: "🔍 Aguardando mais dados..." };
  }

  const u5 = ultimos.slice(0, 5);
  const u10 = ultimos.slice(0, 10);
  const branco10 = u10.filter(n => n === 0).length;
  const preto10 = u10.filter(n => n >= 1 && n <= 7).length;
  const vermelho10 = u10.filter(n => n >= 8).length;

  // 1. Sequência longa → inversão
  if (u5.every(n => n >= 1 && n <= 7)) return { cor: "vermelho", texto: "🔁 Reversão (sequência de Preto)" };
  if (u5.every(n => n >= 8)) return { cor: "preto", texto: "🔁 Reversão (sequência de Vermelho)" };

  // 2. Alternância zig-zag
  const alt = u5.map(n => n === 0 ? 'b' : (n <= 7 ? 'p' : 'v')).join('');
  if (/^(pv){2,}$|^(vp){2,}$/.test(alt)) {
    const ultima = u5[0];
    return ultima <= 7 ? { cor: "vermelho", texto: "🔄 Alternância detectada – Vermelho" }
                       : { cor: "preto", texto: "🔄 Alternância detectada – Preto" };
  }

  // 3. Predomínio em 10 últimas
  if (preto10 >= 7) return { cor: "vermelho", texto: "📊 Predomínio Preto → Apostar Vermelho" };
  if (vermelho10 >= 7) return { cor: "preto", texto: "📊 Predomínio Vermelho → Apostar Preto" };

  // 4. Oportunidade de branco raro
  const branco50 = ultimos50.filter(n => n === 0).length;
  if (branco50 <= 1 && ultimos[0] !== 0) {
    return { cor: "white", texto: "⚪️ Branco raro possível!" };
  }

  // 5. Sem chance clara
  return { cor: "#444", texto: "🕒 Sem oportunidade confiável" };
}

// Rotina principal — roda a cada 2 segundos
let idAnterior = null;
let corSugestaoAnterior = null;

async function atualizar() {
  // Coleta histórico e dados da UI
  const hist10 = coletarHistorico(10);
  const hist50 = coletarHistorico(50);

  const resp = await fetch("https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1");
  const json = await resp.json();
  const jogo = json[0];
  if (!jogo || jogo.id === idAnterior) return;

  idAnterior = jogo.id;
  const num = jogo.roll;
  document.getElementById("resultNumberCircle").textContent = num;

  // Atualiza visual do resultado
  const resultado = num === 0 ? "⚪ Branco" : (num <= 7 ? "⬛ Preto" : "🟥 Vermelho");
  document.getElementById("legendaResultado").textContent = "Resultado: " + resultado;
  document.getElementById("resultNumberCircle").style.background = (num === 0 ? "#1d2027" : (num <= 7 ? "#000" : "#dc3545"));
  
  // Sugere aposta
  const sugestao = preverInteligente(hist10, hist50);
  const box = document.getElementById("sugestaoBox");
  box.textContent = sugestao.texto;
  box.style.background = sugestao.cor;

  // Animação de vitória/derrota
  if (corSugestaoAnterior && sugestao.cor === corSugestaoAnterior) {
    // ganhou
    mostrarResultadoAnimado("win");
  } else if (corSugestaoAnterior && sugestao.cor !== corSugestaoAnterior && sugestao.cor !== "#444") {
    mostrarResultadoAnimado("lose");
  }
  corSugestaoAnterior = sugestao.cor;
}

// Função de animação
function mostrarResultadoAnimado(tipo) {
  const div = document.createElement("div");
  div.id = "resultadoFinalBox";
  div.textContent = tipo === "win" ? "✅ GANHOU" : "❌ PERDEU";
  div.style.cssText = tipo === "win"
    ? "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;padding:20px;background:#28a745;color:white;border-radius:8px;animation:fall 2.5s linear forwards;"
    : "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:24px;padding:20px;background:#dc3545;color:white;border-radius:8px;animation:fall 2.5s linear forwards;";
  document.body.appendChild(div);
  if (tipo === "win") criarConfetes();
  setTimeout(() => div.remove(), 1000);
}

// Função de confetes
function criarConfetes() {
  const wrapper = document.createElement("div");
  wrapper.id = "confettiWrapper";
  Object.assign(wrapper.style, {
    position: "fixed", top: "0", left: "0", width: "100%", height: "100%",
    pointerEvents: "none", zIndex: 99998
  });
  for (let i = 0; i < 32; i++) {
    let d = document.createElement("div");
    d.textContent = "💸";
    Object.assign(d.style, {
      position: "absolute",
      top: Math.random() * 100 + "%",
      left: Math.random() * 100 + "%",
      fontSize: (12 + Math.random() * 16) + "px",
      animation: "fall 2.5s linear forwards"
    });
    wrapper.appendChild(d);
  }
  document.body.appendChild(wrapper);
  setTimeout(() => wrapper.remove(), 1000);
}

// Inicia intervalo
setInterval(atualizar, 2000);
