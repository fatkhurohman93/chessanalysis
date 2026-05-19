const AUTO_MOVE_ENABLED = true; // Set to true to let the bot automatically play

// function getRandomDelay() {
//     if (Math.random() < 0.75) {
//         return Math.floor(Math.random() * 200) + 100;
//     } else {
//         return Math.floor(Math.random() * 1500) + 201;
//     }
// }

function getRandomDelay() {
    if (Math.random() < 0.40) {
        return Math.floor(Math.random() * 1000) + 100;
    } else {
        return Math.floor(Math.random() * 2500) + 1001;
    }
}

let CUSTOM_DELAY = null;

// Global state for the current move's delay
let currentDelay = CUSTOM_DELAY ?? getRandomDelay();

// --- DYNAMIC HUMANIZED MISTAKES/INACCURACIES SETTINGS ---
// These values will automatically update themselves whenever `currentDelay` changes
const botSettings = {
    get MAX_MISTAKES_PER_GAME() {
        if (currentDelay < 150) return 12;
        if (currentDelay < 250) return 8;
        if (currentDelay < 600) return 6;
        if (currentDelay < 1000) return 4;
        if (currentDelay < 1501) return 2;
        return 2; // Base value
    },
    get MAX_INACCURACIES_PER_GAME() {
        if (currentDelay < 150) return 30;
        if (currentDelay < 250) return 20;
        if (currentDelay < 600) return 10;
        if (currentDelay < 1000) return 6;
        if (currentDelay < 1501) return 3;
        return 3; // Base value
    },
    get CHANCE_MISTAKE() {
        if (currentDelay < 150) return 0.35;
        if (currentDelay < 250) return 0.30;
        if (currentDelay < 600) return 0.25;
        if (currentDelay < 1000) return 0.15;
        if (currentDelay < 1501) return 0.10;
        // if (currentDelay < 150) return 0.25;
        // if (currentDelay < 250) return 0.20;
        // if (currentDelay < 600) return 0.15;
        // if (currentDelay < 1000) return 0.10;
        // if (currentDelay < 1501) return 0.05;
        return 0.05; // Base value
    },
    get CHANCE_INACCURACY() {
         if (currentDelay < 150) return 0.60;
        if (currentDelay < 250) return 0.40;
        if (currentDelay < 600) return 0.35;
        if (currentDelay < 1000) return 0.30;
        if (currentDelay < 1501) return 0.15;
        //  if (currentDelay < 150) return 0.40;
        // if (currentDelay < 250) return 0.30;
        // if (currentDelay < 600) return 0.25;
        // if (currentDelay < 1000) return 0.20;
        // if (currentDelay < 1501) return 0.15;
        return 0.15; // Base value
    }
};

const PROMOTION_FALLBACK = 'Q';

const PIECE_VALUE = {
    p: 1, n: 3, b: 3, r: 5, q: 9, k: 100
};

const ANALYSIS_DEPTH = 3;

// Game state tracking for randomization
let currentMistakes = 0;
let currentInaccuracies = 0;
let previousMovesCount = 0;

const OPENING_BOOK_LINES = [
    // ITALIAN GAMES
    { name: 'Italian Game', eco: 'C50', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'] },
    { name: 'Giuoco Piano', eco: 'C50', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'] },
    { name: 'Evans Gambit', eco: 'C51', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4'] },
    { name: 'Italian Gambit', eco: 'C50', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'd4'] },
    { name: 'Two Knights Defense', eco: 'C55', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'] },
    { name: 'Fried Liver Attack', eco: 'C57', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'd5', 'exd5', 'Nxd5', 'Nxf7'] },
    { name: 'Traxler Counterattack', eco: 'C57', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6', 'Ng5', 'Bc5'] },
    { name: 'Anti-Fried Liver', eco: 'C50', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'h6'] },
    { name: 'Modern Italian', eco: 'C54', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'c3', 'Nf6', 'd3'] },
    { name: 'Scotch Gambit', eco: 'C44', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Bc4'] },

    // RUY LOPEZ
    { name: 'Ruy Lopez (Spanish Opening)', eco: 'C60', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'] },
    { name: 'Morphy Defense', eco: 'C70', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'] },
    { name: 'Berlin Defense', eco: 'C65', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'] },
    { name: 'Berlin Endgame', eco: 'C67', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6', 'O-O', 'Nxe4', 'd4', 'Nd6', 'Bxc6', 'dxc6', 'dxe5', 'Nf5', 'Qxd8+', 'Kxd8'] },
    { name: 'Open Ruy Lopez', eco: 'C80', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Nxe4'] },
    { name: 'Closed Ruy Lopez', eco: 'C84', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7'] },
    { name: 'Chigorin Defense', eco: 'C97', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Na5'] },
    { name: 'Breyer Defense', eco: 'C95', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Nb8'] },
    { name: 'Zaitsev System', eco: 'C92', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'd6', 'c3', 'O-O', 'h3', 'Re8'] },
    { name: 'Marshall Attack', eco: 'C89', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'Be7', 'Re1', 'b5', 'Bb3', 'O-O', 'c3', 'd5'] },
    { name: 'Archangel Defense', eco: 'C78', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'b5', 'Bb3', 'Bb7'] },
    { name: 'Neo-Archangel', eco: 'C78', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6', 'O-O', 'b5', 'Bb3', 'Bc5'] },
    { name: 'Schliemann Defense', eco: 'C63', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'f5'] },
    { name: 'Steinitz Defense', eco: 'C62', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'd6'] },
    { name: 'Bird Defense', eco: 'C61', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nd4'] },
    { name: 'Cozio Defense', eco: 'C60', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nge7'] },
    { name: 'Exchange Variation', eco: 'C68', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Bxc6'] },

    // SCOTCH GAME
    { name: 'Scotch Game', eco: 'C44', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'] },
    { name: 'Scotch Gambit', eco: 'C44', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Bc4'] },
    { name: 'Classical Scotch', eco: 'C45', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Bc5'] },
    { name: 'Schmidt Variation', eco: 'C45', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Nf6'] },
    { name: 'Göring Gambit', eco: 'C44', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'c3'] },
    { name: 'Mieses Variation', eco: 'C45', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4', 'exd4', 'Nxd4', 'Nf6', 'Nxc6', 'bxc6', 'e5', 'Qe7', 'Qe2', 'Nd5'] },

    // KING's GAMBIT
    { name: "King's Gambit", eco: 'C30', moves: ['e4', 'e5', 'f4'] },
    { name: "King's Gambit Accepted", eco: 'C33', moves: ['e4', 'e5', 'f4', 'exf4'] },
    { name: "King's Gambit Declined", eco: 'C30', moves: ['e4', 'e5', 'f4', 'Bc5'] },
    { name: 'Falkbeer Countergambit', eco: 'C31', moves: ['e4', 'e5', 'f4', 'd5'] },
    { name: 'Muzio Gambit', eco: 'C37', moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'g5', 'Bc4', 'g4', 'O-O'] },
    { name: 'Kieseritzky Gambit', eco: 'C39', moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'g5', 'h4', 'g4', 'Ne5'] },
    { name: 'Allgaier Gambit', eco: 'C39', moves: ['e4', 'e5', 'f4', 'exf4', 'Nf3', 'g5', 'h4', 'g4', 'Ng5'] },
    { name: "Bishop's Gambit", eco: 'C33', moves: ['e4', 'e5', 'f4', 'exf4', 'Bc4'] },

    // VIENNA
    { name: 'Vienna Game', eco: 'C25', moves: ['e4', 'e5', 'Nc3'] },
    { name: 'Vienna Gambit', eco: 'C29', moves: ['e4', 'e5', 'Nc3', 'Nf6', 'f4'] },
    { name: 'Frankenstein-Dracula', eco: 'C27', moves: ['e4', 'e5', 'Nc3', 'Nf6', 'Bc4', 'Nxe4'] },
    { name: 'Max Lange Defense', eco: 'C25', moves: ['e4', 'e5', 'Nc3', 'Nc6'] },

    // FOUR KNIGHT GAME
    { name: 'Four Knights Game', eco: 'C47', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6'] },
    { name: 'Scotch Four Knights', eco: 'C47', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6', 'd4'] },
    { name: 'Spanish Four Knights', eco: 'C48', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6', 'Bb5'] },
    { name: 'Belgrade Gambit', eco: 'C47', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6', 'd4', 'exd4', 'Nd5'] },

    // SICILIAN DEFENSE
    { name: 'Sicilian Defense', eco: 'B20', moves: ['e4', 'c5'] },
    { name: 'Sicilian Defense, Najdorf Variation', eco: 'B90', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'] },
    { name: 'Sicilian Defense, Najdorf Variation, English Attack', eco: 'B90', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be3'] },
    { name: 'Sicilian Defense, Najdorf Variation, Poisoned Pawn', eco: 'B96', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Bg5', 'e6', 'f4', 'Qb6'] },
    { name: 'Sicilian Defense, Najdorf Variation, Adams Attack', eco: 'B90', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'h3'] },
    { name: 'Sicilian Defense, Najdorf Variation, Opocensky Variation', eco: 'B92', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Be2'] },
    { name: 'Sicilian Defense, Najdorf Variation, Fischer-Sozin Attack', eco: 'B86', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6', 'Bc4'] },
    { name: 'Sicilian Defense, Dragon Variation', eco: 'B70', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'] },
    { name: 'Sicilian Defense, Dragon Variation, Yugoslav Attack', eco: 'B75', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6', 'Be3', 'Bg7', 'f3'] },
    { name: 'Sicilian Defense, Accelerated Dragon', eco: 'B34', moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'g6'] },
    { name: 'Sicilian Defense, Hyper-Accelerated Dragon', eco: 'B27', moves: ['e4', 'c5', 'Nf3', 'g6'] },
    { name: 'Sicilian Defense, Scheveningen Variation', eco: 'B80', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e6'] },
    { name: 'Sicilian Defense, Classical Variation', eco: 'B56', moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'Nc6'] },
    { name: 'Sicilian Defense, Sveshnikov Variation', eco: 'B33', moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'e5'] },
    { name: 'Sicilian Defense, Kalashnikov Variation', eco: 'B32', moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'e5'] },
    { name: 'Sicilian Defense, Taimanov Variation', eco: 'B46', moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'e6'] },
    { name: 'Sicilian Defense, Kan Variation', eco: 'B41', moves: ['e4', 'c5', 'Nf3', 'e6', 'd4', 'cxd4', 'Nxd4', 'a6'] },
    { name: 'Sicilian Defense, Rossolimo Variation', eco: 'B30', moves: ['e4', 'c5', 'Nf3', 'Nc6', 'Bb5'] },
    { name: 'Sicilian Defense, Alapin Variation', eco: 'B22', moves: ['e4', 'c5', 'c3'] },
    { name: 'Sicilian Defense, Smith-Morra Gambit', eco: 'B21', moves: ['e4', 'c5', 'd4', 'cxd4', 'c3'] },
    { name: 'Sicilian Defense, Grand Prix Attack', eco: 'B23', moves: ['e4', 'c5', 'Nc3', 'Nc6', 'f4'] },
    { name: 'Sicilian Defense, Closed Variation', eco: 'B23', moves: ['e4', 'c5', 'Nc3'] },

    // FRENCH DEFENSE
    { name: 'French Defense', eco: 'C00', moves: ['e4', 'e6'] },
    { name: 'French Defense, Advance Variation', eco: 'C02', moves: ['e4', 'e6', 'd4', 'd5', 'e5'] },
    { name: 'French Defense, Tarrasch Variation', eco: 'C03', moves: ['e4', 'e6', 'd4', 'd5', 'Nd2'] },
    { name: 'French Defense, Classical Variation', eco: 'C11', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6'] },
    { name: 'French Defense, Winawer Variation', eco: 'C15', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Bb4'] },
    { name: 'French Defense, Rubinstein Variation', eco: 'C10', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'dxe4'] },
    { name: 'French Defense, Burn Variation', eco: 'C11', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'Bg5', 'dxe4'] },
    { name: 'French Defense, MacCutcheon Variation', eco: 'C12', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'Bg5', 'Bb4'] },
    { name: 'French Defense, Exchange Variation', eco: 'C01', moves: ['e4', 'e6', 'd4', 'd5', 'exd5', 'exd5'] },
    { name: 'French Defense, Steinitz Variation', eco: 'C11', moves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6', 'e5', 'Nfd7'] },

    // CARO-KANN
    { name: 'Caro-Kann Defense', eco: 'B10', moves: ['e4', 'c6'] },
    { name: 'Caro-Kann Defense, Classical Variation', eco: 'B18', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'] },
    { name: 'Caro-Kann Defense, Advance Variation', eco: 'B12', moves: ['e4', 'c6', 'd4', 'd5', 'e5'] },
    { name: 'Caro-Kann Defense, Exchange Variation', eco: 'B13', moves: ['e4', 'c6', 'd4', 'd5', 'exd5', 'cxd5'] },
    { name: 'Caro-Kann Defense, Panov Attack', eco: 'B14', moves: ['e4', 'c6', 'd4', 'd5', 'exd5', 'cxd5', 'c4'] },
    { name: 'Caro-Kann Defense, Fantasy Variation', eco: 'B12', moves: ['e4', 'c6', 'd4', 'd5', 'f3'] },
    { name: 'Caro-Kann Defense, Two Knights Variation', eco: 'B11', moves: ['e4', 'c6', 'Nc3', 'd5', 'Nf3'] },
    { name: 'Caro-Kann Defense, Tartakower Variation', eco: 'B15', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Nf6', 'Nxf6+', 'exf6'] },
    { name: 'Caro-Kann Defense, Bronstein-Larsen Variation', eco: 'B16', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Nf6', 'Nxf6+', 'gxf6'] },
    { name: 'Caro-Kann Defense, Gurgenidze System', eco: 'B15', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'g6'] },
    { name: 'Caro-Kann Defense, Hillbilly Attack', eco: 'B10', moves: ['e4', 'c6', 'Bc4', 'd5', 'Bb3'] },

    // ALEKHINE
    { name: 'Alekhine Defense', eco: 'B02', moves: ['e4', 'Nf6'] },
    { name: 'Alekhine Defense, Four Pawns Attack', eco: 'B03', moves: ['e4', 'Nf6', 'e5', 'Nd5', 'd4', 'd6', 'c4', 'Nb6', 'f4'] },
    { name: 'Alekhine Defense, Exchange Variation', eco: 'B03', moves: ['e4', 'Nf6', 'e5', 'Nd5', 'd4', 'd6', 'c4', 'Nb6', 'exd6'] },
    { name: 'Alekhine Defense, Modern Variation', eco: 'B04', moves: ['e4', 'Nf6', 'e5', 'Nd5', 'd4', 'd6', 'Nf3'] },

    // PIRC DEFENSE
    { name: 'Pirc Defense', eco: 'B07', moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6'] },
    { name: 'Pirc Defense, Austrian Attack', eco: 'B09', moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'f4'] },
    { name: 'Pirc Defense, Classical System', eco: 'B08', moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'Nf3', 'Bg7'] },
    { name: 'Pirc Defense, 150 Attack', eco: 'B07', moves: ['e4', 'd6', 'd4', 'Nf6', 'Nc3', 'g6', 'Be3'] },

    // MODERN DEFENSE
    { name: 'Modern Defense', eco: 'B06', moves: ['e4', 'g6'] },
    { name: 'Modern Defense, Gurgenidze Variation', eco: 'B06', moves: ['e4', 'g6', 'd4', 'Bg7', 'Nc3', 'c6'] },
    { name: 'Modern Defense, Tiger Modern', eco: 'B06', moves: ['e4', 'g6', 'd4', 'Bg7', 'Nc3', 'd6', 'Nf3', 'a6'] },

    // SCANDINAVIAN DEFENSE
    { name: 'Scandinavian Defense', eco: 'B01', moves: ['e4', 'd5'] },
    { name: 'Scandinavian Defense, Portuguese Gambit', eco: 'B01', moves: ['e4', 'd5', 'exd5', 'Nf6', 'd4', 'Bg4'] },
    { name: 'Scandinavian Defense, Icelandic Gambit', eco: 'B01', moves: ['e4', 'd5', 'exd5', 'Nf6', 'c4', 'e6'] },
    { name: 'Scandinavian Defense, Modern Scandinavian', eco: 'B01', moves: ['e4', 'd5', 'exd5', 'Nf6'] },

    // DUTCH DEFENSE
    { name: 'Dutch Defense', eco: 'A80', moves: ['d4', 'f5'] },
    { name: 'Dutch Defense, Leningrad Dutch', eco: 'A87', moves: ['d4', 'f5', 'g3', 'Nf6', 'Bg2', 'g6'] },
    { name: 'Dutch Defense, Stonewall Dutch', eco: 'A93', moves: ['d4', 'f5', 'g3', 'Nf6', 'Bg2', 'e6', 'Nf3', 'd5'] },
    { name: 'Dutch Defense, Classical Dutch', eco: 'A92', moves: ['d4', 'f5', 'g3', 'Nf6', 'Bg2', 'e6', 'Nf3', 'Be7'] },
    { name: 'Dutch Defense, Staunton Gambit', eco: 'A82', moves: ['d4', 'f5', 'e4'] },

    // QUEN'S GAMBIT
    { name: "Queen's Gambit", eco: 'D06', moves: ['d4', 'd5', 'c4'] },
    { name: "Queen's Gambit Accepted", eco: 'D20', moves: ['d4', 'd5', 'c4', 'dxc4'] },
    { name: "Queen's Gambit Declined", eco: 'D30', moves: ['d4', 'd5', 'c4', 'e6'] },
    { name: "Queen's Gambit Declined, Orthodox Defense", eco: 'D60', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'Nbd7'] },
    { name: "Queen's Gambit Declined, Tartakower Defense", eco: 'D58', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'h6', 'Bh4', 'b6'] },
    { name: "Queen's Gambit Declined, Lasker Defense", eco: 'D56', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Be7', 'e3', 'O-O', 'Nf3', 'h6', 'Bh4', 'Ne4'] },
    { name: "Queen's Gambit Declined, Cambridge Springs Defense", eco: 'D52', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Nbd7', 'e3', 'c6', 'Nf3', 'Qa5'] },
    { name: "Queen's Gambit Declined, Semi-Tarrasch Defense", eco: 'D41', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Nf3', 'c5'] },
    { name: "Queen's Gambit Declined, Tarrasch Defense", eco: 'D32', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'c5'] },
    { name: "Queen's Gambit Declined, Ragozin Variation", eco: 'D38', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Nf3', 'Bb4'] },
    { name: "Queen's Gambit Declined, Vienna Variation", eco: 'D39', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Nf3', 'Bb4', 'Bg5', 'dxc4'] },
    { name: "Queen's Gambit Declined, Harrwitz Attack", eco: 'D37', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Nf3', 'Be7', 'Bf4'] },

    // SLAV DEFENSE
    { name: 'Slav Defense', eco: 'D10', moves: ['d4', 'd5', 'c4', 'c6'] },
    { name: 'Slav Defense, Semi-Slav Variation', eco: 'D43', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Nf3', 'c6'] },
    { name: 'Slav Defense, Semi-Slav, Meran Variation', eco: 'D48', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Nf3', 'c6', 'e3', 'Nbd7', 'Bd3', 'dxc4', 'Bxc4'] },
    { name: 'Slav Defense, Semi-Slav, Botvinnik System', eco: 'D44', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Nf3', 'c6', 'Bg5', 'dxc4', 'e4', 'b5', 'e5', 'h6', 'Bh4', 'g5', 'Nxg5', 'hxg5', 'Bxg5'] },
    { name: 'Slav Defense, Semi-Slav, Moscow Variation', eco: 'D43', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Nf3', 'c6', 'Bg5', 'h6'] },
    { name: 'Slav Defense, Chebanenko Variation', eco: 'D15', moves: ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'a6'] },
    { name: 'Slav Defense, Schlechter Variation', eco: 'D10', moves: ['d4', 'd5', 'c4', 'c6', 'Nf3', 'Nf6', 'Nc3', 'g6'] },

    // KING'S INDIAN
    { name: "King's Indian Defense", eco: 'E60', moves: ['d4', 'Nf6', 'c4', 'g6'] },
    { name: "King's Indian Defense, Classical Variation", eco: 'E91', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5'] },
    { name: "King's Indian Defense, Classical, Mar del Plata Variation", eco: 'E97', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'O-O', 'Nc6', 'd5', 'Ne7'] },
    { name: "King's Indian Defense, Saemisch Variation", eco: 'E81', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'f3'] },
    { name: "King's Indian Defense, Four Pawns Attack", eco: 'E76', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'f4'] },
    { name: "King's Indian Defense, Fianchetto Variation", eco: 'E67', moves: ['d4', 'Nf6', 'c4', 'g6', 'g3', 'Bg7', 'Bg2', 'O-O', 'Nf3', 'd6'] },
    { name: "King's Indian Defense, Averbakh Variation", eco: 'E73', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Be2', 'O-O', 'Bg5'] },
    { name: "King's Indian Defense, Petrosian System", eco: 'E92', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7', 'e4', 'd6', 'Nf3', 'O-O', 'Be2', 'e5', 'd5'] },

    // Grünfeld Defense
    { name: 'Grünfeld Defense', eco: 'D80', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5'] },
    { name: 'Grünfeld Defense, Russian System', eco: 'D96', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5', 'Nf3', 'Bg7', 'Qb3'] },
    { name: 'Grünfeld Defense, Exchange Variation', eco: 'D85', moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5', 'cxd5', 'Nxd5', 'e4'] },
    { name: 'Grünfeld Defense, Fianchetto Variation', eco: 'D71', moves: ['d4', 'Nf6', 'c4', 'g6', 'g3', 'Bg7', 'Bg2', 'd5'] },

    // QUEEN's INDIAN DEFENSE
    { name: "Queen's Indian Defense", eco: 'E12', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6'] },
    { name: "Queen's Indian Defense, Fianchetto Variation", eco: 'E15', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6', 'g3'] },
    { name: "Queen's Indian Defense, Nimzowitsch Variation", eco: 'E15', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6', 'g3', 'Bb7'] },
    { name: "Queen's Indian Defense, Kasparov Variation", eco: 'E12', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6', 'Nc3', 'Bb7', 'a3'] },
    { name: "Queen's Indian Defense, Petrosian Variation", eco: 'E12', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6', 'a3'] },
    { name: "Queen's Indian Defense, Miles Variation", eco: 'E12', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'b6', 'Bf4'] },

    // Bogo-Indian Defense
    { name: 'Bogo-Indian Defense', eco: 'E11', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'Bb4+'] },
    { name: 'Bogo-Indian Defense, Nimzowitsch Variation', eco: 'E11', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'Bb4+', 'Bd2', 'Qe7'] },
    { name: 'Bogo-Indian Defense, Wade-Smyslov Variation', eco: 'E11', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'Bb4+', 'Bd2', 'a5'] },
    { name: 'Bogo-Indian Defense, Grünfeld Variation', eco: 'E11', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'Bb4+', 'Nbd2'] },
    { name: 'Bogo-Indian Defense, Reti Variation', eco: 'E11', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nf3', 'Bb4+', 'Nbd2', 'b6'] },

    // BENONI
    { name: 'Benoni Defense', eco: 'A43', moves: ['d4', 'c5'] },
    { name: 'Modern Benoni', eco: 'A60', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5'] },
    { name: 'Modern Benoni, Classical Variation', eco: 'A70', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'e6', 'Nc3', 'exd5', 'cxd5', 'd6', 'e4', 'g6', 'Nf3', 'Bg7'] },
    { name: 'Modern Benoni, Four Pawns Attack', eco: 'A68', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'e6', 'Nc3', 'exd5', 'cxd5', 'd6', 'e4', 'g6', 'f4', 'Bg7'] },
    { name: 'Modern Benoni, Fianchetto Variation', eco: 'A62', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'e6', 'Nc3', 'exd5', 'cxd5', 'd6', 'Nf3', 'g6', 'g3', 'Bg7'] },
    { name: 'Czech Benoni', eco: 'A56', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'e5'] },
    { name: 'Benoni Defense, Schmid Benoni', eco: 'A43', moves: ['d4', 'c5', 'd5', 'd6', 'e4', 'Nf6'] },

    // ENGLISH OPENING
    { name: 'English Opening', eco: 'A10', moves: ['c4'] },
    { name: "English Opening, King's English Variation", eco: 'A20', moves: ['c4', 'e5'] },
    { name: "English Opening, King's English, Four Knights Variation", eco: 'A28', moves: ['c4', 'e5', 'Nc3', 'Nf6', 'Nf3', 'Nc6'] },
    { name: 'English Opening, Symmetrical Variation', eco: 'A30', moves: ['c4', 'c5'] },
    { name: 'English Opening, Symmetrical, Anti-Benoni Variation', eco: 'A31', moves: ['c4', 'c5', 'Nf3', 'Nf6', 'd4'] },
    { name: 'English Opening, Anglo-Indian Defense', eco: 'A15', moves: ['c4', 'Nf6'] },
    { name: 'English Opening, Mikenas-Carls Variation', eco: 'A18', moves: ['c4', 'Nf6', 'Nc3', 'e6', 'e4'] },
    { name: 'English Opening, Anglo-Dutch Defense', eco: 'A10', moves: ['c4', 'f5'] },

    // RETI
    { name: 'Reti Opening', eco: 'A04', moves: ['Nf3'] },
    { name: 'Reti Opening, Reti Accepted', eco: 'A09', moves: ['Nf3', 'd5', 'c4', 'dxc4'] },
    { name: 'Reti Opening, Advance Variation', eco: 'A09', moves: ['Nf3', 'd5', 'c4', 'd4'] },
    { name: 'Reti Opening, King\'s Indian Attack', eco: 'A07', moves: ['Nf3', 'd5', 'g3', 'Nf6', 'Bg2', 'g6', 'O-O', 'Bg7', 'd3'] },
    { name: 'Reti Opening, Anglo-Slav Variation', eco: 'A11', moves: ['Nf3', 'd5', 'c4', 'c6'] },
    { name: 'Reti Opening, New York System', eco: 'A06', moves: ['Nf3', 'd5', 'b3', 'Nf6', 'Bb2', 'Bf5'] },

    // CATALAN AND BIRD
    { name: 'Catalan Opening', eco: 'E00', moves: ['d4', 'Nf6', 'c4', 'e6', 'g3'] },
    { name: 'Catalan Opening, Open Variation', eco: 'E04', moves: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'dxc4'] },
    { name: 'Catalan Opening, Closed Variation', eco: 'E06', moves: ['d4', 'Nf6', 'c4', 'e6', 'g3', 'd5', 'Bg2', 'Be7', 'Nf3', 'O-O'] },
    { name: 'Bird Opening', eco: 'A02', moves: ['f4'] },
    { name: "Bird Opening, From's Gambit", eco: 'A02', moves: ['f4', 'e5'] },
    { name: 'Bird Opening, Classical Variation', eco: 'A03', moves: ['f4', 'd5'] },

    // LONDON SYSTEM AND Trompowsky ATTACK
    { name: 'London System', eco: 'D02', moves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4'] },
    { name: 'London System, Accelerated', eco: 'D02', moves: ['d4', 'd5', 'Bf4'] },
    { name: 'Trompowsky Attack', eco: 'A45', moves: ['d4', 'Nf6', 'Bg5'] },
    { name: 'Trompowsky Attack, Main Line', eco: 'A45', moves: ['d4', 'Nf6', 'Bg5', 'Ne4'] },
    { name: 'Trompowsky Attack, Classical Defense', eco: 'A45', moves: ['d4', 'Nf6', 'Bg5', 'e6'] },

    // OTHER
    { name: 'Veresov Attack', eco: 'D01', moves: ['d4', 'd5', 'Nc3', 'Nf6', 'Bg5'] },
    { name: 'Blackmar-Diemer Gambit', eco: 'D00', moves: ['d4', 'd5', 'e4', 'dxe4', 'Nc3', 'Nf6', 'f3'] },
    { name: 'Blackmar-Diemer Gambit, Ziegler Defense', eco: 'D00', moves: ['d4', 'd5', 'e4', 'dxe4', 'Nc3', 'Nf6', 'f3', 'exf3', 'Nxf3', 'c6'] },
    { name: 'Blackmar-Diemer Gambit, Teichmann Defense', eco: 'D00', moves: ['d4', 'd5', 'e4', 'dxe4', 'Nc3', 'Nf6', 'f3', 'exf3', 'Nxf3', 'Bg4'] },
    { name: 'Benko Gambit', eco: 'A57', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'b5'] },
    { name: 'Benko Gambit Accepted', eco: 'A57', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'b5', 'cxb5', 'a6'] },
    { name: 'Benko Gambit, King Walk Variation', eco: 'A59', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'b5', 'cxb5', 'a6', 'bxa6', 'Bxa6', 'Nc3', 'd6', 'e4', 'Bxf1', 'Kxf1'] },
    { name: 'Benko Gambit Declined', eco: 'A57', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'b5', 'Nf3'] },

    { name: 'Budapest Gambit', eco: 'A51', moves: ['d4', 'Nf6', 'c4', 'e5'] },
    { name: 'Budapest Gambit, Rubinstein Variation', eco: 'A52', moves: ['d4', 'Nf6', 'c4', 'e5', 'dxe5', 'Ng4', 'Bf4'] },
    { name: 'Budapest Gambit, Adler Variation', eco: 'A52', moves: ['d4', 'Nf6', 'c4', 'e5', 'dxe5', 'Ng4', 'Nf3'] },
    { name: 'Budapest Gambit, Fajarowicz Variation', eco: 'A51', moves: ['d4', 'Nf6', 'c4', 'e5', 'dxe5', 'Ne4'] },
    { name: 'Latvian Gambit', eco: 'C40', moves: ['e4', 'e5', 'Nf3', 'f5'] },
    { name: 'Latvian Gambit, Main Line', eco: 'C40', moves: ['e4', 'e5', 'Nf3', 'f5', 'Nxe5', 'Qf6'] },
    { name: 'Latvian Gambit, Fraser Variation', eco: 'C40', moves: ['e4', 'e5', 'Nf3', 'f5', 'Nxe5', 'Nc6'] },
    { name: 'Latvian Gambit, Nimzowitsch Variation', eco: 'C40', moves: ['e4', 'e5', 'Nf3', 'f5', 'd4'] },
    { name: 'Elephant Gambit', eco: 'C40', moves: ['e4', 'e5', 'Nf3', 'd5'] },
    { name: 'Elephant Gambit, Paulsen Countergambit', eco: 'C40', moves: ['e4', 'e5', 'Nf3', 'd5', 'exd5', 'e4'] },
    { name: 'Elephant Gambit, Maróczy Gambit', eco: 'C40', moves: ['e4', 'e5', 'Nf3', 'd5', 'exd5', 'Bd6'] },
    // PHILIDOR DEFENSE
    { name: 'Philidor Defense', eco: 'C41', moves: ['e4', 'e5', 'Nf3', 'd6'] },
    { name: 'Philidor Defense, Exchange Variation', eco: 'C41', moves: ['e4', 'e5', 'Nf3', 'd6', 'd4', 'exd4'] },
    { name: 'Philidor Defense, Hanham Variation', eco: 'C41', moves: ['e4', 'e5', 'Nf3', 'd6', 'd4', 'Nd7'] },
    { name: 'Philidor Defense, Nimzowitsch Variation', eco: 'C41', moves: ['e4', 'e5', 'Nf3', 'd6', 'd4', 'Nf6'] },

    // PETROFF DEFENSE
    { name: 'Petroff Defense', eco: 'C42', moves: ['e4', 'e5', 'Nf3', 'Nf6'] },
    { name: 'Petroff Defense, Classical Attack', eco: 'C42', moves: ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'd6', 'Nf3', 'Nxe4', 'd4'] },
    { name: 'Petroff Defense, Steinitz Attack', eco: 'C43', moves: ['e4', 'e5', 'Nf3', 'Nf6', 'd4'] },
    { name: 'Petroff Defense, Three Knights Variation', eco: 'C42', moves: ['e4', 'e5', 'Nf3', 'Nf6', 'Nc3'] },
    { name: 'Petroff Defense, Cochrane Gambit', eco: 'C42', moves: ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'd6', 'Nxf7'] },

    // VIENNA / TRANSPOSED SYSTEMS
    { name: 'Vienna Game', eco: 'C25', moves: ['e4', 'e5', 'Nc3'] },
    { name: 'Vienna Gambit', eco: 'C29', moves: ['e4', 'e5', 'Nc3', 'Nf6', 'f4'] },
    { name: 'Vienna Game, Frankenstein-Dracula Variation', eco: 'C27', moves: ['e4', 'e5', 'Nc3', 'Nf6', 'Bc4', 'Nxe4'] },
    { name: 'Vienna Game, Mieses Variation', eco: 'C26', moves: ['e4', 'e5', 'Nc3', 'Nf6', 'g3'] },
    { name: 'Vienna Game, Max Lange Defense', eco: 'C25', moves: ['e4', 'e5', 'Nc3', 'Nc6'] },

    // HYPERMODERN OPENINGS
    { name: 'Nimzo-Indian Defense', eco: 'E20', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'] },
    { name: 'Nimzo-Indian Defense, Classical Variation', eco: 'E32', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'Qc2'] },
    { name: 'Nimzo-Indian Defense, Rubinstein System', eco: 'E40', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'e3'] },
    { name: 'Nimzo-Indian Defense, Sämisch Variation', eco: 'E24', moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4', 'a3'] },
    { name: 'Nimzowitsch Defense', eco: 'B00', moves: ['e4', 'Nc6'] },
    { name: 'Nimzo-Larsen Attack', eco: 'A01', moves: ['b3'] },
    { name: "King's Indian Attack", eco: 'A07', moves: ['Nf3', 'd5', 'g3'] },

    { name: 'Evans Gambit', eco: 'C51', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5', 'b4'] },
    { name: 'Danish Gambit', eco: 'C21', moves: ['e4', 'e5', 'd4', 'exd4', 'c3'] },
    { name: 'Sicilian Defense, Smith-Morra Gambit', eco: 'B21', moves: ['e4', 'c5', 'd4', 'cxd4', 'c3'] },
    { name: 'Benko Gambit', eco: 'A57', moves: ['d4', 'Nf6', 'c4', 'c5', 'd5', 'b5'] },
    { name: 'Budapest Gambit', eco: 'A51', moves: ['d4', 'Nf6', 'c4', 'e5'] },
    { name: 'Blackmar-Diemer Gambit', eco: 'D00', moves: ['d4', 'd5', 'e4'] },
    { name: 'Four Knights Game, Halloween Gambit', eco: 'C47', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Nc3', 'Nf6', 'Nxe5'] },
    { name: 'Petroff Defense, Stafford Gambit', eco: 'C42', moves: ['e4', 'e5', 'Nf3', 'Nf6', 'Nxe5', 'Nc6'] },

    { name: "Italian Game, Légal's Mate Trap", eco: 'C50', moves: ['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'g6', 'Nxe5'] },
    { name: 'Italian Game, Blackburne Shilling Gambit', eco: 'C50', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nd4'] },
    { name: "Queen's Gambit Declined, Elephant Trap", eco: 'D30', moves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Nbd7', 'cxd5', 'exd5', 'Nxd5'] },
    { name: 'Albin Countergambit, Lasker Trap', eco: 'D08', moves: ['d4', 'd5', 'c4', 'e5', 'dxe5', 'd4', 'e3', 'Bb4+', 'Bd2', 'dxe3'] },
    { name: "Ruy Lopez, Noah's Ark Trap", eco: 'C71', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'd6', 'd4', 'b5', 'Bb3', 'Nxd4'] },
    { name: 'Budapest Gambit, Kieninger Trap', eco: 'A52', moves: ['d4', 'Nf6', 'c4', 'e5', 'dxe5', 'Ng4', 'Bf4', 'Nc6', 'Nf3', 'Bb4+', 'Nbd2', 'Qe7', 'a3', 'Ngxe5'] },
    { name: 'Sicilian Defense, Siberian Trap', eco: 'B21', moves: ['e4', 'c5', 'd4', 'cxd4', 'c3', 'dxc3', 'Nxc3', 'Nc6', 'Nf3', 'e6', 'Bc4', 'Qc7', 'O-O', 'Nf6', 'Qe2', 'Ng4'] },
    { name: 'Englund Gambit Trap', eco: 'A40', moves: ['d4', 'e5', 'dxe5', 'Nc6', 'Nf3', 'Qe7', 'Bf4', 'Qb4+', 'Bd2', 'Qxb2', 'Bc3', 'Bb4'] },
    { name: 'Ruy Lopez, Fishing Pole Trap', eco: 'C65', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6', 'O-O', 'Ng4', 'h3', 'h5'] },
    { name: 'Caro-Kann Defense, Rubinstein Trap', eco: 'B17', moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Nd7', 'Bc4', 'Ngf6', 'Ng5', 'e6', 'Qe2', 'Nb6', 'Bd3', 'h6', 'N5f3', 'c5', 'dxc5', 'Bxc5', 'Ne5', 'Nbd7', 'Ngf3', 'Qc7', 'Bf4', 'Bb4+'] },
    { name: 'Ruy Lopez, Mortimer Trap', eco: 'C65', moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6', 'd3', 'Ne7'] },
    { name: 'Vienna Game, Würzburger Trap', eco: 'C27', moves: ['e4', 'e5', 'Nc3', 'Nf6', 'f4', 'd5', 'fxe5', 'Nxe4', 'd3', 'Qh4+', 'g3', 'Nxg3', 'Nf3', 'Qh5', 'Nxd5'] },
    { name: 'Sicilian Defense, Magnus Smith Trap', eco: 'B32', moves: ['e4', 'c5', 'Nf3', 'Nc6', 'd4', 'cxd4', 'Nxd4', 'd6', 'Nc3', 'g6', 'Be3', 'Bg7', 'Bc4', 'Nf6', 'f3', 'Qb6'] }
];

// --- CORE UTILITIES AND HELPERS ---

function normalizeSanForCompare(move) {
    return normalizeMove(move)?.replace(/[+#?!]+$/g, '').replace(/\s+/g, '') || '';
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
        return normalizedMoves.every((move, index) => normalizeSanForCompare(line.moves[index]) === move);
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
            const previousMatches = previousMoves.every((move, index) => normalizeSanForCompare(line.moves[index]) === move);
            const expectedMove = normalizeSanForCompare(line.moves[moves.length - 1]);
            return previousMatches && expectedMove && expectedMove !== lastMove;
        });

        if (deviatedLines.length) {
            const expectedMoves = [...new Set(deviatedLines.map(line => line.moves[moves.length - 1]).filter(Boolean))];
            return {
                status: 'deviated',
                name: deviatedLines[0].name,
                bestMove: null,
                expectedMoves,
                actualMove: moves[moves.length - 1],
                message: `Opening ended: opponent deviated from ${deviatedLines[0].name}. Expected: ${expectedMoves.join(' or ')}. Switching back to Stockfish.`
            };
        }
    }

    return { status: 'unknown', bestMove: null, message: 'No matching opening book line. Using Stockfish best move.' };
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
            
            // Allow multiple variations to pick intentionally worse moves
            sf.postMessage('setoption name MultiPV value 10');
            return sf;
        });

    return stockfishReadyPromise;
}

function getBoardElement() {
    return (
        document.querySelector('wc-chess-board#board-play-computer') ||
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
    const add = sq => { if (sq) result.add(sq); };

    if (piece.type === 'p') {
        const direction = piece.color === 'w' ? 1 : -1;
        add(coordToSquare(file - 1, rank + direction));
        add(coordToSquare(file + 1, rank + direction));
        return result;
    }

    if (piece.type === 'n') {
        [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]
            .forEach(([df, dr]) => add(coordToSquare(file + df, rank + dr)));
        return result;
    }

    if (piece.type === 'k') {
        [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]]
            .forEach(([df, dr]) => add(coordToSquare(file + df, rank + dr)));
        return result;
    }

    const directions = [];
    if (piece.type === 'b' || piece.type === 'q') directions.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    if (piece.type === 'r' || piece.type === 'q') directions.push([1, 0], [-1, 0], [0, 1], [0, -1]);

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
        .filter(([fromSquare, piece]) => getControlledSquaresByPiece(fromSquare, piece, boardMap).has(square))
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
            if (result) verboseMoves.push(result);
        } catch (err) {
            console.warn('Invalid move skipped:', move);
        }
    });

    return { game, moves, verboseMoves };
}

function getFenBeforeLastMove(moves) {
    const game = new Chess();
    moves.slice(0, -1).forEach(move => {
        try { game.move(normalizeMove(move), { sloppy: true }); } 
        catch (err) { console.warn('Invalid move skipped:', move); }
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
        let candidateMoves = [];
        let bestMove = null;

        sf.onmessage = event => {
            const line = event.data;
            
            // Parse MultiPV lines
            const infoMatch = line.match(/multipv (\d+).*score (cp|mate) (-?\d+).* pv (\S+)/);
            if (infoMatch) {
                const index = Number(infoMatch[1]) - 1;
                candidateMoves[index] = {
                    move: infoMatch[4],
                    score: { type: infoMatch[2], value: Number(infoMatch[3]) }
                };
            }

            if (line.startsWith('bestmove')) {
                const match = line.match(/^bestmove\s+(\S+)/);
                bestMove = match?.[1] || null;
                
                // Fallback in case MultiPV parsing failed
                if (candidateMoves.length === 0 && bestMove) {
                    candidateMoves.push({ move: bestMove, score: { type: 'cp', value: 0 } });
                }
                
                resolve({ 
                    bestMove, 
                    candidateMoves: candidateMoves.filter(Boolean) 
                });
            }
        };

        sf.postMessage('stop');
        sf.postMessage('ucinewgame');
        sf.postMessage(`position fen ${fen}`);
        sf.postMessage(`go depth ${depth}`);
    });
}

// Ensure the UI never classifies anything as a "blunder" 
// Drops >= 1.5 are maxed out at "mistake"
function classifyMoveDrop(drop) {
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
        svg.style.display = 'none';

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
            <marker id="${id}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L9,3 z" fill="${color}" />
            </marker>
        </defs>
        <line x1="${from.centerX}" y1="${from.centerY}" x2="${to.centerX}" y2="${to.centerY}" stroke="${color}" stroke-width="8" stroke-linecap="round" marker-end="url(#${id})" opacity="0.75" />
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
        const fill = item.severity === 'red' ? 'rgba(255, 0, 0, 0.38)' : 'rgba(255, 165, 0, 0.35)';
        const stroke = item.severity === 'red' ? 'rgba(255, 0, 0, 0.95)' : 'rgba(255, 140, 0, 0.95)';
        return `
            <rect x="${pos.x + 4}" y="${pos.y + 4}" width="${pos.size - 8}" height="${pos.size - 8}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="4" />
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
        const color = extra.moveQuality === 'mistake' ? 'rgba(255, 120, 0, 0.95)' : 'rgba(255, 200, 0, 0.95)';
        arrows += drawArrow(from, to, color, 'last-move-arrow');
    }

    svg.innerHTML = threatRects + arrows;
    board.appendChild(svg);
    showAnalysisBanner({ ...extra, threats });
}

function showAnalysisBanner(data) {
    document.getElementById('board-analysis-banner')?.remove();

    const banner = document.createElement('div');
    banner.id = 'board-analysis-banner';
    banner.style.position = 'fixed';
            banner.style.display = 'none';

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

    const qualityText = data.moveQuality ? `Last move: ${data.moveQuality.toUpperCase()} | Eval drop: ${(data.evalDrop || 0).toFixed(2)}` : 'Last move: OK';
    const bestMoveLabel = data.bestMoveSource === 'opening' ? `Opening move: ${data.bestMove || '-'}${data.openingInfo?.nextMoveSan ? ` (${data.openingInfo.nextMoveSan})` : ''}` : `Stockfish best: ${data.bestMove || '-'}`;
    
    const openingColor = data.openingInfo?.status === 'active' ? 'blue' : data.openingInfo?.status === 'deviated' ? 'red' : data.openingInfo?.status === 'completed' ? 'purple' : '#666';

    banner.innerHTML = `
        <span style="color:red;">Red danger: ${redCount}</span> &nbsp; | &nbsp;
        <span style="color:orange;">Attacked but defended: ${orangeCount}</span> &nbsp; | &nbsp;
        <span style="color:green;">${bestMoveLabel}</span>
        ${data.bestMoveSource === 'opening' && data.stockfishBestMove ? `&nbsp; | &nbsp;<span style="color:#666;">Engine wanted: ${data.stockfishBestMove}</span>` : ''}
        &nbsp; | &nbsp; <span style="color:${openingColor};">${data.openingInfo?.message || ''}</span>
        &nbsp; | &nbsp; <span>${qualityText}</span>
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

    if (!attackers.length) return { isDangerous: false, isWarning: false };

    const cheapestAttacker = Math.min(...attackers.map(a => a.value));
    const movedPieceValue = PIECE_VALUE[movedPiece.type];

    const isDangerous = defenders.length === 0 || cheapestAttacker < movedPieceValue;
    return { isDangerous, isWarning: !isDangerous, attackers, defenders };
}

function drawLegalMoveDot(square, boardRect, isFlipped) {
    const pos = getSquarePosition(square, boardRect, isFlipped);
    return `<circle cx="${pos.centerX}" cy="${pos.centerY}" r="${pos.size * 0.13}" fill="rgba(0, 180, 0, 0.35)" />`;
}

function drawDangerDot(square, boardRect, isFlipped) {
    const pos = getSquarePosition(square, boardRect, isFlipped);
    const dotSize = pos.size * 0.18;
    return `<circle cx="${pos.x + dotSize}" cy="${pos.y + dotSize}" r="${dotSize / 2}" fill="rgba(255, 0, 0, 0.95)" stroke="white" stroke-width="2" />`;
}

function drawWarningDot(square, boardRect, isFlipped) {
    const pos = getSquarePosition(square, boardRect, isFlipped);
    const dotSize = pos.size * 0.18;
    return `<circle cx="${pos.x + pos.size - dotSize}" cy="${pos.y + dotSize}" r="${dotSize / 2}" fill="rgba(255, 165, 0, 0.95)" stroke="white" stroke-width="2" />`;
}

function renderPossibleMoveDangerOverlay(fromSquare) {
    clearMoveDangerOverlay();
    const board = getBoardElement();
    if (!board) return;

    const { game } = createGameFromCurrentMoves();
    const legalMoves = game.moves({ square: fromSquare, verbose: true });
    if (!legalMoves.length) return;

    const { boardRect, isFlipped } = getBoardMeta(board);
    const svg = createSvg(board, boardRect, 'move-danger-svg');
    svg.style.zIndex = '1000';

    const legalDots = legalMoves.map(move => drawLegalMoveDot(move.to, boardRect, isFlipped)).join('');
    const dangerDots = legalMoves.map(move => isDangerousPossibleMove(game, move)?.isDangerous ? drawDangerDot(move.to, boardRect, isFlipped) : '').join('');
    const warningDots = legalMoves.map(move => isDangerousPossibleMove(game, move)?.isWarning ? drawWarningDot(move.to, boardRect, isFlipped) : '').join('');

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
    if (isFlipped) { col = 7 - col; row = 7 - row; }
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

function uciToSquareClass(sq) {
    if (/^\d{2}$/.test(sq)) return `square-${sq}`;
    if (/^[a-h][1-8]$/.test(sq)) {
        return `square-${sq.charCodeAt(0) - 96}${sq[1]}`;
    }
    return '';
}

async function chessMove(from, to) {
    const board = getBoardElement();
    if (!board) return console.error("Board not found to execute move");

    const fromClass = uciToSquareClass(from);
    const toClass = uciToSquareClass(to);

    const piece = board.querySelector(`.piece.${fromClass}`);
    if (!piece) return console.error(`Failed to find piece at starting square: ${from} (${fromClass})`);

    const simulateClick = (x, y) => {
        const eventOptions = { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y, buttons: 1, pointerId: 1, isPrimary: true };
        board.dispatchEvent(new PointerEvent('pointerdown', eventOptions));
        board.dispatchEvent(new PointerEvent('pointerup', eventOptions));
        board.dispatchEvent(new MouseEvent('mousedown', eventOptions));
        board.dispatchEvent(new MouseEvent('mouseup', eventOptions));
        board.dispatchEvent(new MouseEvent('click', eventOptions));
    };

    const pRect = piece.getBoundingClientRect();
    simulateClick(pRect.left + pRect.width / 2, pRect.top + pRect.height / 2);

    await new Promise(r => setTimeout(r, 75));

    const hint = board.querySelector(`.hint.${toClass}`);
    if (hint) {
        const hRect = hint.getBoundingClientRect();
        simulateClick(hRect.left + hRect.width / 2, hRect.top + hRect.height / 2);
    } else {
        const { boardRect, isFlipped } = getBoardMeta(board);
        let algTo = to;
        if (/^\d{2}$/.test(to)) algTo = String.fromCharCode(parseInt(to[0]) + 96) + to[1];

        const targetPos = getSquarePosition(algTo, boardRect, isFlipped);
        if (targetPos) {
            simulateClick(boardRect.left + targetPos.centerX, boardRect.top + targetPos.centerY);
        } else {
            console.error("Could not compute fallback target coordinates.");
        }
    }
    
    console.log(`🤖 Automated Move: ${from} -> ${to}`);
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
    const displayBestMove = openingInfo.status === 'active' && openingInfo.bestMove ? openingInfo.bestMove : afterEval.bestMove;

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
    const lastMove = lastVerboseMove ? `${lastVerboseMove.from}${lastVerboseMove.to}${lastVerboseMove.promotion || ''}` : null;

    renderThreatOverlay(game, {
        bestMove: displayBestMove,
        bestMoveSource: openingInfo.status === 'active' && openingInfo.bestMove ? 'opening' : 'stockfish',
        stockfishBestMove: afterEval.bestMove,
        openingInfo,
        lastMove,
        moveQuality,
        evalDrop
    });

    // ----------------------------------------------------
    // AUTOMATION HOOK: Humanized Random Moves
    // ----------------------------------------------------
    if (AUTO_MOVE_ENABLED && displayBestMove) {
        const board = getBoardElement();
        const myColor = getBoardMeta(board).isFlipped ? 'b' : 'w';
        
        if (game.turn() === myColor) {
            let finalMoveToPlay = displayBestMove;
            
            // ROLL A NEW DELAY FOR THIS SPECIFIC MOVE
            // This instantly cascades down to update all the botSettings limits!
            currentDelay = CUSTOM_DELAY ?? getRandomDelay();
            
            // Only consider sub-optimal moves if we have left the opening book and have candidate variations
            if (openingInfo.status !== 'active' && afterEval.candidateMoves.length > 1) {
                const roll = Math.random();
                let targetMinDrop = 0, targetMaxDrop = 0;
                let moveType = null;
                
                if (currentMistakes < botSettings.MAX_MISTAKES_PER_GAME && roll < botSettings.CHANCE_MISTAKE) {
                    targetMinDrop = 150; 
                    targetMaxDrop = 300; // Hard limit at 300 centipawns so it does not blunder
                    moveType = 'mistake';
                } else if (currentInaccuracies < botSettings.MAX_INACCURACIES_PER_GAME && roll < (botSettings.CHANCE_MISTAKE + botSettings.CHANCE_INACCURACY)) {
                    targetMinDrop = 70; 
                    targetMaxDrop = 150;
                    moveType = 'inaccuracy';
                }

                if (moveType) {
                    // Score is relative to engine evaluation player (positive = winning)
                    const topScore = afterEval.candidateMoves[0].score;
                    const bestCp = topScore.type === 'mate' ? Math.sign(topScore.value) * 10000 : topScore.value;
                    
                    // Shuffle variations so the opponent can't predict the exact sub-optimal move pattern
                    const shuffledCandidates = [...afterEval.candidateMoves.slice(1)].sort(() => Math.random() - 0.5);

                    for (const candidate of shuffledCandidates) {
                        if (!candidate || !candidate.score) continue;
                        const candidateCp = candidate.score.type === 'mate' ? Math.sign(candidate.score.value) * 10000 : candidate.score.value;
                        const drop = bestCp - candidateCp; // Compute the centipawn drop
                        
                        // Select the move if it falls perfectly inside our target threshold
                        if (drop >= targetMinDrop && drop <= targetMaxDrop) {
                            finalMoveToPlay = candidate.move;
                            if (moveType === 'mistake') currentMistakes++;
                            if (moveType === 'inaccuracy') currentInaccuracies++;
                            
                            // Using our new dynamic settings for the console log readout
                            console.log(`🤖 Playing intentional ${moveType}! Eval drop: ${drop / 100} (${currentMistakes}/${botSettings.MAX_MISTAKES_PER_GAME} mistakes, ${currentInaccuracies}/${botSettings.MAX_INACCURACIES_PER_GAME} inaccuracies used)`);
                            break;
                        }
                    }
                }
            }

            const moveFrom = finalMoveToPlay.slice(0, 2);
            const moveTo = finalMoveToPlay.slice(2, 4);
            
            setTimeout(() => {
                chessMove(moveFrom, moveTo);
            }, currentDelay); // We pass the newly generated delay right here
        }
    }
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
            const currentMoves = getMovesFromHTML();
            const currentMoveString = currentMoves.join(' ');
            
            // Detect if a new game has started (or a new setup) to reset counts
            if (currentMoves.length < previousMovesCount || currentMoves.length === 0) {
                currentMistakes = 0;
                currentInaccuracies = 0;
                console.log("🔄 New game detected, resetting inaccuracies and mistakes counters.");
            }
            previousMovesCount = currentMoves.length;

            if (currentMoveString !== lastMoveString) {
                lastMoveString = currentMoveString;
                clearMoveDangerOverlay();
                analyzePosition();
            }
        }, 500);
    });

    observer.observe(targetNode, { childList: true, subtree: true });
}

async function runChessBoardAnalyzer() {
    await waitForChessJs();

    bindPossibleMoveDangerHover();
    startObserving();
    analyzePosition();

    console.log('Chess board analyzer started with dynamic humanized randomization');
}

runChessBoardAnalyzer();
