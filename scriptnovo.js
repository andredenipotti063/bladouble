(function() {
    // --- Configurações ---
    const API_URL = 'https://blaze.bet.br/api/singleplayer-originals/originals/roulette_games/recent/1';
    const FETCH_INTERVAL_MS = 2000; // Intervalo para buscar novos resultados (2 segundos)
    const MAX_HISTORY_SIZE = 50; // Quantidade de resultados para manter no histórico para análise
    const MIN_HISTORY_FOR_PREDICTION = 10; // Mínimo de resultados no histórico para começar a prever
    const MIN_CONFIDENCE_FOR_ENTRY = 75; // % Mínima de "confiança" para sugerir uma entrada (ajuste aqui!)

    // --- Variáveis de Estado ---
    let lastGameId = null;
    let predictionActive = true;
    const history = []; // Armazena os últimos resultados: [{ color: 'red', timestamp: Date.now() }]
    let fetchStartTime = 0; // Para controlar o progresso da barra

    // --- Elementos da Interface ---
    let containerDiv;
    let headerDiv;
    let bodyDiv;
    let statusSpan;
    let predictionSpan;
    let confidenceSpan;
    let historyCountSpan; // Renomeado para refletir o tamanho do histórico
    let barDiv;
    let historyDisplayDiv;

    // --- Funções Auxiliares ---

    // Cria e injeta o CSS para a interface
    function injectCSS() {
        const style = document.createElement('style');
        style.id = 'advanced-predictor-style';
        style.innerHTML = `
            #advanced-predictor-container {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 350px;
                background: linear-gradient(145deg, #1c1c1c, #0f0f0f);
                border: 1px solid #444;
                border-radius: 12px;
                box-shadow: 0 0 25px rgba(0, 255, 255, 0.4), 0 0 8px rgba(0, 255, 255, 0.2);
                font-family: 'Roboto Mono', monospace; /* Fonte mais tech */
                color: #e0e0e0;
                z-index: 99999;
                overflow: hidden;
                transition: all 0.3s ease-in-out;
            }
            #advanced-predictor-container.minimized {
                height: 40px;
                width: 180px;
                overflow: hidden;
            }
            #advanced-predictor-header {
                background: linear-gradient(90deg, #00aaff, #00eaff);
                padding: 10px 18px;
                cursor: grab;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #007bbd;
                font-weight: bold;
                font-size: 1.2em;
                color: #ffffff;
                text-shadow: 0 0 6px rgba(255,255,255,0.6);
            }
            #advanced-predictor-header button {
                background: none;
                border: none;
                color: #ffffff;
                font-size: 1.3em;
                cursor: pointer;
                padding: 0 6px;
                transition: transform 0.2s ease;
            }
            #advanced-predictor-header button:hover {
                transform: scale(1.1);
            }
            #advanced-predictor-body {
                padding: 18px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            #advanced-predictor-body p {
                margin: 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            #advanced-predictor-body strong {
                color: #00eaff;
            }
            #advanced-predictor-body .value {
                font-weight: bold;
                color: #e0e0e0;
            }
            .color-black { color: #000; background-color: #000; padding: 2px 6px; border-radius: 4px; }
            .color-red { color: #ff3333; background-color: #ff3333; padding: 2px 6px; border-radius: 4px; }
            .color-white { color: #fff; background-color: #fff; padding: 2px 6px; border-radius: 4px; }
            .color-unknown { color: #888; background-color: #888; padding: 2px 6px; border-radius: 4px; }

            #prediction-bar-container {
                width: 100%;
                background-color: #2a2a2a;
                border-radius: 6px;
                overflow: hidden;
                margin-top: 15px;
            }
            #prediction-bar {
                height: 10px;
                width: 0%;
                background: linear-gradient(90deg, #00eaff, #00aaff);
                border-radius: 6px;
                transition: width 0.1s linear;
            }
            #history-display {
                margin-top: 15px;
                border-top: 1px solid #333;
                padding-top: 10px;
                font-size: 0.85em;
                max-height: 80px;
                overflow-y: auto;
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                justify-content: flex-end; /* Alinha os itens à direita */
            }
            #history-display .history-item {
                width: 18px; /* Tamanho fixo para os quadrados */
                height: 18px;
                border-radius: 3px;
                display: inline-block;
                box-shadow: inset 0 0 3px rgba(0,0,0,0.5);
            }
            .history-item.color-black { background-color: #111; border: 1px solid #333; }
            .history-item.color-red { background-color: #cc0000; border: 1px solid #ff3333; }
            .history-item.color-white { background-color: #eee; border: 1px solid #fff; }
            .entry-suggestion {
                background-color: #28a745; /* Verde para sugestão de entrada */
                color: white;
                padding: 8px;
                border-radius: 5px;
                text-align: center;
                font-weight: bold;
                margin-top: 10px;
                animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
                100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
            }
        `;
        document.head.appendChild(style);
    }

    // Cria a interface HTML
    function createUI() {
        // Remove qualquer instância anterior
        const existingContainer = document.getElementById('advanced-predictor-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        const existingStyle = document.getElementById('advanced-predictor-style');
        if (existingStyle) {
            existingStyle.remove();
        }

        injectCSS();

        containerDiv = document.createElement('div');
        containerDiv.id = 'advanced-predictor-container';
        document.body.appendChild(containerDiv);

        headerDiv = document.createElement('div');
        headerDiv.id = 'advanced-predictor-header';
        headerDiv.innerHTML = `
            <span>Blaze AI Predictor</span>
            <button id="minimize-btn">-</button>
        `;
        containerDiv.appendChild(headerDiv);

        bodyDiv = document.createElement('div');
        bodyDiv.id = 'advanced-predictor-body';
        bodyDiv.innerHTML = `
            <p><strong>Status:</strong> <span id="status-text">Inicializando...</span></p>
            <p><strong>Previsão:</strong> <span id="prediction-text" class="value">Aguardando...</span></p>
            <p><strong>Confiança:</strong> <span id="confidence-text" class="value">0%</span></p>
            <p><strong>Histórico:</strong> <span id="history-count" class="value">0/${MAX_HISTORY_SIZE}</span></p>
            <div id="prediction-bar-container"><div id="prediction-bar"></div></div>
            <div id="history-display"></div>
        `;
        containerDiv.appendChild(bodyDiv);

        // Referências aos elementos internos
        statusSpan = document.getElementById('status-text');
        predictionSpan = document.getElementById('prediction-text');
        confidenceSpan = document.getElementById('confidence-text');
        historyCountSpan = document.getElementById('history-count'); // Atualizado
        barDiv = document.getElementById('prediction-bar');
        historyDisplayDiv = document.getElementById('history-display');

        // Funcionalidade de arrastar
        let isDragging = false;
        let offsetX, offsetY;

        headerDiv.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - containerDiv.getBoundingClientRect().left;
            offsetY = e.clientY - containerDiv.getBoundingClientRect().top;
            headerDiv.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            containerDiv.style.left = (e.clientX - offsetX) + 'px';
            containerDiv.style.top = (e.clientY - offsetY) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            headerDiv.style.cursor = 'grab';
        });

        // Funcionalidade de minimizar/maximizar
        const minimizeBtn = document.getElementById('minimize-btn');
        minimizeBtn.addEventListener('click', () => {
            containerDiv.classList.toggle('minimized');
            if (containerDiv.classList.contains('minimized')) {
                minimizeBtn.textContent = '+';
            } else {
                minimizeBtn.textContent = '-';
            }
        });
    }

    // Atualiza a barra de progresso
    function updateProgressBar(progress) {
        barDiv.style.width = `${progress}%`;
    }

    // Atualiza a exibição do histórico na UI
    function updateHistoryDisplay() {
        historyDisplayDiv.innerHTML = '';
        // Exibe os últimos 20 resultados do histórico
        const displayLimit = 20;
        const itemsToDisplay = history.slice(0, displayLimit); // Pega os mais recentes (que estão no início)

        itemsToDisplay.forEach(item => {
            const colorClass = `color-${item.color}`;
            const historyItem = document.createElement('span');
            historyItem.className = `history-item ${colorClass}`;
            historyDisplayDiv.appendChild(historyItem);
        });
        // historyDisplayDiv.scrollTop = historyDisplayDiv.scrollHeight; // Rola para o final (não necessário com unshift)
        historyCountSpan.textContent = `${history.length}/${MAX_HISTORY_SIZE}`;
    }

    /**
     * Lógica de "IA" para prever a próxima cor e calcular a confiança.
     * Esta é uma versão simplificada de "IA" baseada em regras e análise de padrões.
     * Retorna { predictedColor: 'red'|'black'|'none', confidence: number }
     */
    function analyzePatternsAndPredict() {
        if (history.length < MIN_HISTORY_FOR_PREDICTION) {
            return { predictedColor: 'none', confidence: 0 };
        }

        // Usamos o histórico diretamente, pois ele já está ordenado do mais recente para o mais antigo
        const lastColors = history.map(item => item.color);
        let redScore = 0;
        let blackScore = 0;
        let totalPatternsFound = 0;

        // --- Padrão 1: Repetição Simples (Ex: R, R -> prever B) ---
        // Se as últimas N cores foram iguais, prever a oposta.
        const repeatLength = 3; // Ex: 3 vermelhos seguidos
        if (lastColors.length >= repeatLength) {
            const slice = lastColors.slice(0, repeatLength);
            const allSame = slice.every(color => color === slice[0] && color !== 'white');
            if (allSame) {
                totalPatternsFound++;
                if (slice[0] === 'red') blackScore += 40; // Forte indicação para preto
                if (slice[0] === 'black') redScore += 40; // Forte indicação para vermelho
            }
        }

        // --- Padrão 2: Alternância (Ex: R, B, R, B -> prever R) ---
        // Se as últimas N cores alternaram, prever a próxima na sequência.
        const alternateLength = 4; // Ex: R, B, R, B
        if (lastColors.length >= alternateLength) {
            const slice = lastColors.slice(0, alternateLength);
            const isAlternating = slice.every((color, i) => {
                if (color === 'white') return false; // Ignora branco
                if (i === 0) return true;
                return color !== slice[i-1];
            });
            if (isAlternating && slice[0] !== 'white') {
                totalPatternsFound++;
                // Se o último foi B, o próximo na alternância seria R. Se foi R, o próximo seria B.
                // A previsão é a cor que *viria* depois do último elemento da sequência alternada
                if (slice[0] === 'red') redScore += 30; // Ex: R,B,R,B -> prevê R
                if (slice[0] === 'black') blackScore += 30; // Ex: B,R,B,R -> prevê B
            }
        }

        // --- Padrão 3: Maioria Recente (Ex: Últimas 5, 4 foram Vermelho -> prever Preto) ---
        // Se uma cor dominou recentemente, prever a oposta.
        const recentWindow = 7;
        if (lastColors.length >= recentWindow) {
            const recentSlice = lastColors.slice(0, recentWindow).filter(c => c !== 'white');
            const redCount = recentSlice.filter(c => c === 'red').length;
            const blackCount = recentSlice.filter(c => c === 'black').length;

            if (recentSlice.length > 0) {
                totalPatternsFound++;
                if (redCount > blackCount + 2) { // Se vermelho saiu significativamente mais
                    blackScore += 20;
                } else if (blackCount > redCount + 2) { // Se preto saiu significativamente mais
                    redScore += 20;
                }
            }
        }

        // --- Padrão 4: Sequências Longas (Ex: R, R, R, R, R -> prever B com alta confiança) ---
        const longRepeatLength = 5;
        if (lastColors.length >= longRepeatLength) {
            const slice = lastColors.slice(0, longRepeatLength);
            const allSame = slice.every(color => color === slice[0] && color !== 'white');
            if (allSame) {
                totalPatternsFound++;
                if (slice[0] === 'red') blackScore += 60; // Muito forte
                if (slice[0] === 'black') redScore += 60; // Muito forte
            }
        }


        let predictedColor = 'none';
        let confidence = 0;

        if (redScore > blackScore && redScore > 0) {
            predictedColor = 'red';
            confidence = Math.min(100, redScore + (totalPatternsFound * 5)); // Aumenta confiança com mais padrões
        } else if (blackScore > redScore && blackScore > 0) {
            predictedColor = 'black';
            confidence = Math.min(100, blackScore + (totalPatternsFound * 5));
        } else if (redScore === blackScore && redScore > 0) {
            // Se os scores forem iguais, talvez não haja um padrão claro
            predictedColor = 'none';
            confidence = 0; // Ou uma confiança menor
        }

        // Ajuste final da confiança: quanto mais padrões, mais confiante
        if (totalPatternsFound > 0) {
            confidence = Math.min(100, confidence + (totalPatternsFound * 5));
        }

        // Garante que a confiança não ultrapasse 100
        confidence = Math.min(100, confidence);

        return { predictedColor, confidence: Math.round(confidence) };
    }

    // --- Função Principal de Busca e Análise ---
    async function fetchAndPredict() {
        if (!predictionActive) {
            statusSpan.textContent = 'Finalizado.';
            predictionSpan.textContent = '---';
            confidenceSpan.textContent = '0%';
            updateProgressBar(0);
            return;
        }

        fetchStartTime = Date.now(); // Marca o início da busca
        statusSpan.textContent = 'Buscando resultado...';
        updateProgressBar(0); // Reseta a barra ao iniciar a busca

        try {
            const response = await fetch(API_URL);
            if (!response.ok) { // Verifica se a resposta HTTP foi bem-sucedida
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data && data.length > 0) {
                const latestGame = data[0];
                const gameId = latestGame.id;
                const gameColor = latestGame.color; // 'red', 'black', 'white'

                if (gameId !== lastGameId) {
                    // Novo resultado disponível
                    lastGameId = gameId;

                    // Adiciona ao histórico (ignorando branco para análise de padrões de cor)
                    if (gameColor !== 'white') {
                        history.unshift({ color: gameColor, timestamp: Date.now() }); // Adiciona no início
                        if (history.length > MAX_HISTORY_SIZE) {
                            history.pop(); // Remove o mais antigo se exceder o limite
                        }
                    }
                    updateHistoryDisplay(); // Atualiza a exibição do histórico e o contador

                    statusSpan.textContent = `Última: ${gameColor.toUpperCase()}`;

                    if (history.length >= MIN_HISTORY_FOR_PREDICTION) {
                        const { predictedColor, confidence } = analyzePatternsAndPredict();

                        confidenceSpan.textContent = `${confidence}%`;

                        // Remove a sugestão anterior se houver
                        const oldSuggestion = document.querySelector('.entry-suggestion');
                        if (oldSuggestion) oldSuggestion.remove();

                        if (predictedColor !== 'none' && confidence >= MIN_CONFIDENCE_FOR_ENTRY) {
                            predictionSpan.innerHTML = `
                                <span class="color-${predictedColor}">${predictedColor.toUpperCase()}</span>
                            `;
                            predictionSpan.className = `value color-${predictedColor}`;
                            // Adiciona a sugestão de entrada como um novo elemento
                            const suggestionDiv = document.createElement('div');
                            suggestionDiv.className = 'entry-suggestion';
                            suggestionDiv.innerHTML = `ENTRAR NO ${predictedColor.toUpperCase()}!`;
                            bodyDiv.appendChild(suggestionDiv); // Adiciona ao corpo principal
                            console.log(`[Blaze AI Predictor] ALTA CONFIANÇA! Entrar no ${predictedColor.toUpperCase()} (${confidence}%)`);
                        } else {
                            predictionSpan.innerHTML = `
                                <span class="color-unknown">Aguardando padrão...</span>
                            `;
                            predictionSpan.className = `value color-unknown`;
                            console.log(`[Blaze AI Predictor] Aguardando padrão ou confiança (${confidence}%) insuficiente.`);
                        }
                    } else {
                        predictionSpan.innerHTML = `
                            <span class="color-unknown">Coletando histórico...</span>
                        `;
                        predictionSpan.className = `value color-unknown`;
                        confidenceSpan.textContent = '0%';
                        console.log(`[Blaze AI Predictor] Coletando histórico (${history.length}/${MIN_HISTORY_FOR_PREDICTION})...`);
                    }

                } else {
                    // Mesmo resultado, aguardando o próximo
                    statusSpan.textContent = 'Aguardando novo resultado...';
                    // Atualiza a barra de progresso para simular espera
                    const elapsedTime = Date.now() - fetchStartTime;
                    const progress = Math.min(100, (elapsedTime / FETCH_INTERVAL_MS) * 100);
                    updateProgressBar(progress);
                }
            } else {
                statusSpan.textContent = 'Erro: Nenhum dado válido da API.';
                predictionSpan.textContent = '---';
                confidenceSpan.textContent = '0%';
                console.error('[Blaze AI Predictor] Erro: Nenhum dado válido da API.');
            }
        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
            statusSpan.textContent = 'Erro na conexão.';
            predictionSpan.textContent = '---';
            confidenceSpan.textContent = '0%';
            updateProgressBar(0); // Reseta a barra em caso de erro
        }
    }

    // --- Inicialização ---
    function init() {
        createUI();
        // Inicia a busca e previsão em um intervalo
        setInterval(fetchAndPredict, FETCH_INTERVAL_MS);
        fetchAndPredict(); // Executa uma vez imediatamente para iniciar
    }

    // Garante que o script só rode depois que a página estiver carregada
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
