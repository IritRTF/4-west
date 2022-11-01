import TaskQueue from './TaskQueue.js';

const PLAYER_MAX_POWER = 10;


class Player {
    constructor(game, name, image, deck, view) {
        this.game = game;
        this.name = name;
        this.image = image;

        this.currentPower = PLAYER_MAX_POWER;
        this.maxPower = PLAYER_MAX_POWER;

        this.maxTableSize = view.table.length;
        this.view = view;
        this.deck = deck;
        this.table = [];
        this.buildDeck();
        this.updateView();
    }
    
    buildDeck() {
        let position = 0;
        for (const card of this.deck) {
            card.putInDeck(this.view.deck, this.view.inBottomRow, position);
            position++;
        }
    }

    takeDamage(value, continuation) {
        const taskQueue = new TaskQueue();

        taskQueue.push(onDone => {
            this.currentPower = this.currentPower - value;
            this.updateView();

            this.view.signalDamage(onDone);
        });

        taskQueue.continueWith(continuation);
    }

    playNewCard(continuation) {
        const taskQueue = new TaskQueue();

        taskQueue.push(onDone => this.view.signalTurnStart(onDone));

        taskQueue.push(onDone => {
            if (this.deck.length === 0 || this.table.length >= this.maxTableSize) {
                onDone();
                return;
            }

            const card = this.deck.pop();
            this.table.push(card);

            const position = this.table.length - 1;
            const place = this.view.table[position];
            const gameContext = this.game.getContextForCard(position);
            card.updateView();
            card.comeIntoPlay(gameContext, place, onDone);
        });

        taskQueue.continueWith(continuation);
    }

    applyCards(continuation) {
        const taskQueue = new TaskQueue();

        for (let position = 0; position < this.table.length; position++) {
            taskQueue.push(onDone => {
                const card = this.table[position];
                if (card) {
                    const gameContext = this.game.getContextForCard(position);
                    card.actInTurn(gameContext, onDone);
                } else {
                    onDone();
                }
            });
        }

        taskQueue.continueWith(continuation);
    }

    removeDeadAndCompactTable(continuation) {
        this.removeDead(() => this.compactTable(continuation));
    }

    removeDead(continuation) {
        const taskQueue = new TaskQueue();

        for (let position = 0; position < this.table.length; position++) {
            taskQueue.push(onDone => {
                const card = this.table[position];
                if (!card || card.currentPower > 0) {
                    onDone();
                } else {
                    this.table[position] = null;
                    card.removeFromGame(onDone);
                }
            });
        }

        taskQueue.continueWith(continuation);
    }

    compactTable(continuation) {
        const taskQueue = new TaskQueue();

        for (let position = 0; position < this.table.length; position++) {
            taskQueue.push(onDone => {
                if (this.table[position]) {
                    onDone();
                    return;
                }
                if (position >= this.table.length) {
                    onDone();
                    return;
                }
                for (let i = position + 1; i < this.table.length; i++) {
                    const card = this.table[i];
                    if (card) {
                        this.table[position] = card;
                        this.table[i] = null;
                        const place = this.view.table[position];
                        card.moveTo(place, onDone);
                        return;
                    }
                }
                this.table.length = position;
                onDone();
            });
        }

        taskQueue.continueWith(continuation);
    }

    updateView() {
        this.view.updateData({
            image: this.image,
            currentPower: this.currentPower,
            maxPower: this.maxPower
        });
        for (const card of this.table) {
            if (card) {
                card.updateView();
            }
        }
    }
}

export default Player;