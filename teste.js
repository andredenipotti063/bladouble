(function () {
  if (document.getElementById("doubleBlackPainel")) return;

  // ESTILO
  const style = document.createElement("style");
  style.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600&display=swap');
    @keyframes neonGlow {
      0% { box-shadow: 0 0 5px #00ff00; }
      50% { box-shadow: 0 0 20px #00ff00; }
      100% { box-shadow: 0 0 5px #00ff00; }
    }
  `;
  document.head.appendChild(style);

  // PAINEL
  const painel = document.createElement("div");
  painel.id = "doubleBlackPainel";
  painel.style = `
    position: fixed;
    top: 100px;
    left: 20px;
    background: black;
    color: white;
    padding: 20px;
    border-radius: 15px;
    font-family: 'Orbitron', sans-serif;
    z-index: 999999;
    width: 300px;
    animation: neonGlow 2s infinite;
    box-shadow: 0 0 20px #00ff00;
    text-align: center;
  `;

  painel.innerHTML = `
    <img src="https://i.imgur.com/NjvNOAf.png" style="width: 80px; height: 80px; margin-bottom: 10px; border-radius: 10px;" />
    <div style="color:#00ff00; font-size: 14px;">@doubleeblack00</div>
    <h2 style="margin: 10px 0; font-size: 20px;">Double Black</h2>
    <div style="margin: 10px 0;">
      <strong style="color: white;">Chance:</strong> <span id="chancePorcentagem" style="color: #00ff00;">--%</span>
    </div>
    <div id="corSugestao" style="font-size: 30px; margin-bottom: 10px;">...</div>
    <div id="ultimos" style="display:flex;justify-content:center;gap:5px;"></div>
  `;
  document.body.appendChild(painel);

  // EMOJIS
  function getEmoji(cor) {
    if (cor === 'red') return '🔴';
    if (cor === 'black') return '⚫️';
    if (cor === 'white') return '⚪️';
    return '❓';
  }

  // NOVA LÓGICA INTELIGENTE
  function preverMelhorado(resultados) {
    const cores = resultados.map(r => r.color);
    const freq = { red: 0, black: 0, white: 0 };
    cores.forEach(cor => { freq[cor] = (freq[cor] || 0) + 1; });

    const ultCor = cores[0] === 'white' ? cores[1] : cores[0];

    const sequencia = [];
    for (let i = 0; i < cores.length - 1; i++) {
      if (cores[i] === cores[i + 1]) {
        sequencia.push(cores[i]);
      } else {
        break;
      }
    }

    // Estratégia:
    if (sequencia.length >= 2) {
      return sequencia[0] === 'red' ? '⚫️' : '🔴';
    }

    if (freq.red > freq.black) return '⚫️';
    if (freq.black > freq.red) return '🔴';

    return ultCor === 'red' ? '⚫️' : '🔴'; // fallback
  }

  // ATUALIZAR PAINEL
  async function atualizar() {
    try {
      const res = await fetch('https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/6');
      const resultados = await res.json();

      if (!Array.isArray(resultados) || resultados.length === 0) return;

      const sugestao = preverMelhorado(resultados);
      document.getElementById("corSugestao").innerText = sugestao;

      const ultimos = document.getElementById("ultimos");
      ultimos.innerHTML = '';
      resultados.reverse().forEach(res => {
        const box = document.createElement("div");
        box.textContent = getEmoji(res.color);
        box.style = `
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 18px;
          background: ${res.color === 'red' ? '#ff0000' : res.color === 'black' ? '#333' : '#fff'};
          color: ${res.color === 'white' ? '#000' : '#fff'};
        `;
        ultimos.appendChild(box);
      });

      // Exibir chance estimada (simples: quanto maior o desequilíbrio, maior a chance)
      const diff = Math.abs(resultados.filter(r => r.color === 'red').length - resultados.filter(r => r.color === 'black').length);
      const chanceEstimativa = 70 + diff * 5; // base 70%, aumenta se houver padrão forte
      document.getElementById("chancePorcentagem").innerText = `${Math.min(chanceEstimativa, 95)}%`;

    } catch (err) {
      console.error('Erro ao atualizar resultados:', err);
    }
  }

  atualizar();
  setInterval(atualizar, 5000);
})();
