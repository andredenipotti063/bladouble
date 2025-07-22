(function () {
  if (document.getElementById("doubleBlackPainel")) return;

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

  function getEmoji(cor) {
    if (cor === 'red') return '🔴';
    if (cor === 'black') return '⚫️';
    if (cor === 'white') return '⚪️';
    return '❓';
  }

  function preverMelhorado(cores) {
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

    if (sequencia.length >= 2) {
      return sequencia[0] === 'red' ? '⚫️' : '🔴';
    }

    if (freq.red > freq.black) return '⚫️';
    if (freq.black > freq.red) return '🔴';

    return ultCor === 'red' ? '⚫️' : '🔴';
  }

  function obterUltimosResultadosDOM() {
    const bolas = Array.from(document.querySelectorAll('.entry .color'))
      .slice(0, 6)
      .map(el => {
        const bg = el.style.backgroundColor;
        if (bg.includes('255, 0, 0')) return 'red';
        if (bg.includes('0, 0, 0') || bg.includes('51, 51, 51')) return 'black';
        if (bg.includes('255, 255, 255')) return 'white';
        return 'unknown';
      });
    return bolas;
  }

  function atualizar() {
    try {
      const ultimos = obterUltimosResultadosDOM();
      if (ultimos.length === 0) return;

      const sugestao = preverMelhorado(ultimos);
      document.getElementById("corSugestao").innerText = sugestao;

      const ultDiv = document.getElementById("ultimos");
      ultDiv.innerHTML = '';
      ultimos.slice().reverse().forEach(cor => {
        const box = document.createElement("div");
        box.textContent = getEmoji(cor);
        box.style = `
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 18px;
          background: ${cor === 'red' ? '#ff0000' : cor === 'black' ? '#333' : '#fff'};
          color: ${cor === 'white' ? '#000' : '#fff'};
        `;
        ultDiv.appendChild(box);
      });

      const diff = Math.abs(ultimos.filter(c => c === 'red').length - ultimos.filter(c => c === 'black').length);
      const chanceEstimativa = 70 + diff * 5;
      document.getElementById("chancePorcentagem").innerText = `${Math.min(chanceEstimativa, 95)}%`;

    } catch (err) {
      console.error('Erro ao ler resultados:', err);
    }
  }

  atualizar();
  setInterval(atualizar, 5000);
})();
