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


// Opening book layer
// Add or remove lines here. The analyzer will use these moves before Stockfish best move.
// Format is SAN, the same style as chess.js: e4, Nf3, O-O, exd5, Qxd8#, etc.
// Chess Opening Book Move Database


const OPENING_BOOKS = [
    {
        name: 'Italian Game',
        eco: 'C50',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4']
    },
    {
        name: 'Italian Game: Giuoco Piano',
        eco: 'C50',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd4']
    },
    {
        name: 'Italian Game: Evans Gambit',
        eco: 'C51',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4']
    },
    {
        name: 'Italian Game: Two Knights Defense',
        eco: 'C55',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6']
    },
    {
        name: 'Italian Game: Fried Liver Attack',
        eco: 'C57',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5', 'Nxf7']
    },
    {
        name: 'Italian Game: Traxler Counterattack',
        eco: 'C57',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'Bc5']
    },
    {
        name: 'Ruy Lopez',
        eco: 'C60',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']
    },
    {
        name: 'Ruy Lopez: Berlin Defense',
        eco: 'C65',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6']
    },
    {
        name: 'Ruy Lopez: Morphy Defense',
        eco: 'C70',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6']
    },
    {
        name: 'Ruy Lopez: Closed Defense',
        eco: 'C84',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7']
    },
    {
        name: 'Ruy Lopez: Marshall Attack',
        eco: 'C89',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'O-O', 'c3', 'd5']
    },
    {
        name: 'Ruy Lopez: Schliemann Defense',
        eco: 'C63',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'f5']
    },
    {
        name: 'Scotch Game',
        eco: 'C45',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4']
    },
    {
        name: 'Scotch Gambit',
        eco: 'C44',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Bc4']
    },
    {
        name: 'King\'s Gambit',
        eco: 'C30',
        moves: ['e4', 'e5', 'f4']
    },
    {
        name: 'King\'s Gambit Accepted',
        eco: 'C33',
        moves: ['e4', 'e5', 'f4', 'exf4']
    },
    {
        name: 'King\'s Gambit Declined',
        eco: 'C30',
        moves: ['e4', 'e5', 'f4', 'Bc5']
    },
    {
        name: 'King\'s Gambit: Falkbeer Countergambit',
        eco: 'C31',
        moves: ['e4', 'e5', 'f4', 'd5']
    },
    {
        name: 'Vienna Game',
        eco: 'C25',
        moves: ['e4', 'e5', 'Nc3']
    },
    {
        name: 'Vienna Gambit',
        eco: 'C29',
        moves: ['e4', 'e5', 'Nc3', 'Nf6', 'f4']
    },
    {
        name: 'Four Knights Game',
        eco: 'C47',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6']
    },
    {
        name: 'Four Knights: Scotch Variation',
        eco: 'C47',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6', 'd4']
    },
    {
        name: 'Belgrade Gambit',
        eco: 'C47',
        moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6', 'd4', 'exd4', 'Nd5']
    },

    // SICILIAN DEFENSE

    {
        name: 'Sicilian Defense',
        eco: 'B20',
        moves: ['e4', 'c5']
    },
    {
        name: 'Sicilian Defense: Najdorf Variation',
        eco: 'B90',
        moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6']
    },
    {
        name: 'Sicilian Defense: Dragon Variation',
        eco: 'B70',
        moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6']
    },
    {
        name: 'Sicilian Defense: Accelerated Dragon',
        eco: 'B34',
        moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'g6']
    },
    {
        name: 'Sicilian Defense: Scheveningen',
        eco: 'B80',
        moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e6']
    },
    {
        name: 'Sicilian Defense: Classical Variation',
        eco: 'B56',
        moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'd6']
    },
    {
        name: 'Sicilian Defense: Sveshnikov Variation',
        eco: 'B33',
        moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e5']
    },
    {
        name: 'Sicilian Defense: Kalashnikov Variation',
        eco: 'B32',
        moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'e5']
    },
    {
        name: 'Sicilian Defense: Taimanov Variation',
        eco: 'B47',
        moves: ['e4', 'c5', 'Nf3', 'e6', 'd4', 'cxd4', 'Nxd4', 'Nc6']
    },
    {
        name: 'Sicilian Defense: Kan Variation',
        eco: 'B42',
        moves: ['e4', 'c5', 'Nf3', 'e6', 'd4', 'cxd4', 'Nxd4', 'a6']
    },
    {
        name: 'Sicilian Defense: Rossolimo Variation',
        eco: 'B31',
        moves: ['e4', 'c5', 'Nf3', 'Nc6', 'Bb5']
    },
    {
        name: 'Sicilian Defense: Alapin Variation',
        eco: 'B22',
        moves: ['e4', 'c5', 'c3']
    },
    {
        name: 'Sicilian Defense: Smith-Morra Gambit',
        eco: 'B21',
        moves: ['e4', 'c5', 'd4', 'cxd4', 'c3']
    },
    {
        name: 'Sicilian Defense: Grand Prix Attack',
        eco: 'B23',
        moves: ['e4', 'c5', 'Nc3', 'Nc6', 'f4']
    },
    {
        name: 'Closed Sicilian',
        eco: 'B23',
        moves: ['e4', 'c5', 'Nc3']
    },

    // FRENCH

    {
        name: 'French Defense',
        eco: 'C00',
        moves: ['e4', 'e6']
    },
    {
        name: 'French Defense: Advance Variation',
        eco: 'C02',
        moves: ['e4', 'e6', 'd4', 'd5', 'e5']
    },
    {
        name: 'French Defense: Tarrasch Variation',
        eco: 'C03',
        moves: ['e4', 'e6', 'd4', 'd5', 'Nd2']
    },
    {
        name: 'French Defense: Classical Variation',
        eco: 'C11',
        moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6']
    },
    {
        name: 'French Defense: Winawer Variation',
        eco: 'C15',
        moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4']
    },
    {
        name: 'French Defense: Exchange Variation',
        eco: 'C01',
        moves: ['e4', 'e6', 'd4', 'd5', 'exd5']
    },

    // CARO-KANN

    {
        name: 'Caro-Kann Defense',
        eco: 'B10',
        moves: ['e4', 'c6']
    },
    {
        name: 'Caro-Kann Defense: Main Line',
        eco: 'B18',
        moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5']
    },
    {
        name: 'Caro-Kann Defense: Advance Variation',
        eco: 'B12',
        moves: ['e4', 'c6', 'd4', 'd5', 'e5']
    },
    {
        name: 'Caro-Kann Defense: Exchange Variation',
        eco: 'B13',
        moves: ['e4', 'c6', 'd4', 'd5', 'exd5']
    },
    {
        name: 'Caro-Kann Defense: Panov Attack',
        eco: 'B14',
        moves: ['e4', 'c6', 'd4', 'd5', 'exd5', 'cxd5', 'c4']
    },
    {
        name: 'Caro-Kann Defense: Fantasy Variation',
        eco: 'B15',
        moves: ['e4', 'c6', 'd4', 'd5', 'f3']
    },
    {
        name: 'Caro-Kann Defense: Two Knights Variation',
        eco: 'B10',
        moves: ['e4', 'c6', 'Nc3', 'd5', 'Nf3']
    },
    {
        name: 'Caro-Kann Defense: Hillbilly Attack',
        eco: 'B10',
        moves: ['e4', 'c6', 'Bc4']
    },

    // ALEKHINE

    {
        name: 'Alekhine Defense',
        eco: 'B02',
        moves: ['e4', 'Nf6']
    },
    {
        name: 'Alekhine Defense: Four Pawns Attack',
        eco: 'B03',
        moves: ['e4', 'Nf6', 'e5', 'Nd5', 'd4', 'd6', 'c4', 'Nb6', 'f4']
    },

    // PIRC

    {
        name: 'Pirc Defense',
        eco: 'B07',
        moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6']
    },
    {
        name: 'Pirc Defense: Austrian Attack',
        eco: 'B09',
        moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'f4']
    },

    // MODERN

    {
        name: 'Modern Defense',
        eco: 'B06',
        moves: ['e4', 'g6']
    },

    // SCANDINAVIAN

    {
        name: 'Scandinavian Defense',
        eco: 'B01',
        moves: ['e4', 'd5']
    },
    {
        name: 'Scandinavian Defense: Portuguese Gambit',
        eco: 'B01',
        moves: ['e4', 'd5', 'exd5', 'Nf6']
    },

    // QUEEN'S GAMBIT

    {
        name: 'Queen\'s Gambit',
        eco: 'D06',
        moves: ['d4', 'd5', 'c4']
    },
    {
        name: 'Queen\'s Gambit Accepted',
        eco: 'D20',
        moves: ['d4', 'd5', 'c4', 'dxc4']
    },
    {
        name: 'Queen\'s Gambit Declined',
        eco: 'D30',
        moves: ['d4', 'd5', 'c4', 'e6']
    },
    {
        name: 'QGD: Orthodox Defense',
        eco: 'D60',
        moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7']
    },
    {
        name: 'QGD: Cambridge Springs Defense',
        eco: 'D52',
        moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Nbd7', 'e3', 'c6', 'Nf3', 'Qa5']
    },

    // SLAV

    {
        name: 'Slav Defense',
        eco: 'D10',
        moves: ['d4', 'd5', 'c4', 'c6']
    },
    {
        name: 'Semi-Slav Defense',
        eco: 'D43',
        moves: ['d4', 'd5', 'c4', 'c6', 'Nc3', 'Nf6', 'Nf3', 'e6']
    },
    {
        name: 'Semi-Slav: Botvinnik Variation',
        eco: 'D44',
        moves: ['d4', 'd5', 'c4', 'c6', 'Nc3', 'Nf6', 'Nf3', 'e6', 'Bg5', 'dxc4', 'e4', 'b5']
    },

    // KING'S INDIAN

    {
        name: 'King\'s Indian Defense',
        eco: 'E60',
        moves: ['d4', 'Nf6', 'c4', 'g6']
    },
    {
        name: 'King\'s Indian Defense: Classical Variation',
        eco: 'E92',
        moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5']
    },
    {
        name: 'King\'s Indian Defense: Saemisch Variation',
        eco: 'E80',
        moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'f3']
    },

    // GRUNFELD

    {
        name: 'Grunfeld Defense',
        eco: 'D70',
        moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5']
    },

    // NIMZO

    {
        name: 'Nimzo-Indian Defense',
        eco: 'E20',
        moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4']
    },
    {
        name: 'Nimzo-Indian: Rubinstein Variation',
        eco: 'E43',
        moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3']
    },

    // QUEEN'S INDIAN

    {
        name: 'Queen\'s Indian Defense',
        eco: 'E12',
        moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6']
    },

    // BOGO

    {
        name: 'Bogo-Indian Defense',
        eco: 'E11',
        moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'Bb4+']
    },

    // BENONI

    {
        name: 'Modern Benoni',
        eco: 'A56',
        moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'e6']
    },
    {
        name: 'Benko Gambit',
        eco: 'A57',
        moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'b5']
    },

    // ENGLISH

    {
        name: 'English Opening',
        eco: 'A10',
        moves: ['c4']
    },
    {
        name: 'English Opening: Symmetrical Variation',
        eco: 'A34',
        moves: ['c4', 'c5']
    },
    {
        name: 'English Opening: Reversed Sicilian',
        eco: 'A20',
        moves: ['c4', 'e5']
    },

    // RETI

    {
        name: 'Reti Opening',
        eco: 'A04',
        moves: ['Nf3']
    },
    {
        name: 'King\'s Indian Attack',
        eco: 'A07',
        moves: ['Nf3', 'd5', 'g3', 'Nf6', 'Bg2']
    },

    // CATALAN

    {
        name: 'Catalan Opening',
        eco: 'E00',
        moves: ['d4', 'Nf6', 'c4', 'e6', 'g3']
    },

    // BIRD

    {
        name: 'Bird Opening',
        eco: 'A02',
        moves: ['f4']
    },
    {
        name: 'Bird Opening: From Gambit',
        eco: 'A02',
        moves: ['f4', 'e5']
    },

    // LONDON

    {
        name: 'London System',
        eco: 'D02',
        moves: ['d4', 'd5', 'Bf4']
    },
    {
        name: 'Jobava London System',
        eco: 'D00',
        moves: ['d4', 'd5', 'Nc3', 'Nf6', 'Bf4']
    },

    // TROMPOWSKY

    {
        name: 'Trompowsky Attack',
        eco: 'A45',
        moves: ['d4', 'Nf6', 'Bg5']
    },

    // VERESOV

    {
        name: 'Veresov Attack',
        eco: 'D01',
        moves: ['d4', 'd5', 'Nc3', 'Nf6', 'Bg5']
    },

    // BLACKMAR-DIEMER

    {
        name: 'Blackmar-Diemer Gambit',
        eco: 'D00',
        moves: ['d4', 'd5', 'e4']
    },

    // BUDAPEST

    {
        name: 'Budapest Gambit',
        eco: 'A51',
        moves: ['d4', 'Nf6', 'c4', 'e5']
    },

    // DUTCH

    {
        name: 'Dutch Defense',
        eco: 'A80',
        moves: ['d4', 'f5']
    },
    {
        name: 'Dutch Defense: Leningrad Variation',
        eco: 'A87',
        moves: ['d4', 'f5', 'g3', 'Nf6', 'Bg2', 'g6']
    },
    {
        name: 'Dutch Defense: Stonewall Variation',
        eco: 'A90',
        moves: ['d4', 'f5', 'g3', 'Nf6', 'Bg2', 'e6', 'Nf3', 'd5']
    },

    // PETROFF

    {
        name: 'Petroff Defense',
        eco: 'C42',
        moves: ['e4', 'e5', 'Nf3', 'Nf6']
    },
    {
        name: 'Stafford Gambit',
        eco: 'C42',
        moves: ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'Nc6']
    },

    // PHILIDOR

    {
        name: 'Philidor Defense',
        eco: 'C41',
        moves: ['e4', 'e5', 'Nf3', 'd6']
    },

    // LATVIAN

    {
        name: 'Latvian Gambit',
        eco: 'C40',
        moves: ['e4', 'e5', 'Nf3', 'f5']
    },

    // ELEPHANT

    {
        name: 'Elephant Gambit',
        eco: 'C40',
        moves: ['e4', 'e5', 'Nf3', 'd5']
    },

    // MEME / RARE OPENINGS

    {
        name: 'Bongcloud Opening',
        eco: 'A00',
        moves: ['e4', 'e5', 'Ke2']
    },
    {
        name: 'Grob Opening',
        eco: 'A00',
        moves: ['g4']
    },
    {
        name: 'Polish Opening',
        eco: 'A00',
        moves: ['b4']
    },
    {
        name: 'Sodium Attack',
        eco: 'A00',
        moves: ['Na3']
    },
    {
        name: 'Ware Opening',
        eco: 'A00',
        moves: ['a4']
    },
    {
        name: 'Amar Opening',
        eco: 'A00',
        moves: ['Nh3']
    },
    {
        name: 'St. George Defense',
        eco: 'B00',
        moves: ['e4', 'a6']
    }
];


function normalizeSanForCompare(move) {
    return normalizeMove(move)
        ?.replace(/[+#?!]+$/g, '')
        .replace(/\s+/g, '') || '';
}

function bookMoveToUci(currentGame, sanMove) {
    try {
        const clone = new Chess(currentGame.fen());
        const result = clone.move(normalizeMove(sanMove), { sloppy: true });

        if (!result) return null;

        return `${result.from}${result.to}${result.promotion || ''}`;
    } catch (err) {
        console.warn('Invalid opening book move:', sanMove, err);
        return null;
    }
}

function getOpeningRecommendation(moves, currentGame) {
    const normalizedMoves = moves.map(normalizeSanForCompare);

    const matchingLines = OPENING_BOOK_LINES.filter(line => {
        return normalizedMoves.every((move, index) => {
            return normalizeSanForCompare(line.moves[index]) === move;
        });
    });

    const activeLines = matchingLines.filter(line => line.moves.length > moves.length);

    if (activeLines.length) {
        const nextMove = activeLines[0].moves[moves.length];

        return {
            status: 'active',
            name: activeLines[0].name,
            nextMoveSan: nextMove,
            bestMove: bookMoveToUci(currentGame, nextMove),
            message: `Opening book active: ${activeLines[0].name}. Recommended book move: ${nextMove}.`,
            candidateLines: activeLines.map(line => line.name)
        };
    }

    if (matchingLines.length) {
        return {
            status: 'completed',
            name: matchingLines[0].name,
            bestMove: null,
            message: `Opening line completed: ${matchingLines[0].name}. Switching back to Stockfish.`
        };
    }

    if (moves.length) {
        const previousMoves = normalizedMoves.slice(0, -1);
        const lastMove = normalizedMoves[normalizedMoves.length - 1];

        const deviatedLines = OPENING_BOOK_LINES.filter(line => {
            if (line.moves.length < moves.length) return false;

            const previousMatches = previousMoves.every((move, index) => {
                return normalizeSanForCompare(line.moves[index]) === move;
            });

            const expectedMove = normalizeSanForCompare(line.moves[moves.length - 1]);

            return previousMatches && expectedMove && expectedMove !== lastMove;
        });

        if (deviatedLines.length) {
            const expectedMoves = [...new Set(
                deviatedLines.map(line => line.moves[moves.length - 1]).filter(Boolean)
            )];

            return {
                status: 'deviated',
                name: deviatedLines[0].name,
                bestMove: null,
                expectedMoves,
                actualMove: moves[moves.length - 1],
                message: `Opening ended: opponent/player deviated from ${deviatedLines[0].name}. Expected: ${expectedMoves.join(' or ')}, played: ${moves[moves.length - 1]}. Switching back to Stockfish.`
            };
        }
    }

    return {
        status: 'unknown',
        bestMove: null,
        message: 'No matching opening book line. Using Stockfish best move.'
    };
}

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
        bestMoveSource: extra.bestMoveSource,
        openingInfo: extra.openingInfo,
        stockfishBestMove: extra.stockfishBestMove,
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

    const bestMoveLabel = data.bestMoveSource === 'opening'
        ? `Opening move: ${data.bestMove || '-'}${data.openingInfo?.nextMoveSan ? ` (${data.openingInfo.nextMoveSan})` : ''}`
        : `Stockfish best: ${data.bestMove || '-'}`;

    const openingColor = data.openingInfo?.status === 'active'
        ? 'blue'
        : data.openingInfo?.status === 'deviated'
            ? 'red'
            : data.openingInfo?.status === 'completed'
                ? 'purple'
                : '#666';

    banner.innerHTML = `
        <span style="color:red;">Red danger: ${redCount}</span>
        &nbsp; | &nbsp;
        <span style="color:orange;">Attacked but defended: ${orangeCount}</span>
        &nbsp; | &nbsp;
        <span style="color:green;">${bestMoveLabel}</span>
        ${data.bestMoveSource === 'opening' && data.stockfishBestMove ? `&nbsp; | &nbsp;<span style="color:#666;">Engine wanted: ${data.stockfishBestMove}</span>` : ''}
        &nbsp; | &nbsp;
        <span style="color:${openingColor};">${data.openingInfo?.message || ''}</span>
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
        const openingInfo = getOpeningRecommendation(moves, game);

        renderThreatOverlay(game, {
            bestMove: openingInfo.bestMove,
            bestMoveSource: openingInfo.bestMove ? 'opening' : 'stockfish',
            openingInfo
        });
        return;
    }

    const currentFen = game.fen();
    const beforeFen = getFenBeforeLastMove(moves);

    const beforeEval = await evaluateFen(beforeFen);
    if (token !== currentAnalysisToken) return;

    const afterEval = await evaluateFen(currentFen);
    if (token !== currentAnalysisToken) return;

    const openingInfo = getOpeningRecommendation(moves, game);
    const displayBestMove = openingInfo.status === 'active' && openingInfo.bestMove
        ? openingInfo.bestMove
        : afterEval.bestMove;

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
        bestMove: displayBestMove,
        bestMoveSource: openingInfo.status === 'active' && openingInfo.bestMove ? 'opening' : 'stockfish',
        stockfishBestMove: afterEval.bestMove,
        openingInfo,
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
