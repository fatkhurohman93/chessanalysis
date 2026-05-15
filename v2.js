code = r"""
const PROMOTION_FALLBACK = 'Q';

const PIECE_VALUE = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
    k: 100
};

const ANALYSIS_DEPTH = 10;

function normalizeMove(move) {
    if (!move || typeof move !== 'string') return move;

    let fixed = move.trim();

    fixed = fixed.replace(/^0-0-0$/, 'O-O-O');
    fixed = fixed.replace(/^0-0$/, 'O-O');

    const invalidPromotionMatch = fixed.match(/=([^QRBN])([+#])?$/);

    if (invalidPromotionMatch) {
        fixed = fixed.replace(/=([^QRBN])([+#])?$/, `=${PROMOTION_FALLBACK}$2`);
    }

    return fixed;
}

function getMovesFromHTML(containerSelector = 'wc-simple-move-list') {
    const container = document.querySelector(containerSelector);
    if (!container) return [];

    return Array.from(container.querySelectorAll('.node'))
        .map(node => {
            const figurineSpan = node.querySelector('[data-figurine]');
            const piece = figurineSpan ? figurineSpan.getAttribute('data-figurine') : '';

            const contentSpan = node.querySelector('.node-highlight-content');
            if (!contentSpan) return '';

            const clone = contentSpan.cloneNode(true);
            clone.querySelector('.icon-font-chess')?.remove();

            return normalizeMove(piece + clone.textContent.trim());
        })
        .filter(Boolean);
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) return resolve();

        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function waitForChessJs() {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js');

    return new Promise(resolve => {
        const interval = setInterval(() => {
            if (typeof Chess !== 'undefined') {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
}

let sf = null;
let stockfishReadyPromise = null;

function loadStockfish() {
    if (stockfishReadyPromise) return stockfishReadyPromise;

    stockfishReadyPromise = fetch('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')
        .then(response => response.text())
        .then(code => {
            const blob = new Blob([code], { type: 'application/javascript' });
            sf = new Worker(URL.createObjectURL(blob));
            sf.postMessage('uci');
            return sf;
        });

    return stockfishReadyPromise;
}

function getBoardElement() {
    return (
        document.querySelector('chess-board') ||
        document.querySelector('.board') ||
        document.querySelector('[class*="board"]')
    );
}

function clearAnalysisOverlay() {
    document.querySelectorAll('.board-analysis-svg').forEach(el => el.remove());
    document.getElementById('board-analysis-banner')?.remove();
}

function clearMoveDangerOverlay() {
    document.querySelectorAll('.move-danger-svg').forEach(el => el.remove());
}

function coordToSquare(file, rank) {
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
    return String.fromCharCode(97 + file) + (rank + 1);
}

function squareToCoord(square) {
    return {
        file: square.charCodeAt(0) - 97,
        rank: Number(square[1]) - 1
    };
}

function buildBoardMap(game) {
    const board = game.board();
    const map = {};

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (!piece) continue;

            const square = coordToSquare(col, 7 - row);
            map[square] = piece;
        }
    }

    return map;
}

function getControlledSquaresByPiece(square, piece, boardMap) {
    const result = new Set();
    const { file, rank } = squareToCoord(square);

    const add = sq => {
        if (sq) result.add(sq);
    };

    if (piece.type === 'p') {
        const direction = piece.color === 'w' ? 1 : -1;
        add(coordToSquare(file - 1, rank + direction));
        add(coordToSquare(file + 1, rank + direction));
        return result;
    }

    if (piece.type === 'n') {
        [
            [1, 2], [2, 1], [2, -1], [1, -2],
            [-1, -2], [-2, -1], [-2, 1], [-1, 2]
        ].forEach(([df, dr]) => add(coordToSquare(file + df, rank + dr)));

        return result;
    }

    if (piece.type === 'k') {
        [
            [1, 0], [1, 1], [0, 1], [-1, 1],
            [-1, 0], [-1, -1], [0, -1], [1, -1]
        ].forEach(([df, dr]) => add(coordToSquare(file + df, rank + dr)));

        return result;
    }

    const directions = [];

    if (piece.type === 'b' || piece.type === 'q') {
        directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    }

    if (piece.type === 'r' || piece.type === 'q') {
        directions.push([1, 0], [-1, 0], [0, 1], [0, -1]);
    }

    directions.forEach(([df, dr]) => {
        let nextFile = file + df;
        let nextRank = rank + dr;

        while (true) {
            const target = coordToSquare(nextFile, nextRank);
            if (!target) break;

            result.add(target);

            if (boardMap[target]) break;

            nextFile += df;
            nextRank += dr;
        }
    });

    return result;
}

function getAttackers(square, attackerColor, boardMap) {
    return Object.entries(boardMap)
        .filter(([, piece]) => piece.color === attackerColor)
        .filter(([fromSquare, piece]) => {
            return getControlledSquaresByPiece(fromSquare, piece, boardMap).has(square);
        })
        .map(([fromSquare, piece]) => ({
            square: fromSquare,
            piece,
            value: PIECE_VALUE[piece.type]
        }));
}

function getThreatAnalysis(game) {
    const boardMap = buildBoardMap(game);
    const threats = [];

    Object.entries(boardMap).forEach(([square, piece]) => {
        const enemyColor = piece.color === 'w' ? 'b' : 'w';
        const attackers = getAttackers(square, enemyColor, boardMap);

        if (!attackers.length) return;

        const defenders = getAttackers(square, piece.color, boardMap);
        const cheapestAttacker = Math.min(...attackers.map(a => a.value));
        const pieceValue = PIECE_VALUE[piece.type];

        const isKing = piece.type === 'k';
        const isUndefended = defenders.length === 0;
        const isBadTrade = cheapestAttacker < pieceValue;

        threats.push({
            square,
            piece,
            attackers,
            defenders,
            severity: isKing || isUndefended || isBadTrade ? 'red' : 'orange'
        });
    });

    return threats;
}

function createGameFromCurrentMoves() {
    const game = new Chess();
    const moves = getMovesFromHTML();
    const verboseMoves = [];

    moves.forEach(move => {
        try {
            const result = game.move(normalizeMove(move), { sloppy: true });

            if (result) {
                verboseMoves.push(result);
            }
        } catch (err) {
            console.warn('Invalid move skipped:', move);
        }
    });

    return { game, moves, verboseMoves };
}

function getFenBeforeLastMove(moves) {
    const game = new Chess();

    moves.slice(0, -1).forEach(move => {
        try {
            game.move(normalizeMove(move), { sloppy: true });
        } catch (err) {
            console.warn('Invalid move skipped:', move);
        }
    });

    return game.fen();
}

function getFenTurnColor(fen) {
    return fen.split(' ')[1];
}

function normalizeEvalToWhitePerspective(score, fen) {
    if (!score) return 0;

    const turn = getFenTurnColor(fen);

    if (score.type === 'mate') {
        const mateScore = score.value > 0 ? 100 : -100;
        return turn === 'w' ? mateScore : -mateScore;
    }

    const cp = score.value / 100;
    return turn === 'w' ? cp : -cp;
}

function evaluateFen(fen, depth = ANALYSIS_DEPTH) {
    return new Promise(resolve => {
        let bestMove = null;
        let lastScore = null;

        sf.onmessage = event => {
            const line = event.data;

            if (line.includes(' score ')) {
                const match = line.match(/score (cp|mate) (-?\d+)/);

                if (match) {
                    lastScore = {
                        type: match[1],
                        value: Number(match[2])
                    };
                }
            }

            if (line.startsWith('bestmove')) {
                const match = line.match(/^bestmove\s+(\S+)/);
                bestMove = match?.[1] || null;

                resolve({
                    bestMove,
                    score: lastScore
                });
            }
        };

        sf.postMessage('stop');
        sf.postMessage('ucinewgame');
        sf.postMessage(`position fen ${fen}`);
        sf.postMessage(`go depth ${depth}`);
    });
}

function classifyMoveDrop(drop) {
    if (drop >= 3) return 'blunder';
    if (drop >= 1.5) return 'mistake';
    if (drop >= 0.7) return 'inaccuracy';
    return null;
}

function getBoardMeta(board) {
    const boardRect = board.getBoundingClientRect();

    const isFlipped =
        board.className?.toString().includes('flipped') ||
        board.getAttribute('orientation') === 'black' ||
        board.getAttribute('data-board-orientation') === 'black';

    return { boardRect, isFlipped };
}

function getSquarePosition(square, boardRect, isFlipped) {
    const file = square.charCodeAt(0) - 97;
    const rank = Number(square[1]);
    const squareSize = boardRect.width / 8;

    const col = isFlipped ? 7 - file : file;
    const row = isFlipped ? rank - 1 : 8 - rank;

    return {
        x: col * squareSize,
        y: row * squareSize,
        centerX: col * squareSize + squareSize / 2,
        centerY: row * squareSize + squareSize / 2,
        size: squareSize
    };
}

function createSvg(board, boardRect, className) {
    if (window.getComputedStyle(board).position === 'static') {
        board.style.position = 'relative';
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add(className);
    svg.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);

    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';

    return svg;
}

function drawArrow(from, to, color, id) {
    return `
        <defs>
            <marker
                id="${id}"
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="3"
                orient="auto"
                markerUnits="strokeWidth"
            >
                <path d="M0,0 L0,6 L9,3 z" fill="${color}" />
            </marker>
        </defs>

        <line
            x1="${from.centerX}"
            y1="${from.centerY}"
            x2="${to.centerX}"
            y2="${to.centerY}"
            stroke="${color}"
            stroke-width="8"
            stroke-linecap="round"
            marker-end="url(#${id})"
            opacity="0.75"
        />
    `;
}

function renderThreatOverlay(game, extra = {}) {
    clearAnalysisOverlay();

    const board = getBoardElement();
    if (!board) return;

    const { boardRect, isFlipped } = getBoardMeta(board);
    const svg = createSvg(board, boardRect, 'board-analysis-svg');
    svg.style.zIndex = '10';

    const threats = getThreatAnalysis(game);

    const threatRects = threats.map(item => {
        const pos = getSquarePosition(item.square, boardRect, isFlipped);

        const fill = item.severity === 'red'
            ? 'rgba(255, 0, 0, 0.38)'
            : 'rgba(255, 165, 0, 0.35)';

        const stroke = item.severity === 'red'
            ? 'rgba(255, 0, 0, 0.95)'
            : 'rgba(255, 140, 0, 0.95)';

        return `
            <rect
                x="${pos.x + 4}"
                y="${pos.y + 4}"
                width="${pos.size - 8}"
                height="${pos.size - 8}"
                rx="8"
                fill="${fill}"
                stroke="${stroke}"
                stroke-width="4"
            />
        `;
    }).join('');

    let arrows = '';

    if (extra.bestMove && /^[a-h][1-8][a-h][1-8]/.test(extra.bestMove)) {
        const from = getSquarePosition(extra.bestMove.slice(0, 2), boardRect, isFlipped);
        const to = getSquarePosition(extra.bestMove.slice(2, 4), boardRect, isFlipped);
        arrows += drawArrow(from, to, 'rgba(0, 180, 0, 0.95)', 'best-move-arrow');
    }

    if (extra.lastMove && extra.moveQuality && /^[a-h][1-8][a-h][1-8]/.test(extra.lastMove)) {
        const from = getSquarePosition(extra.lastMove.slice(0, 2), boardRect, isFlipped);
        const to = getSquarePosition(extra.lastMove.slice(2, 4), boardRect, isFlipped);

        const color = extra.moveQuality === 'blunder'
            ? 'rgba(255, 0, 0, 0.95)'
            : extra.moveQuality === 'mistake'
                ? 'rgba(255, 120, 0, 0.95)'
                : 'rgba(255, 200, 0, 0.95)';

        arrows += drawArrow(from, to, color, 'last-move-arrow');
    }

    svg.innerHTML = threatRects + arrows;
    board.appendChild(svg);

    showAnalysisBanner({
        threats,
        bestMove: extra.bestMove,
        moveQuality: extra.moveQuality,
        evalDrop: extra.evalDrop
    });
}

function showAnalysisBanner(data) {
    document.getElementById('board-analysis-banner')?.remove();

    const banner = document.createElement('div');
    banner.id = 'board-analysis-banner';

    banner.style.position = 'fixed';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.right = '0';
    banner.style.zIndex = '999999';
    banner.style.background = 'white';
    banner.style.color = '#111';
    banner.style.padding = '10px 16px';
    banner.style.fontSize = '14px';
    banner.style.fontWeight = 'bold';
    banner.style.textAlign = 'center';
    banner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

    const redCount = data.threats.filter(t => t.severity === 'red').length;
    const orangeCount = data.threats.filter(t => t.severity === 'orange').length;

    const qualityText = data.moveQuality
        ? `Last move: ${data.moveQuality.toUpperCase()} | Eval drop: ${(data.evalDrop || 0).toFixed(2)}`
        : 'Last move: OK';

    banner.innerHTML = `
        <span style="color:red;">Red danger: ${redCount}</span>
        &nbsp; | &nbsp;
        <span style="color:orange;">Attacked but defended: ${orangeCount}</span>
        &nbsp; | &nbsp;
        <span style="color:green;">Best: ${data.bestMove || '-'}</span>
        &nbsp; | &nbsp;
        <span>${qualityText}</span>
    `;

    document.body.prepend(banner);
}

function isDangerousPossibleMove(game, move) {
    const clone = new Chess(game.fen());
    const result = clone.move(move);

    if (!result) return null;

    const boardMap = buildBoardMap(clone);
    const movedPiece = boardMap[result.to];

    if (!movedPiece) return null;

    const enemyColor = result.color === 'w' ? 'b' : 'w';
    const attackers = getAttackers(result.to, enemyColor, boardMap);
    const defenders = getAttackers(result.to, result.color, boardMap);

    if (!attackers.length) {
        return {
            isDangerous: false,
            isWarning: false
        };
    }

    const cheapestAttacker = Math.min(...attackers.map(a => a.value));
    const movedPieceValue = PIECE_VALUE[movedPiece.type];

    const isDangerous = defenders.length === 0 || cheapestAttacker < movedPieceValue;

    return {
        isDangerous,
        isWarning: !isDangerous,
        attackers,
        defenders
    };
}

function drawLegalMoveDot(square, boardRect, isFlipped) {
    const pos = getSquarePosition(square, boardRect, isFlipped);

    return `
        <circle
            cx="${pos.centerX}"
            cy="${pos.centerY}"
            r="${pos.size * 0.13}"
            fill="rgba(0, 180, 0, 0.35)"
        />
    `;
}

function drawDangerDot(square, boardRect, isFlipped) {
    const pos = getSquarePosition(square, boardRect, isFlipped);
    const dotSize = pos.size * 0.18;

    return `
        <circle
            cx="${pos.x + dotSize}"
            cy="${pos.y + dotSize}"
            r="${dotSize / 2}"
            fill="rgba(255, 0, 0, 0.95)"
            stroke="white"
            stroke-width="2"
        />
    `;
}

function drawWarningDot(square, boardRect, isFlipped) {
    const pos = getSquarePosition(square, boardRect, isFlipped);
    const dotSize = pos.size * 0.18;

    return `
        <circle
            cx="${pos.x + pos.size - dotSize}"
            cy="${pos.y + dotSize}"
            r="${dotSize / 2}"
            fill="rgba(255, 165, 0, 0.95)"
            stroke="white"
            stroke-width="2"
        />
    `;
}

function renderPossibleMoveDangerOverlay(fromSquare) {
    clearMoveDangerOverlay();

    const board = getBoardElement();
    if (!board) return;

    const { game } = createGameFromCurrentMoves();

    const legalMoves = game.moves({
        square: fromSquare,
        verbose: true
    });

    if (!legalMoves.length) return;

    const { boardRect, isFlipped } = getBoardMeta(board);
    const svg = createSvg(board, boardRect, 'move-danger-svg');
    svg.style.zIndex = '1000';

    const legalDots = legalMoves
        .map(move => drawLegalMoveDot(move.to, boardRect, isFlipped))
        .join('');

    const dangerDots = legalMoves
        .map(move => {
            const result = isDangerousPossibleMove(game, move);
            if (!result?.isDangerous) return '';
            return drawDangerDot(move.to, boardRect, isFlipped);
        })
        .join('');

    const warningDots = legalMoves
        .map(move => {
            const result = isDangerousPossibleMove(game, move);
            if (!result?.isWarning) return '';
            return drawWarningDot(move.to, boardRect, isFlipped);
        })
        .join('');

    svg.innerHTML = legalDots + dangerDots + warningDots;
    board.appendChild(svg);
}

function getSquareFromMouseEvent(event, board) {
    const { boardRect, isFlipped } = getBoardMeta(board);

    const x = event.clientX - boardRect.left;
    const y = event.clientY - boardRect.top;

    const squareSize = boardRect.width / 8;

    let col = Math.floor(x / squareSize);
    let row = Math.floor(y / squareSize);

    if (isFlipped) {
        col = 7 - col;
        row = 7 - row;
    }

    return coordToSquare(col, 7 - row);
}

let possibleMoveHoverBound = false;

function bindPossibleMoveDangerHover() {
    if (possibleMoveHoverBound) return;

    const board = getBoardElement();
    if (!board) return;

    possibleMoveHoverBound = true;

    let lastSquare = null;

    board.addEventListener('mousemove', event => {
        const square = getSquareFromMouseEvent(event, board);
        if (!square || square === lastSquare) return;

        lastSquare = square;

        const { game } = createGameFromCurrentMoves();
        const boardMap = buildBoardMap(game);
        const piece = boardMap[square];

        if (!piece || piece.color !== game.turn()) {
            clearMoveDangerOverlay();
            return;
        }

        renderPossibleMoveDangerOverlay(square);
    });

    board.addEventListener('mouseleave', () => {
        lastSquare = null;
        clearMoveDangerOverlay();
    });
}

let currentAnalysisToken = 0;

async function analyzePosition() {
    const token = ++currentAnalysisToken;

    await waitForChessJs();
    await loadStockfish();

    if (token !== currentAnalysisToken) return;

    const { game, moves, verboseMoves } = createGameFromCurrentMoves();

    if (!moves.length) {
        renderThreatOverlay(game);
        return;
    }

    const currentFen = game.fen();
    const beforeFen = getFenBeforeLastMove(moves);

    const beforeEval = await evaluateFen(beforeFen);
    if (token !== currentAnalysisToken) return;

    const afterEval = await evaluateFen(currentFen);
    if (token !== currentAnalysisToken) return;

    const beforeWhiteEval = normalizeEvalToWhitePerspective(beforeEval.score, beforeFen);
    const afterWhiteEval = normalizeEvalToWhitePerspective(afterEval.score, currentFen);

    const lastVerboseMove = verboseMoves[verboseMoves.length - 1];
    const moverColor = lastVerboseMove?.color;

    let evalDrop = 0;

    if (moverColor === 'w') {
        evalDrop = beforeWhiteEval - afterWhiteEval;
    } else {
        evalDrop = afterWhiteEval - beforeWhiteEval;
    }

    const moveQuality = classifyMoveDrop(evalDrop);

    const lastMove = lastVerboseMove
        ? `${lastVerboseMove.from}${lastVerboseMove.to}${lastVerboseMove.promotion || ''}`
        : null;

    renderThreatOverlay(game, {
        bestMove: afterEval.bestMove,
        lastMove,
        moveQuality,
        evalDrop
    });
}

let debounceTimer;
let lastMoveString = '';

function startObserving() {
    const targetNode =
        document.querySelector('.moves-list-container') ||
        document.querySelector('wc-simple-move-list') ||
        document.body;

    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            const currentMoveString = getMovesFromHTML().join(' ');

            if (currentMoveString !== lastMoveString) {
                lastMoveString = currentMoveString;
                clearMoveDangerOverlay();
                analyzePosition();
            }
        }, 500);
    });

    observer.observe(targetNode, {
        childList: true,
        subtree: true
    });
}

async function runChessBoardAnalyzer() {
    await waitForChessJs();

    bindPossibleMoveDangerHover();
    startObserving();
    analyzePosition();

    console.log('Chess board analyzer started');
}

runChessBoardAnalyzer();
