const board = document.getElementById('board');
const squares = document.getElementsByClassName('square');
const endMessage = document.getElementById('message');
const tips = document.getElementById('tips');
const connectButton = document.getElementById("connectButton")

const players = ['❌', '🟢'];
const score = {
    [players[0]]: 0,
    [players[1]]: 0
}
const playerStep = {
    [players[0]]: [],
    [players[1]]: []
}
let currentPlayer = players[0];
let selfPlayer = players[0];
let firstInit = false;

let peer = null;
let conn = null;

const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

for (let i = 0; i < squares.length; i++) {
    squares[i].addEventListener('click', function () {
        if (squares[i].textContent === '') {
            if (conn && conn.open) {
                if (selfPlayer !== currentPlayer && !firstInit) {
                    return;
                }
            }
            firstInit = false;
            squares[i].textContent = currentPlayer;
            playerStep[currentPlayer].push(i);
            if (playerStep[currentPlayer].length > 3) {
                const remove = squares[playerStep[currentPlayer].shift()]
                remove.classList.remove('next-remove');
                remove.textContent = '';
            }
            if (playerStep[currentPlayer].length === 3) {
                console.log(playerStep[currentPlayer]);
                const nextRemove = playerStep[currentPlayer][0]
                squares[nextRemove].classList.add('next-remove');
            }
            if (checkWin(currentPlayer)) {
                endMessage.textContent = `${currentPlayer} 赢了!`;
                score[currentPlayer] = score[currentPlayer] ? score[currentPlayer] + 1 : 1;
                tips.textContent = `❌${score[players[0]]} : ${score[players[1]]} 🟢`;
                disableBoard();
            } else {
                currentPlayer = currentPlayer === players[0] ? players[1] : players[0];
                endMessage.textContent = `${currentPlayer}的回合!`;
            }
            sendCurrentState();
        }
    });
}

function checkWin(player) {
    for (let i = 0; i < winningCombinations.length; i++) {
        const combination = winningCombinations[i];
        if (combination.every(index => squares[index].textContent === player)) {
            for (let i = 0; i < squares.length; i++) {
                squares[i].classList.remove('next-remove');
            }
            for (let j = 0; j < combination.length; j++) {
                squares[combination[j]].classList.add('win-square');
            }

            return true;
        }
    }
    return false;
}

function disableBoard() {
    for (let i = 0; i < squares.length; i++) {
        squares[i].style.pointerEvents = 'none';
    }
}

function restartGame() {
    for (let i = 0; i < squares.length; i++) {
        squares[i].textContent = '';
        squares[i].classList.remove('next-remove');
        squares[i].classList.remove('win-square')
        squares[i].style.pointerEvents = 'auto';
    }
    playerStep[players[0]] = [];
    playerStep[players[1]] = [];
    // 输的玩家先手
    currentPlayer = currentPlayer === players[0] ? players[1] : players[0];
    endMessage.textContent = `${currentPlayer}的回合!`;
}

function genPeerId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function startConnect() {
    peer = new Peer(genPeerId());
    peer.on('open', function (id) {
        document.getElementById('peerIdInput').value = id;
        connectButton.disabled = false;
        connectButton.classList.remove('disabled');
        connectButton.classList.add('enabled');
        connectButton.innerHTML = '连接';
        firstInit = true;
    });
    peer.on('connection', (connection) => {
        console.log('Connected to: ' + connection.peer);
        conn = connection;
        setupConnectionHandlers(conn);
    });
}


function setupConnectionHandlers(con) {
    con.on('data', function (data) {
        console.log('Received', data);
        for (let i = 0; i < squares.length; i++) {
            squares[i].textContent = data.board[i];
        }
        currentPlayer = data.currentPlayer;
        playerStep[players[0]] = data.playerStep[players[0]];
        playerStep[players[1]] = data.playerStep[players[1]];
        score[players[0]] = data.score[players[0]];
        score[players[1]] = data.score[players[1]];
        tips.textContent = `❌${score[players[0]]} : ${score[players[1]]} 🟢`;
        selfPlayer = data.selfPlayer === players[0] ? players[1] : players[0];
        endMessage.textContent = `${currentPlayer}的回合!`;
    });
    showGameSection();
    restartGame();
}

function sendCurrentState() {
    if (conn && conn.open) {
        conn.send({
            board: Array.from(squares).map(square => square.textContent),
            currentPlayer: currentPlayer,
            selfPlayer: selfPlayer,
            playerStep: playerStep,
            score: score
        });
    }
}

function showConnectSection() {
    document.getElementById('singleSection').style.display = 'none';
    document.getElementById('connectSection').style.display = 'block';
    document.getElementById('gameMode').style.display = 'none';
}

function showGameSection() {
    document.getElementById('singleSection').style.display = 'block';
    document.getElementById('connectSection').style.display = 'none';
    document.getElementById('gameMode').style.display = 'none';
}


document.getElementById('singlePlayerButton').addEventListener('click', function () {
    showGameSection();
    restartGame();
});

document.getElementById('multiPlayerButton').addEventListener('click', function () {
    showConnectSection();
    startConnect();
});

connectButton.addEventListener('click', function () {
    const peerId = document.getElementById('peerIdInput').value;
    conn = peer.connect(peerId);
    conn.on('open', function () {
        console.log('Connected to: ' + peerId);
        setupConnectionHandlers(conn);
    });
});

disableBoard();