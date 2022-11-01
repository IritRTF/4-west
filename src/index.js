import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

function isDuck(card) {
    return card && card.quacks && card.swims;
}

function isDog(card) {
    return card instanceof Dog;
}

function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

class Creature extends Card {
    constructor(name, maxPower) {
        super(name, maxPower);
        this._currentPower = maxPower;
    }

    get currentPower() {
        return this._currentPower;
    }

    set currentPower(value) {
        this._currentPower = value > this.maxPower ? this.maxPower : value;
    }

    getDescriptions() {
        return [getCreatureDescription(this), super.getDescriptions()];
    }
}

class Duck extends Creature {
    constructor(name = 'Мирная утка', maxPower = 2) {
        super(name, maxPower);
    }

    quacks() {
        console.log('quack');
    };

    swims() {
        console.log('float: both;');
    };
}

class Dog extends Creature {
    constructor(name = 'Пес-бандит', maxPower = 3) {
        super(name, maxPower);
    }
}

class Trasher extends Dog {
    constructor(name = 'Громила', maxPower = 5) {
        super(name, maxPower);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() =>
            super.modifyTakenDamage(value - 1, fromCard, gameContext, continuation));
    }

    getDescriptions() {
        let descriptions = super.getDescriptions();
        descriptions.push('Получает меньше урона на 1');
        return descriptions;
    }
}

class Gatling extends Creature {
    constructor(name = 'Гатлинг', maxPower = 6) {
        super(name, maxPower);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const { currentPlayer, oppositePlayer, position, updateView } = gameContext;
        taskQueue.push(onDone => this.view.showAttack(onDone));
        oppositePlayer.table.forEach(card => {
            taskQueue.push(onDone => {
                if (card) {
                    this.dealDamageToCreature(2, card, gameContext, onDone);
                }
            });
        });
        taskQueue.continueWith(continuation);
    };

    getDescriptions() {
        let descriptions = super.getDescriptions();
        descriptions.push('Наносит 2 урона всем противникам');
        return descriptions;
    }
}

class Lad extends Dog {
    static getInGameCount() { return this.inGameCount || 0; }
    static setInGameCount(value) { this.inGameCount = value; }
    static getBonus() { return this.getInGameCount() * (this.getInGameCount() + 1) / 2; }
    constructor(name = 'Браток', maxPower = 2) {
        super(name, maxPower);
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        continuation();
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation();
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(value - Lad.getBonus());
    }

    getDescriptions() {
        let descriptions = super.getDescriptions();
        if (Lad.prototype.hasOwnProperty("modifyDealedDamageToCreature") && Lad.prototype.hasOwnProperty("modifyTakenDamage")) {
            descriptions.push("Чем их больше, тем они сильнее");
        }
        return descriptions;
    }
}

class Rogue extends Creature {
    static properties = [
        'modifyDealedDamageToCreature',
        'modifyDealedDamageToPlayer',
        'modifyTakenDamage',
    ];

    constructor(name = 'Изгой', maxPower = 2) {
        super(name, maxPower);
    }

    doBeforeAttack(gameContext, continuation) {
        const { currentPlayer, oppositePlayer, position, updateView } = gameContext;
        const oppositeCard = oppositePlayer.table[position];
        const obj = Object.getPrototypeOf(oppositeCard);

        Rogue.properties.forEach(property => {
            if (obj.hasOwnProperty(property)) {
                this[property] = obj[property];
                delete obj[property];
            }
        });
        continuation();
        updateView();
    }

    getDescriptions() {
        let descriptions = super.getDescriptions();
        descriptions.push('Крадет способности');
        return descriptions;
    }
}

class Brewer extends Duck {
    constructor(name = "Пивовар", maxPower = 2) {
        super(name, maxPower);
    }

    doBeforeAttack(gameContext, continuation) {
        let taskQueue = new TaskQueue();
        const cards = gameContext.currentPlayer.table.concat(gameContext.oppositePlayer.table);

        for (let card of cards.filter(card => isDuck(card))) {
            card.view.signalHeal();
            card.maxPower += 1;
            card.currentPower += 2;
            card.updateView();
        }

        taskQueue.continueWith(continuation);

    }

    getDescriptions() {
        let descriptions = super.getDescriptions();
        descriptions.push('Раздает живительное пиво');
        return descriptions;
    }
}

class PseudoDuck extends Dog {
    constructor() {
        super("Псевдоутка", 3);
    }
    swims() {}
    quacks() {}
}

class Nemo extends Creature {
    constructor(name = 'Немо', maxPower = 4) {
        super(name, maxPower);
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        Object.setPrototypeOf(this, Object.getPrototypeOf(toCard));
        this.doBeforeAttack(gameContext, continuation);
        gameContext.updateView();
    }

    getDescriptions() {
        let descriptions = super.getDescriptions();
        descriptions.push('The one without a name without an honest heart as compass');
        return descriptions;
    }
}

const seriffStartDeck = [
    new Nemo(),
];
const banditStartDeck = [
    new Brewer(),
    new Brewer(),
];

const game = new Game(seriffStartDeck, banditStartDeck);

SpeedRate.set(3);

game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});