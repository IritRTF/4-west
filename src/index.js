import Card from './Card.js';
import Game from './Game.js';
//import TaskQueue from './TaskQueue.js';
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
        super(name, maxPower);
    }

    // setCurrentPower(value) {
    //     this.currentPower = Math.min(this.maxPower, this.currentPower + value);
    // }

    getDescriptions() {
        return [getCreatureDescription(this), ...super.getDescriptions()]
    }
}

class Duck extends Creature {
    constructor(name, power) {
        super(name ? ? "Мирная утка", power ? ? 2);
    }

    quacks() {
        console.log('quack')
    };

    swims() {
        console.log('float: both;')
    };
}

class Dog extends Creature {
    constructor(name, power) {
        super(name ? ? "Пес-бандит", power ? ? 3);
    }
}

class Trasher extends Dog {
    constructor(name, power) {
        super(name ? ? "Громила", power ? ? 5);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => continuation(value - 1));
    }

    getDescriptions() {
        let descriptions = [];
        if (Trasher.prototype.hasOwnProperty('modifyTakenDamage')) {
            descriptions = ["Урон меньше на 1"];
        }
        return descriptions.concat([...super.getDescriptions()]);
    }
}

class Gatling extends Creature {
    constructor(name, power) {
        super(name ? ? "Гатлинг", power ? ? 6);
    }

    // attack(gameContext, continuation) {
    //     let taskQueue = new TaskQueue();
    //     let oppositePlayer = gameContext.oppositePlayer;
    //     for (let card of oppositePlayer.table) {
    //         taskQueue.push((attack) => this.view.showAttack(attack));
    //         taskQueue.push((onDone) => this.dealDamageToCreature(2, card, gameContext, onDone));
    //     }
    //     taskQueue.continueWith(continuation);
    //     game.updateView();
    // };
}

class Lad extends Dog {
    constructor(name, power) {
        super(name ? ? "Браток", power ? ? 2);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    // static setInGameCount(value) {
    //     this.inGameCount = value;
    // }

    static getBonus() {
        return this.getInGameCount() * (this.getInGameCount() + 1) / 2;
    }

    // doAfterComingIntoPlay(gameContext, continuation) {
    //     Lad.setInGameCount(Lad.getInGameCount() + 1);
    //     continuation();
    // }
    //
    // doBeforeRemoving(continuation) {
    //     Lad.setInGameCount(Lad.getInGameCount() - 1);
    //     continuation();
    // };

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => continuation(value - Lad.getBonus()));
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
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
    constructor(name, power) {
        super(name ? ? "Изгой", power ? ? 2);
    }

    static stealer = ["modifyDealedDamageToCreature", "modifyDealedDamageToPlayer", "modifyTakenDamage"];

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        const prototype = Object.getPrototypeOf(fromCard);
        for (const property of Rogue.stealer) {
            if (prototype.hasOwnProperty(property)) {
                this[property] = prototype[property];
                delete prototype[property];
            }
        }

        gameContext.updateView();
        super.modifyTakenDamage(value, fromCard, gameContext, continuation);
    }

    getDescriptions() {
        let descriptions = ["Ворует способности врагов"];
        return descriptions.concat([...super.getDescriptions()]);
    }
}

class Brewer extends Duck {
    constructor(name, power) {
        super(name ? ? "Пивовар", power ? ? 2);
    }

    // doBeforeAttack(gameContext, continuation) {
    //     let taskQueue = new TaskQueue();
    //     let {currentPlayer, oppositePlayer} = gameContext;
    //     let cards = currentPlayer.table.concat(oppositePlayer.table);
    //     for (let card of cards) {
    //         if (isDuck(card)) {
    //             card.maxPower += 1;
    //             card.setCurrentPower(2);
    //             taskQueue.push(onDone => card.view.signalHeal(onDone));
    //             card.updateView();
    //         }
    //     }
    //     taskQueue.continueWith(continuation);
    // }
}

class PseudoDuck extends Dog {
    constructor(name, power) {
        super(name ? ? "Псевдоутка", power ? ? 3);
    }

    quacks() { console.log('quack') };
    swims() { console.log('float: both;') };
}

class Nemo extends Creature {
    constructor(name, power) {
        super(name ? ? "Немо", power ? ? 4);
    }

    // doBeforeAttack(gameContext, continuation) {
    //     let taskQueue = new TaskQueue();
    //     let {oppositePlayer, position} = gameContext;
    //     let oppositeCard = oppositePlayer.table[position];
    //
    //     if (oppositeCard) {
    //         Object.setPrototypeOf(this, Object.getPrototypeOf(oppositeCard));
    //         gameContext.updateView();
    //     }
    //     taskQueue.continueWith(continuation);
    // }
}

// Создание игры.
const seriffStartDeck = [new Duck(), new Duck(), new Gatling(), new Nemo()];
const banditStartDeck = [new Trasher(), new Brewer(), new Lad(), new PseudoDuck()];
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(2);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});