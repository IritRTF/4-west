import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
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

class Creature extends Card {
    constructor(name, maxPower) {
        super(name, maxPower)
    }

    getDescriptions() {
        return [getCreatureDescription(this), super.getDescriptions(this)]
    }

    get currentPower() {
        return this._currentPower
    }

    set currentPower(value) {
        this._currentPower = Math.min(value, this.maxPower)
    }
}

// Основа для утки.
class Duck extends Creature {
    constructor(name="Мирная утка", maxPower=2) {
        super(name, maxPower)
    }
    quacks() { console.log('quack') };
    swims() { console.log('float: both;') };
}


// Основа для собаки.
class Dog extends Creature {
    constructor(name="Пес-бандит", maxPower=3) {
        super(name, maxPower)
    }
}

class Trasher extends Dog {
    constructor() {
        super("Громила", 5)
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => { super.modifyTakenDamage(value - 1, fromCard, gameContext, continuation) })
    }

    getDescriptions() {
        return ["Если Громилу атакуют, то он получает на 1 меньше урона", super.getDescriptions(this)]
    }
}

class Gatling extends Creature {
    constructor(name="Гатлинг", maxPower=6) {
        super(name, maxPower)
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        for (let position = 0; position < gameContext.oppositePlayer.table.length; position++) {
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                const oppositeCard = gameContext.oppositePlayer.table[position];
    
                if (oppositeCard) {
                    this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
                } 
            });
        }
        taskQueue.continueWith(continuation);
    }
}

class Lad extends Dog {
    constructor(name="Браток", maxPower=2) {
        super(name, maxPower)
    }

    static getInGameCount() { return this.inGameCount || 0; }
    static setInGameCount(value) { this.inGameCount = value; }
    static getBonus() { return this.getInGameCount() * (this.getInGameCount() + 1) / 2 }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1)
        super.doAfterComingIntoPlay(gameContext, continuation)
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1)
        super.doBeforeRemoving(continuation)
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        super. modifyDealedDamageToCreature(value + Lad.getBonus(), toCard, gameContext, continuation)
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        super.modifyTakenDamage(value - Lad.getBonus(), fromCard, gameContext, continuation)
    }

    getDescriptions() {
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') || Lad.prototype.hasOwnProperty('modifyTakenDamage'))
            return ["Чем их больше, тем они сильнее", super.getDescriptions(this)]
        else return super.getDescriptions(this)
    }
}

class Rogue extends Creature {
    constructor() {
        super("Изгой", 2)
    }

    attack(gameContext, continuation) {
        let oppositeCard_prototype = Object.getPrototypeOf(gameContext.oppositePlayer.table[gameContext.position])

        if (oppositeCard_prototype.hasOwnProperty(`modifyDealedDamageToCreature`)) this.modifyDealedDamageToCreature = oppositeCard_prototype.modifyDealedDamageToCreature
        if (oppositeCard_prototype.hasOwnProperty(`modifyDealedDamageToPlayer`)) this.modifyDealedDamageToPlayer = oppositeCard_prototype.modifyDealedDamageToPlayer
        if (oppositeCard_prototype.hasOwnProperty(`modifyTakenDamage`)) this.modifyTakenDamage = oppositeCard_prototype.modifyTakenDamage

        if (oppositeCard_prototype.hasOwnProperty(`modifyDealedDamageToCreature`)) delete oppositeCard_prototype[`modifyDealedDamageToCreature`]
        if (oppositeCard_prototype.hasOwnProperty(`modifyDealedDamageToPlayer`)) delete oppositeCard_prototype[`modifyDealedDamageToPlayer`]
        if (oppositeCard_prototype.hasOwnProperty(`modifyTakenDamage`)) delete oppositeCard_prototype[`modifyTakenDamage`]

        gameContext.updateView()
        super.attack(gameContext, continuation)
    }
}

class Brewer extends Duck {
    constructor() {
        super("Пивовар", 2)
    }

    
    attack(gameContext, continuation) {
        let all_isDuck_cards = gameContext.currentPlayer.table.concat(gameContext.oppositePlayer.table).filter((card) => isDuck(card))

        for (let i = 0; i < all_isDuck_cards.length; i++) {
            all_isDuck_cards[i].view.signalHeal(() => {})
            all_isDuck_cards[i].maxPower += 1
            all_isDuck_cards[i].currentPower += 2
            all_isDuck_cards[i].updateView()
        }

        gameContext.updateView()
        super.attack(gameContext, continuation)
    }
}

class PseudoDuck extends Dog {
    constructor() {
        super("Псевдоутка", 3)
    }

    quacks() { console.log('quack') };
    swims() { console.log('float: both;') };
}

class Nemo extends Creature {
    constructor() {
        super("Немо", 4)
    }

    attack(gameContext, continuation) {
        Object.setPrototypeOf(gameContext.currentPlayer.table[gameContext.position], Object.getPrototypeOf(gameContext.oppositePlayer.table[gameContext.position]))
        Object.setPrototypeOf(gameContext.oppositePlayer.table[gameContext.position], new Creature())
        this.doBeforeAttack(gameContext, continuation)
        super.attack(gameContext, continuation)
    }
}

const seriffStartDeck = [
    new Nemo(),
];
const banditStartDeck = [
    new Brewer(),
    new Brewer(),
];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
