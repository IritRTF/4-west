import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает за то, является ли карта уткой.
function isDuck(card) {
    return Boolean(card && card.quacks && card.swims);
}

// Отвечает за то, является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
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

// // Основа для утки.
// function Duck() {
//     this.quacks = function () {
//         console.log("quack");
//     };
//     this.swims = function () {
//         console.log("float: both;");
//     };
// }

// // Основа для собаки.
// function Dog() {}

class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
        this._currentPower = maxPower;
    }

    getDescriptions() {
        let descriptions = super.getDescriptions();
        descriptions.unshift(getCreatureDescription(this));
        return descriptions;
    }

    get currentPower() {
        return this._currentPower;
    }

    set currentPower(value) {
        this._currentPower = value > this.maxPower ? this.maxPower : value;
    }
}

class Duck extends Creature {
    constructor(name = 'Мирный житель', maxPower = 2, image = null) {
        super(name, maxPower, image);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}

class Dog extends Creature {
    constructor(name = 'Бандит', maxPower = 3, image = null) {
        super(name, maxPower, image);
    }
}

class Trasher extends Dog {
    constructor(name = 'Громила', maxPower = 5, image = null) {
        super(name, maxPower, image);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => continuation(value - 1));
    }

    getDescriptions() {
        let descriptions = super.getDescriptions();
        descriptions.unshift(
            'Если Громилу атакуют, то он получает на 1 меньше урона'
        );
        return descriptions;
    }
}

class Gatling extends Creature {
    constructor(name = 'Гатлинг', maxPower = 6, image = null) {
        super(name, maxPower, image);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const oppositeTable = gameContext.oppositePlayer.table;
        for (let position = 0; position < oppositeTable.length; position++) {
            taskQueue.push((onDone) => this.view.showAttack(onDone));
            taskQueue.push((onDone) => {
                const oppositeCard = oppositeTable[position];

                if (oppositeCard) {
                    this.dealDamageToCreature(
                        this.currentPower,
                        oppositeCard,
                        gameContext,
                        onDone
                    );
                } else {
                    onDone();
                }
            });
        }
        taskQueue.continueWith(continuation);
    }
}

class Lad extends Dog {
    constructor(name = 'Братки', maxPower = 2, image = null) {
        super(name, maxPower, image);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    // returns bonus protection and damage: [protection, damage]
    static getBonus() {
        const inGameCount = this.getInGameCount();
        return (inGameCount * (inGameCount + 1)) / 2;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        if (Lad.inGameCount === undefined) {
            Lad.setInGameCount(1);
            continuation();
            return;
        }
        Lad.setInGameCount(Lad.inGameCount + 1);
        continuation();
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.inGameCount - 1);
        continuation();
    }

    modifyDealtDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(value - Lad.getBonus());
    }

    getDescriptions() {
        let descriptions = super.getDescriptions();
        if (
            Lad.prototype.hasOwnProperty('modifyDealtDamageToCreature') ||
            Lad.prototype.hasOwnProperty('modifyTakenDamage')
        )
            descriptions.unshift('Чем их больше, тем они сильнее');
        return descriptions;
    }
}

class Rogue extends Creature {
    constructor(name = 'Изгой', maxPower = 2, image = null) {
        super(name, maxPower, image);
    }

    doBeforeAttack(gameContext, continuation) {
        const { currentPlayer, oppositePlayer, position, updateView } =
            gameContext;
        const oppositeCard = oppositePlayer.table[position];
        const oppositeCardPrototype = Object.getPrototypeOf(oppositeCard);
        if (!oppositeCard) {
            continuation();
            return;
        }
        if (
            oppositeCardPrototype.hasOwnProperty('modifyDealtDamageToCreature')
        ) {
            this.modifyDealtDamageToCreature =
                oppositeCardPrototype.modifyDealtDamageToCreature;
            delete oppositeCardPrototype['modifyDealtDamageToCreature'];
        }
        if (oppositeCardPrototype.hasOwnProperty('modifyDealtDamageToPlayer')) {
            this.modifyDealtDamageToPlayer =
                oppositeCardPrototype['modifyDealtDamageToPlayer'];
            delete oppositeCardPrototype['modifyDealtDamageToPlayer'];
        }
        if (oppositeCardPrototype.hasOwnProperty('modifyTakenDamage')) {
            this.modifyTakenDamage = oppositeCardPrototype['modifyTakenDamage'];
            delete oppositeCardPrototype['modifyTakenDamage'];
        }
        updateView();
        continuation();
    }
}

class Brewer extends Duck {
    constructor(name = 'Пивовар', maxPower = 2, image = null) {
        super(name, maxPower, image);
    }

    doBeforeAttack(gameContext, continuation) {
        const { currentPlayer, oppositePlayer, position, updateView } =
            gameContext;
        const allCards = currentPlayer.table.concat(oppositePlayer.table);
        allCards
            .filter((card) => isDuck(card))
            .forEach((card) => {
                card.maxPower += 1;
                card.currentPower += 2;
                card.view.signalHeal();
                card.updateView();
            });
        updateView();
        continuation();
    }
}

class PseudoDuck extends Dog {
    constructor(name = 'Псевдоутка', maxPower = 3, image = null) {
        super(name, maxPower, image);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}

class Nemo extends Creature {
    constructor(name = 'Немо', maxPower = 4, image = null) {
        super(name, maxPower, image);
    }

    doBeforeAttack(gameContext, continuation) {}
}

const seriffStartDeck = [new Nemo()];
const banditStartDeck = [new Brewer(), new Brewer()];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
