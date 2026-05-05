function getMovesFromHTML(containerSelector = 'wc-simple-move-list') {
  const container = document.querySelector(containerSelector);
  if (!container) return [];

  const moveNodes = container.querySelectorAll('.node');

  return Array.from(moveNodes).map(node => {
    const figurineSpan = node.querySelector('[data-figurine]');
    const piece = figurineSpan ? figurineSpan.getAttribute('data-figurine') : '';

    const contentSpan = node.querySelector('.node-highlight-content');
    
    const tempSpan = contentSpan.cloneNode(true);
    const iconInTemp = tempSpan.querySelector('.icon-font-chess');
    if (iconInTemp) iconInTemp.remove();
    
    const moveText = tempSpan.textContent.trim();

    return piece + moveText;
  });
}

async function getLatestPGN(moveArray) {
    const pgnString = moveArray
        .map((pair, index) => `${index + 1}. ${pair}`)
        .join(" ");

    const url = "https://chess-api.com/v1"; 
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input: pgnString }) 
        });

        let data = await response.json();
        console.log(data)

        if (data.type === "error") {
            console.error("API Error Response:", data.text);
            return null;
        }

        return {
            nextBestMove: data.san || data.move, 
            engineText: data.text || "No analysis available"
        };
    } catch (error) {
        console.error("Fetch Error:", error);
        return null;
    }
}

function clearHighlights() {
    const oldHighlight = document.getElementById('helper-highlight-svg');
    if (oldHighlight) oldHighlight.remove();
}

function highlightTargetSquare(move) {
    clearHighlights();
    
    let targetSq = "";
    if (move.length === 4) {
        targetSq = move.substring(2, 4); 
    } else if (move.length === 2) {
        targetSq = move;
    } else {
        return; 
    }

    const board = document.querySelector('chess-board') || document.querySelector('.board');
    if (!board) return;

    const boardRect = board.getBoundingClientRect();
    const squareSize = boardRect.width / 8;

    const getSquarePos = (sq) => {
        const col = sq.charCodeAt(0) - 97; 
        const row = 8 - parseInt(sq[1]);   
        return {
            x: col * squareSize,
            y: row * squareSize
        };
    };

    const pos = getSquarePos(targetSq);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "helper-highlight-svg");
    svg.setAttribute("viewBox", `0 0 ${boardRect.width} ${boardRect.height}`);
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.zIndex = "10"; 
    svg.style.pointerEvents = "none";

    svg.innerHTML = `
        <rect 
            x="${pos.x}" 
            y="${pos.y}" 
            width="${squareSize}" 
            height="${squareSize}" 
            fill="rgba(0, 255, 0, 0.4)" 
            stroke="rgba(0, 255, 0, 0.8)"
            stroke-width="2"
        />
    `;

    board.appendChild(svg);
}

const run = async () => {
    let moves = getMovesFromHTML();
    if (moves.length === 0) {
        clearHighlights();
        return;
    }

    console.log(moves)
    
    let analysis = await getLatestPGN(moves);
    
    if (analysis && analysis.nextBestMove) {
        console.log("Recommended Move:", analysis.nextBestMove);
         console.log("engineText:", analysis.engineText);

        const moveCoords = analysis.move || analysis.nextBestMove;
        highlightTargetSquare(moveCoords); 
    }
};

let lastPgnString = "";
let debounceTimer;

const startObserving = () => {
    const targetNode = document.querySelector('.moves-list-container') || document.body;

    const observerConfig = { childList: true, subtree: true };

    const callback = (mutationsList) => {
        clearTimeout(debounceTimer);
        
        debounceTimer = setTimeout(async () => {
            const currentMoves = getMovesFromHTML();
            const currentPgnString = currentMoves.join(" ");

            if (currentPgnString !== lastPgnString) {
                lastPgnString = currentPgnString;
                console.log("New move detected! Fetching analysis...");
                await run();
            }
        }, 500); 
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, observerConfig);
    
    console.log("Observer started: Watching for moves...");
};

startObserving();
