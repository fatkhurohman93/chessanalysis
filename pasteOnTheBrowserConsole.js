const PROMOTION_FALLBACK = 'Q';

function normalizeMove(move) {
    if (!move || typeof move !== 'string') return move;

    let fixed = move.trim();

    fixed = fixed.replace(/^0-0-0$/, 'O-O-O');
    fixed = fixed.replace(/^0-0$/, 'O-O');

    const invalidPromotionMatch = fixed.match(/=([^QRBN])([+#])?$/);

    if (invalidPromotionMatch) {
        console.warn(`Invalid promotion "${fixed}" detected. Fallback to ${PROMOTION_FALLBACK}.`);
        fixed = fixed.replace(/=([^QRBN])([+#])?$/, `=${PROMOTION_FALLBACK}$2`);
    }

    return fixed;
}

function getMovesFromHTML(containerSelector = 'wc-simple-move-list') {
    const container = document.querySelector(containerSelector);
    if (!container) return [];

    const moveNodes = container.querySelectorAll('.node');

    return Array.from(moveNodes)
        .map(node => {
            const figurineSpan = node.querySelector('[data-figurine]');
            const piece = figurineSpan ? figurineSpan.getAttribute('data-figurine') : '';

            const contentSpan = node.querySelector('.node-highlight-content');
            if (!contentSpan) return '';

            const tempSpan = contentSpan.cloneNode(true);
            const iconInTemp = tempSpan.querySelector('.icon-font-chess');
            if (iconInTemp) iconInTemp.remove();

            return normalizeMove(piece + tempSpan.textContent.trim());
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
            const blob = new Blob([code], {
                type: 'application/javascript'
            });
            sf = new Worker(URL.createObjectURL(blob));

            sf.postMessage('uci');
            sf.postMessage('setoption name MultiPV value 3');

            console.log('✅ Stockfish ready');
            return sf;
        });

    return stockfishReadyPromise;
}

async function getLatestPGN(moveArray) {
    await waitForChessJs();
    await loadStockfish();

    const game = new Chess();

    moveArray.forEach(move => {
        const fixedMove = normalizeMove(move);

        try {
            const result = game.move(fixedMove);

            if (!result) {
                console.warn('Invalid move:', {
                    original: move,
                    fixed: fixedMove,
                    fenBeforeInvalidMove: game.fen()
                });
            }
        } catch (err) {
            console.warn('Invalid move skipped:', {
                original: move,
                fixed: fixedMove,
                fenBeforeInvalidMove: game.fen(),
                error: err
            });
        }
    });

    const fen = game.fen();

    return new Promise(resolve => {
        const topMoves = [];

        sf.onmessage = function(event) {
            const line = event.data;

            if (line.includes('multipv') && line.includes(' pv ')) {
                const match = line.match(/multipv (\d+).*?score (cp|mate) (-?\d+).*? pv (.+)/);

                if (match) {
                    const index = Number(match[1]) - 1;
                    const scoreType = match[2];
                    const rawScore = Number(match[3]);
                    const pv = match[4];

                    topMoves[index] = {
                        move: pv.split(' ')[0],
                        score: scoreType === 'cp' ? rawScore / 100 : `Mate ${rawScore}`,
                        type: scoreType,
                        line: pv
                    };
                }
            }

            if (line.startsWith('bestmove')) {
                resolve(topMoves.filter(Boolean).slice(0, 3));
            }
        };

        sf.postMessage('stop');
        sf.postMessage(`position fen ${fen}`);
        sf.postMessage('go depth 12');
    });
}

function showBestMovesBanner(topMoves) {
    let banner = document.getElementById('best-moves-banner');

    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'best-moves-banner';

        banner.style.position = 'fixed';
        banner.style.top = '0';
        banner.style.left = '0';
        banner.style.right = '0';
        banner.style.zIndex = '999999';
        banner.style.background = 'white';
        banner.style.color = 'red';
        banner.style.padding = '12px 16px';
        banner.style.fontSize = '16px';
        banner.style.fontWeight = 'bold';
        banner.style.textAlign = 'center';
        banner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

        document.body.prepend(banner);
        document.body.style.paddingTop = '60px';
    }

    banner.innerHTML = topMoves
        .map((item, index) => `#${index + 1} ${item.move} | Score: ${item.score}`)
        .join(' &nbsp; | &nbsp; ');
}

function clearHighlights() {
    document.querySelectorAll('.helper-highlight-svg').forEach(el => el.remove());
}

function highlightBestMoves(topMoves) {
    clearHighlights();

    const board =
        document.querySelector('chess-board') ||
        document.querySelector('.board') ||
        document.querySelector('[class*="board"]');

    if (!board) return;

    const boardRect = board.getBoundingClientRect();
    const squareSize = boardRect.width / 8;

    if (window.getComputedStyle(board).position === 'static') {
        board.style.position = 'relative';
    }

    const isFlipped =
        board.className?.toString().includes('flipped') ||
        board.getAttribute('orientation') === 'black' ||
        board.getAttribute('data-board-orientation') === 'black';

    const colors = [
        'rgba(0, 255, 0, 0.45)',
        'rgba(0, 120, 255, 0.45)',
        'rgba(255, 230, 0, 0.45)'
    ];

    const strokeColors = [
        'rgba(0, 180, 0, 0.95)',
        'rgba(0, 90, 255, 0.95)',
        'rgba(220, 180, 0, 0.95)'
    ];

    const getSquarePos = sq => {
        const file = sq.charCodeAt(0) - 97;
        const rank = Number(sq[1]);

        const col = isFlipped ? 7 - file : file;
        const row = isFlipped ? rank - 1 : 8 - rank;

        return {
            x: col * squareSize,
            y: row * squareSize
        };
    };

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('helper-highlight-svg');
    svg.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);

    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.zIndex = '10';
    svg.style.pointerEvents = 'none';

    svg.innerHTML = topMoves
        .slice(0, 3)
        .map((item, index) => {
            const move = item.move;
            if (!move || move.length < 4) return '';

            const fromSq = move.substring(0, 2);
            const toSq = move.substring(2, 4);

            if (!/^[a-h][1-8]$/.test(fromSq) || !/^[a-h][1-8]$/.test(toSq)) {
                return '';
            }

            const from = getSquarePos(fromSq);
            const to = getSquarePos(toSq);

            const offset = index * 6;
            const size = squareSize - offset * 2;

            return `
  <rect
    x="${from.x + offset}"
    y="${from.y + offset}"
    width="${size}"
    height="${size}"
    fill="none"
    stroke="${strokeColors[index]}"
    stroke-width="4"
  />

  <rect
    x="${to.x + offset}"
    y="${to.y + offset}"
    width="${size}"
    height="${size}"
    fill="${colors[index]}"
    stroke="${strokeColors[index]}"
    stroke-width="4"
  />
`;
        })
        .join('');

    board.appendChild(svg);
}

const run = async () => {
    const moves = getMovesFromHTML();

    if (moves.length === 0) {
        clearHighlights();
        return;
    }

    console.log('Moves:', moves);

    const topMoves = await getLatestPGN(moves);

    if (!topMoves || topMoves.length === 0) {
        console.warn('No best moves found');
        return;
    }

    showBestMovesBanner(topMoves);
    highlightBestMoves(topMoves);
};

let lastPgnString = '';
let debounceTimer;

const startObserving = () => {
    const targetNode =
        document.querySelector('.moves-list-container') ||
        document.querySelector('wc-simple-move-list') ||
        document.body;

    const observerConfig = {
        childList: true,
        subtree: true
    };

    const callback = () => {
        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(async () => {
            const currentMoves = getMovesFromHTML();
            const currentPgnString = currentMoves.join(' ');

            if (currentPgnString !== lastPgnString) {
                lastPgnString = currentPgnString;
                console.log('New move detected! Fetching analysis...');
                await run();
            }
        }, 500);
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, observerConfig);

    console.log('Observer started: Watching for moves...');
};

startObserving();
run();
