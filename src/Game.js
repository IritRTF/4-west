import Player from './Player.js';
import PlayerView from './PlayerView.js';

const Game = function() {
    function Game(bottomPlayerDeck, topPlayerDeck) {
        this.bottomPlayerStartDeck = bottomPlayerDeck;
        this.topPlayerStartDeck = topPlayerDeck;
    }

    // Подготавливает колоды, создает игроков, запускает игру.
    Game.prototype.play = function (needShuffleDecks, onGameOver) {
        const bottomPlayerDeck = needShuffleDecks
            ? copyAndShuffle(this.bottomPlayerStartDeck)
            : copyAndReverse(this.bottomPlayerStartDeck);

        const topPlayerDeck = needShuffleDecks
            ? copyAndShuffle(this.topPlayerStartDeck)
            : copyAndReverse(this.topPlayerStartDeck);

        const bottomPlayer = new Player(this,
            'Шериф уток', 'sheriff.png',
            bottomPlayerDeck,
            new PlayerView(
                document.getElementById('bottomPlayerRow'),
                document.getElementById('bottomPlayerTable'), true));

        const topPlayer = new Player(this,
            'Главарь псов', 'bandit.png',
            topPlayerDeck,
            new PlayerView(
                document.getElementById('topPlayerRow'),
                document.getElementById('topPlayerTable'), false));

        this.currentPlayer = topPlayer;
        this.oppositePlayer = bottomPlayer;

        playStaged(this, 0, onGameOver);
    };

    // Выполняет действия для некоторой стадии хода.
    // Переход к следующей стадии идет через самовызов в колбэке.
    function playStaged(game, stage, onGameOver) {
        switch (stage) {
            case 0:
                game.currentPlayer.playNewCard(() => playStaged(game, 1, onGameOver));
                break;
            case 1:
                game.currentPlayer.applyCards(() => playStaged(game, 2, onGameOver));
                break;
            case 2:
                game.oppositePlayer.removeDeadAndCompactTable(() => playStaged(game, 3, onGameOver));
                break;
            case 3:
                game.currentPlayer.removeDeadAndCompactTable(() => playStaged(game, 4, onGameOver));
                break;
            case 4:
                const winner = getWinner(game);
                if (winner) {
                    onGameOver(winner);
                    return;
                }
                playStaged(game, 5, onGameOver);
                break;
            case 5:
                changePlayer(game);
                playStaged(game, 0, onGameOver);
                break;
            default:
                break;
        }
    }

    // Предоставляет картам необходимый доступ к объектам игры.
    // Самое полезное:
    // - currentPlayer.table - выложенные карты текущего игрока
    // - oppositePlayer.table - выложенные карты противоположенного игрока
    // - position - позиция текущей карты, начиная слева, считается с 0
    // - updateView - обновляет вид всех объектов игры,
    //   полезен когда действие некоторой карты повлияло на множество объектов
    Game.prototype.getContextForCard = function (position) {
        return {
            currentPlayer: this.currentPlayer,
            oppositePlayer: this.oppositePlayer,
            position: position,
            updateView : () => this.updateView(),
        }
    };

    // Обновляет вид всех объектов игры.
    Game.prototype.updateView = function () {
        this.currentPlayer.updateView();
        this.oppositePlayer.updateView();
    };

    function getWinner(game) {
        if (hasNoPower(game.oppositePlayer)) {
            return game.currentPlayer;
        }
        if (hasNoPower(game.currentPlayer)) {
            return game.oppositePlayer;
        }
        return null;
    }

    function hasNoPower(player) {
        return player.currentPower <= 0
            || player.deck.length === 0 && player.table.length === 0;
    }

    function changePlayer(game) {
        const player = game.currentPlayer;
        game.currentPlayer = game.oppositePlayer;
        game.oppositePlayer = player;
    }

    function copyAndShuffle(array) {
        const result = [...array];
        result.sort(compareRandom);
        return result;
    }

    function copyAndReverse(array) {
        const result = [...array];
        result.reverse();
        return result;
    }

    function compareRandom() {
        return Math.random() - 0.5;
    }

    return Game;
}();

export default Game;
