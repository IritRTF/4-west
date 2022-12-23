import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims && true;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max) + 1;
}

function buildRandomStarterDeckForSeriff() {
    let result = [];
    for (let i = 0; i < 15; ++i) {
        let a = getRandomInt(10);
        if (1 <= a && a <= 2) {
            result.push(new Duck());
        }
        else if (3 <= a && a <= 4) {
            result.push(new Rogue());
        }
        else if (5 <= a && a <= 6) {
            result.push(new Brewer());
        } else {
            result.push(new Gatling());
        };
    };
    return result;
}

function buildRandomStarterDeckForBandit() {
    let result = [];
    for (let i = 0; i < 15; ++i) {
        let a = getRandomInt(10);
        if (1 <= a && a <= 2) {
            result.push(new Dog());
        }
        else if (3 <= a && a <= 4) {
            result.push(new Lad());
        }
        else if (5 <= a && a <= 6) {
            result.push(new Nemo());
        } else if (7 <= a && a <= 8) {
            result.push(new Trasher());
        } else {
            result.push(new PseudoDuck());
        };
    };
    return result;
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

class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
        this._currentPower = maxPower;
    };

    set currentPower(value) {
        this._currentPower = value <= this.maxPower ? value : this.maxPower;
    };

    get currentPower() {
        return this._currentPower;
    }

    getDescriptions() {
        return [getCreatureDescription(this), super.getDescriptions(this)]
    };
}

// Основа для утки.
class Duck extends Creature {
    constructor(name = 'Мирная утка', maxPower = 2, image = 'duck.png') {
        super(name, maxPower, image);
    };

    quacks() {
        console.log('quack') 
    };
    
    swims() { 
        console.log('float: both;') 
    };
}


// Основа для собаки.
class Dog extends Creature {
    constructor(name = 'Пес-бандит', maxPower = 3, image = 'dog.png') {
        super(name, maxPower, image);
    };
}

class Trasher extends Dog {
    constructor(name = 'Громила', maxPower = 5, image = 'trasher.png') {
        super(name, maxPower, image);
    };

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {continuation(value - 1)});
    };

    getDescriptions() {
        const descriptions = super.getDescriptions();
        descriptions[0] = 'Уменьшает получаемый урон на 1';
        return descriptions;
    }
}

class Gatling extends Creature {
    constructor(name = 'Гатлинг', maxPower = 6, image = 'gatling.png') {
        super(name, maxPower, image);
    };

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        const oppositeCards = oppositePlayer.table;
        for (let i = 0; i < Object.keys(oppositeCards).length; ++i) {
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                const oppositeCard = oppositePlayer.table[i];

                if (oppositeCard) {
                    this.dealDamageToCreature(this.currentPower, oppositeCard, gameContext, onDone);
                } else {
                    this.dealDamageToPlayer(1, gameContext, onDone);
                }
        });
        }

        taskQueue.continueWith(continuation);
    };
}

class Lad extends Dog {
    constructor(name = 'Браток', maxPower = 2, image = 'lad.png') {
        super(name, maxPower, image);
    };

    static getInGameCount() {
        return this.inGameCount || 0;
    };

    static setInGameCount(value) {
        this.inGameCount = value;
    };

    doAfterComingIntoPlay(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        if (Lad.inGameCount) {
            Lad.setInGameCount(Lad.getInGameCount() + 1);
        } else {
            Lad.setInGameCount(1);
        }
        continuation();
    };

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation();
    };

    static getBonus() {
        const ladCount = this.getInGameCount();
        return ladCount * (ladCount + 1) / 2;
    };

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(value - Lad.getBonus());
    };

    getDescriptions() {
        const descriptions = super.getDescriptions();
        descriptions[0] = 'Чем их больше, тем они сильнее';
        return descriptions;
    }
}

class Rogue extends Creature {
    constructor(name = 'Изгой', maxPower = 2, image = 'rogue.png') {
        super(name, maxPower, image);
    };

    doBeforeAttack(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        const oppositeCard = oppositePlayer.table[position];
        if (oppositeCard) {
            const prototypeOfCard = Object.getPrototypeOf(oppositeCard);
            const properties = Object.getOwnPropertyNames(prototypeOfCard)
            for (let property of properties) {
                if (['modifyDealedDamageToCreature', 'modifyDealedDamageToPlayer', 'modifyTakenDamage'].includes(property)) { delete prototypeOfCard[property] };
            };
            updateView();
            continuation();
        } else {
            continuation();
        }
    }
}

class Brewer extends Duck {
    constructor(name = 'Пивовар', maxPower = 2, image = 'brewer.png') {
        super(name, maxPower, image);
    };

    doBeforeAttack(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        const allCardsOnTheTable = currentPlayer.table.concat(oppositePlayer.table);
        allCardsOnTheTable
            .filter(card => isDuck(card))
            .forEach(card => {
                card.maxPower += 1;
                card.currentPower += 2;
                card.view.signalHeal();
                card.updateView();
            });
        continuation();
    }
}
class PseudoDuck extends Dog {
    constructor(name = 'Псевдоутка', maxPower = 3, image = 'pseudoduck.png') {
        super(name, maxPower, image);
    };

    quacks() {
        console.log('woof') 
    };
    
    swims() { 
        console.log('float: both;') 
    };
}

class Nemo extends Creature {
    constructor(name = 'Немо', maxPower = 4, image = 'nemo.png') {
        super(name, maxPower, image);
    };

    doBeforeAttack(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        const oppositeCard = oppositePlayer.table[position];
        if (oppositeCard) {
            this.isPrototypeStolen = true;
            Object.setPrototypeOf(this, oppositeCard);
            updateView();
            this.doBeforeAttack(gameContext, continuation);
        } else {
            continuation();
        };
    }
}

// Колода Шерифа, нижнего игрока.
const seriffStartDeck = buildRandomStarterDeckForSeriff();

// Колода Бандита, верхнего игрока.
const banditStartDeck = buildRandomStarterDeckForBandit();


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});