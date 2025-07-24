// ==UserScript==
// @name         🔮 Blaze IA com Lógica Segura
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Previsão com lógica segura + proteção no branco
// @author       chatgpt
// @match        https://blaze.com/pt/games/double
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    if (document.getElementById("doubleBlackPainel")) return;

    // Styles
    const style = document.createElement("style");
    style.innerHTML = `
    #doubleBlackPainel {
        position: fixed; top: 30px; left: 30px;
        background: #111; color: #fff; z-index: 9999;
        padding: 15px; border-radius: 15px;
        font-family: Arial; font-size: 14px;
        box-shadow: 0 0 15px #000;
    }
    #doubleBlackPainel h2 {
        margin: 0 0 10px 0;
        font-size: 16px;
    }
    `;
    document.head.appendChild(style);

    // Painel flutuante
    const painel = document.createElement("div");
    painel.id = "doubleBlackPainel";
    painel.innerHTML = `
        <h2>🔮 Blaze IA</h2>
        <div id="historico">Carregando...</div>
        <div id="previsao" style="margin-top:10px;font-size:16px;"></div>
    `;
    document.body.appendChild(painel);

    // Variáveis
    let historico = [];
    let acertos = 0, erros = 0;

    function atualizarPainel() {
        const ultimos = historico.slice(-5).join(' ');
        const total = historico.length;
        const assertividade = total >= (acertos + erros) ? ((acertos / (acertos + erros)) * 100).toFixed(1) : "-";
        document.getElementById("historico").innerHTML = `
            🔴 ⚫ ${ultimos}<br>
            Jogadas coletadas: ${total}<br>
            ✅ ${acertos} | ❌ ${erros} | 🎯 ${assertividade}%
        `;
    }

    function preverCor(historico) {
        if (historico.length < 5) return null;
        const ultimos7 = historico.slice(-7);

        // Contagem simples
        const red = ultimos7.filter(c => c === 'R').length;
        const black = ultimos7.filter(c => c === 'B').length;
        const white = ultimos7.filter(c => c === 'W').length;

        // Repetição exata
        const repete = historico.slice(-3).every(c => c === historico[historico.length - 1]);
        if (repete) return historico[historico.length - 1];

        // Tendência
        if (black >= 5) return 'B';
        if (red >= 5) return 'R';

        return null; // nada claro
    }

    // Traduz cores do DOM
    function interpretarCor(dom) {
        if (dom.includes('white')) return 'W';
        if (dom.includes('red')) return 'R';
        if (dom.includes('black')) return 'B';
        return null;
    }

    // Captura o histórico da Blaze
    function capturarHistorico() {
        const bolas = document.querySelectorAll(".entry__balls span");
        if (!bolas || bolas.length < 1) return;
        const novas = [];
        bolas.forEach(b => {
            const cor = interpretarCor(b.className);
            if (cor) novas.push(cor);
        });
        novas.reverse();

        novas.forEach((cor, i) => {
            if (historico[historico.length - 1] !== cor) {
                historico.push(cor);
                atualizarPainel();

                const previsao = preverCor(historico.slice(0, -1));
                if (previsao) {
                    const entrada = previsao;
                    const real = cor;
                    if (real === entrada || (entrada !== 'W' && real === 'W')) {
                        acertos++;
                    } else {
                        erros++;
                    }
                }
            }
        });

        const proxima = preverCor(historico);
        const divPrev = document.getElementById("previsao");
        if (proxima) {
            const mostrar = proxima === 'B' ? 'Preto' : proxima === 'R' ? 'Vermelho' : 'Branco';
            const protecao = proxima !== 'W' ? ' + ⚪' : '';
            divPrev.innerText = `✅ Apostar: ${mostrar}${protecao}`;
        } else {
            divPrev.innerText = '';
        }
    }

    // Intervalo
    setInterval(capturarHistorico, 2000);
})();
