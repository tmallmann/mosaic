const TAMANHO = 10;

let solucao = [];
let numeros = [];
let estado = [];
let status = [];
let inicioTempo = 0;
let jogoFinalizado = false;

// =========================
// CONTROLE DO ARRASTO
// =========================
let arrastando = false;

// 0 = botão esquerdo
// 2 = botão direito
let botaoArrasto = null;

// Estado que será aplicado durante o arrasto
//  1 = preto
// -1 = branco
//  0 = neutro
let estadoArrasto = 0;
let celulasArrastadas = new Set();

const tabuleiro = document.getElementById("tabuleiro");
const dificuldadeSelect = document.getElementById("dificuldade");
const novoJogoBtn = document.getElementById("novoJogo");
const timerLabel = document.getElementById("timer");
const resultadoLabel = document.getElementById("resultado");

// =========================
// CONFIG POR DIFICULDADE
// =========================
function configDificuldade(nivel) {

    if (nivel === "Fácil") {
        return {
            probPreto: 0.25,
            probVazio: 0.10
        };
    }

    if (nivel === "Médio") {
        return {
            probPreto: 0.35,
            probVazio: 0.15
        };
    }

    return {
        probPreto: 0.45,
        probVazio: 0.20
    };
}

// =========================
// CRIAR MATRIZ
// =========================
function criarMatriz(valor = 0) {
    return Array.from({ length: TAMANHO }, () => Array(TAMANHO).fill(valor));
}

// =========================
// GERAR JOGO
// =========================
function novoJogo() {
    const nivel = dificuldadeSelect.value;
    const {probPreto, probVazio} = configDificuldade(nivel);
    jogoFinalizado = false;

    // Cancela qualquer arrasto anterior
    arrastando = false;
    botaoArrasto = null;
    celulasArrastadas.clear();

    // =========================
    // GERAR SOLUÇÃO
    // =========================
    solucao = Array.from({ length: TAMANHO }, () =>
            Array.from({ length: TAMANHO }, () => Math.random() < probPreto ? 1 : 0)
    );

    // =========================
    // DEFINIR NÚMEROS OCULTOS
    // =========================
    const vazio = Array.from({ length: TAMANHO }, () =>
            Array.from({ length: TAMANHO }, () => Math.random() < probVazio)
    );

    // =========================
    // CONTAR SOLUÇÃO
    // =========================
    function contar(x, y) {
        let total = 0;

        for (let i = x - 1; i <= x + 1; i++) {
            for (let j = y - 1; j <= y + 1; j++) {
                if (i >= 0 && i < TAMANHO && j >= 0 && j < TAMANHO) {
                    total += solucao[i][j];
                }
            }
        }
        return total;
    }

    // =========================
    // GERAR NÚMEROS
    // =========================
    numeros = Array.from({ length: TAMANHO }, (_, i) =>
            Array.from({ length: TAMANHO }, (_, j) => vazio[i][j] ? "" : contar(i, j))
    );

    // =========================
    // ESTADO INICIAL
    // =========================
    estado = criarMatriz(0);
    status = criarMatriz(0);

    criarTabuleiro();
    resultadoLabel.textContent = "";
    inicioTempo = Date.now();
    atualizarTimer();
}

// =========================
// CRIAR TABULEIRO
// =========================
function criarTabuleiro() {
    tabuleiro.innerHTML = "";

    for (let i = 0; i < TAMANHO; i++) {
        for (let j = 0; j < TAMANHO; j++) {
            const botao = document.createElement("button");
            botao.className = "celula";
            botao.dataset.linha = i;
            botao.dataset.coluna = j;
            botao.textContent = numeros[i][j];

            // =========================
            // BOTÃO ESQUERDO
            // =========================
            botao.addEventListener("mousedown", function (event) {
                if (event.button !== 0) {
                    return;
                }
                event.preventDefault();
                iniciarArrasto(i, j, 0);
            });

            // =========================
            // BOTÃO DIREITO
            // =========================
            botao.addEventListener("mousedown", function (event) {
                if (event.button !== 2) {
                    return;
                }
                event.preventDefault();
                iniciarArrasto(i, j, 2);
            });

            // =========================
            // MOUSE ENTRANDO NA CÉLULA
            // =========================
            botao.addEventListener("mouseenter", function () {
                if (!arrastando) {
                    return;
                }
                pintarDuranteArrasto(i, j);
            });

            // =========================
            // MOUSE SAINDO
            // =========================
            botao.addEventListener("mouseleave", function () {});

            // =========================
            // BLOQUEAR MENU DIREITO
            // =========================
            botao.addEventListener("contextmenu", function (event) {
                event.preventDefault();
            });

            // =========================
            // BLOQUEAR DRAG NATIVO
            // =========================
            botao.addEventListener("dragstart", function (event) {
                event.preventDefault();
            });

            tabuleiro.appendChild(botao);
        }
    }
    atualizarTodosBotoes();
}

// =========================
// PEGAR BOTÃO
// =========================
function getBotao(x, y) {
    return document.querySelector(`.celula[data-linha="${x}"][data-coluna="${y}"]`);
}

// =========================
// INICIAR ARRASTO
// =========================
function iniciarArrasto(i, j, botaoMouse) {
    if (jogoFinalizado) {
        return;
    }

    arrastando = true;
    botaoArrasto = botaoMouse;
    celulasArrastadas.clear();

    // =========================
    // BOTÃO ESQUERDO
    // =========================
    if (botaoMouse === 0) {
        /*
         * Neutro -> Preto
         * Preto -> Neutro
         * Branco -> Preto
         */

        if (estado[i][j] === 1) {
            estadoArrasto = 0;
        }
        else {
            estadoArrasto = 1;
        }
    }

    // =========================
    // BOTÃO DIREITO
    // =========================
    else if (botaoMouse === 2) {
        /*
         * Neutro -> Branco
         * Branco -> Neutro
         * Preto -> Branco
         */

        if (estado[i][j] === -1) {
            estadoArrasto = 0;
        }
        else {
            estadoArrasto = -1;
        }
    }
    pintarDuranteArrasto(i, j);
}

// =========================
// PINTAR DURANTE ARRASTO
// =========================
function pintarDuranteArrasto(i, j) {
    if (!arrastando || jogoFinalizado) {
        return;
    }
    const chave = `${i}-${j}`;

    // Evita que uma célula seja alterada novamente durante o mesmo arrasto
    if (celulasArrastadas.has(chave)) {
        return;
    }
    celulasArrastadas.add(chave);

    // Aplica o estado escolhido pelo arrasto
    estado[i][j] = estadoArrasto;
    atualizarBotao(i, j);
    verificar();
}

// =========================
// FINALIZAR ARRASTO
// =========================
function finalizarArrasto() {
    if (!arrastando) {
        return;
    }
    arrastando = false;
    botaoArrasto = null;
    celulasArrastadas.clear();
}

// =========================
// MOUSEUP GLOBAL
// =========================
document.addEventListener("mouseup", finalizarArrasto);

// =========================
// MOUSE SAINDO DA JANELA
// =========================
document.addEventListener("mouseleave", finalizarArrasto);

// =========================
// CANCELAR ARRASTO
// =========================
window.addEventListener("blur", finalizarArrasto);

// =========================
// EVITAR SELEÇÃO
// =========================
tabuleiro.addEventListener("dragstart", function (event) {
        event.preventDefault();
    }
);

// =========================
// TIMER
// =========================
function atualizarTimer() {
    if (jogoFinalizado) {
        return;
    }
    const tempo = Math.floor((Date.now() - inicioTempo) / 1000);
    const minutos = Math.floor(tempo / 60);
    const segundos = tempo % 60;

    timerLabel.textContent = `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
    setTimeout(atualizarTimer, 1000);
}

// =========================
// CONTAGEM DO ESTADO
// =========================
function contarEstado(x, y) {
    let total = 0;

    for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
            if (i >= 0 && i < TAMANHO && j >= 0 && j < TAMANHO && estado[i][j] === 1) {
                total++;
            }
        }
    }
    return total;
}

// =========================
// CONTAR NEUTRAS
// =========================
function contarNeutras(x, y) {
    let total = 0;

    for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
            if (i >= 0 && i < TAMANHO && j >= 0 && j < TAMANHO && estado[i][j] === 0) {
                total++;
            }
        }
    }
    return total;
}

// =========================
// REGIÃO COMPLETA
// =========================
function regiaoCompleta(x, y) {
    for (let i = x - 1; i <= x + 1; i++) {
        for (let j = y - 1; j <= y + 1; j++) {
            if (i >= 0 && i < TAMANHO && j >= 0 && j < TAMANHO
            ) {

                if (estado[i][j] === 0) {
                    return false;
                }
            }
        }
    }
    return true;
}

// =========================
// ATUALIZAR VISUAL
// =========================
function atualizarBotao(x, y) {
    const botao = getBotao(x, y);
    if (!botao) {
        return;
    }

    const val = estado[x][y];
    const st = status[x][y];
    botao.classList.remove("preta", "branca", "erro"
    );

    // =========================
    // ESTADO
    // =========================
    if (val === 1) {
        botao.classList.add("preta");
    }
    else if (val === -1) {
        botao.classList.add("branca");
    }

    // =========================
    // ERRO
    // =========================
    if (st === 1 || st === 2) {
        botao.classList.add("erro");
    }
}

// =========================
// ATUALIZAR TODOS
// =========================
function atualizarTodosBotoes() {
    for (let i = 0; i < TAMANHO; i++) {
        for (let j = 0; j < TAMANHO; j++) {
            atualizarBotao(i, j);
        }
    }
}

// =========================
// VERIFICAÇÃO
// =========================
function verificar() {
    for (let i = 0; i < TAMANHO; i++) {
        for (let j = 0; j < TAMANHO; j++) {

            // Número oculto
            if (numeros[i][j] === "") {
                status[i][j] = 0;
                atualizarBotao(i, j);
                continue;
            }

            const atual = contarEstado(i, j);
            const esperado = numeros[i][j];
            const neutras = contarNeutras(i, j);

            // Mais pretas que o número
            if (atual > esperado) {
                status[i][j] = 1;
            }

            // Mesmo que todas as neutras fossem pretas, não chegaria ao número
            else if (atual + neutras < esperado) {
                status[i][j] = 2;
            }

            // Tudo normal
            else {
                status[i][j] = 0;
            }
            atualizarBotao(i, j);
        }
    }

    // =========================
    // VITÓRIA
    // =========================
    if (verificarVitoria()) {
        const tempo = Math.floor((Date.now() - inicioTempo) / 1000);
        const minutos = Math.floor(tempo / 60);
        const segundos = tempo % 60;

        resultadoLabel.textContent = `Vitória! Tempo: ${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
        jogoFinalizado = true;

        // Garante que o arrasto seja encerrado
        arrastando = false;
        botaoArrasto = null;
        celulasArrastadas.clear();
    }
}

// =========================
// VERIFICAR VITÓRIA
// =========================
function verificarVitoria() {
    for (let i = 0; i < TAMANHO; i++) {
        for (let j = 0; j < TAMANHO; j++) {

            // Solução exige preto
            if (solucao[i][j] === 1 && estado[i][j] !== 1) {
                return false;
            }
            // Solução exige branco
            if (solucao[i][j] === 0 && estado[i][j] !== -1) {
                return false;
            }
        }
    }
    return true;
}

// =========================
// CLIQUE ESQUERDO
// =========================
function cliqueEsq(i, j) {
    if (jogoFinalizado) {
        return;
    }
    if (estado[i][j] === 1) {
        estado[i][j] = 0;
    }
    else {
        estado[i][j] = 1;
    }
    atualizarBotao(i, j);
    verificar();
}

// =========================
// CLIQUE DIREITO
// =========================
function cliqueDir(i, j) {
    if (jogoFinalizado) {
        return;
    }
    if (estado[i][j] === -1) {
        estado[i][j] = 0;
    }
    else {
        estado[i][j] = -1;
    }
    atualizarBotao(i, j);
    verificar();
}

// =========================
// NOVO JOGO
// =========================
novoJogoBtn.addEventListener("click", novoJogo);

// =========================
// INICIAR
// =========================
novoJogo();