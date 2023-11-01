import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card{
    constructor(name, maxPower) {
        super(name, maxPower);
        this._currentPower = maxPower;
    }

    getDescriptions(){
        let description1 = super.getDescriptions();
        let description2 = getCreatureDescription(this)
        return [description1, description2];
    }

    get currentPower() {
        return this._currentPower;
    }

    set currentPower(value) {
        this._currentPower = value > this.maxPower ? this.maxPower : value;
    }
}

class Duck extends Creature{
    constructor(name = 'Мирная утка', maxPower = 2) {
        super(name, maxPower)
    }

    quacks() { console.log('quack') };
    swims() { console.log('float: both;') };
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

class Gatling extends Creature{
    constructor(name = 'Gatling', maxPower=6){
        super(name, maxPower)
    }
    attack(gameContext, continuation){
        const taskQueue = new TaskQueue();
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        this.table = gameContext.oppositePlayer.table;

        for (let pos = 0; pos < this.table.length; pos++){
            const card = this.table[pos]
            taskQueue.push(onDone => this.view.showAttack(onDone));
            this.dealDamageToCreature(2, card, gameContext, continuation);
            
        }
        taskQueue.continueWith(continuation);
    }

}

class Dog extends Creature{
    constructor(name = 'Пёс бандит', maxPower = 3) {
        super(name, maxPower)
    }
}

class Trasher extends Dog {
    constructor() {
        super("Громила", 5)
    }

    getDescriptions() {
        return ["Если Громилу атакуют, то он получает на 1 меньше урона", super.getDescriptions(this)]
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => { super.modifyTakenDamage(value - 1, fromCard, gameContext, continuation) })
    }  
}

class Lad extends Dog {
    constructor() {
        super('Братки', 2);
    }

    static getBonus() {
        const inGameCount = this.getLadCount();
        return (inGameCount * (inGameCount + 1)) / 2;
    }

    static getLadCount() {
        return this.inGameCount || 0;
    }

    static setLadCount(value) {
        this.inGameCount = value;
    }


    doAfterComingIntoPlay(gameContext, continuation) {
        if (Lad.inGameCount === undefined) {
            Lad.setLadCount(1);
            continuation();
            return;
        }
        Lad.setLadCount(Lad.inGameCount + 1);
        continuation();
    }

    doBeforeRemoving(continuation) {
        Lad.setLadCount(Lad.inGameCount - 1);
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


class PseudoDuck extends Dog {
    constructor() {
        super('Псевдоутка', 3);
    }

    quacks() {
        console.log('quack');
    }

    swims() {
        console.log('float: both;');
    }
}

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

const seriffStartDeck = [
    new Brewer(),
    new Duck(),
    new Duck(),
];

const banditStartDeck = [
    new PseudoDuck(),
    new Lad(),
];


const game = new Game(seriffStartDeck, banditStartDeck);

SpeedRate.set(1);

game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
