import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card{
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
        this._currentPower = maxPower;
    }

    get currentPower() {
        return this._currentPower;
    }
    
    set currentPower(value){
        this._currentPower = Math.min(value, this.maxPower);
    }

    getDescriptions(){
        let method = super.getDescriptions();
        let base = getCreatureDescription(this);
        return[method, base];
    }

}

class Duck extends Creature{
    constructor(name='Мирная утка', maxPower=2) {
        super(name, maxPower)
    }
    quacks() { console.log('quack') };
    swims() { console.log('float: both;') };
}

class Dog extends Creature{
    constructor(name='Пес-бандит', maxPower=3) {
        super(name, maxPower)
    }
}

class Trasher extends Dog{
    constructor(name ='Громила', maxPower=5) {
        super(name, maxPower)
    }
    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {continuation(value - 1)});
    };
    getDescriptions(){
        return [ 'входящий урон уменьшен на 1', super.getDescriptions().join(' ') ]
    }
}

class Gatling extends Creature {
    constructor(name = 'Гатлинг', maxPower = 6) {
        super(name, maxPower)
    };

    attack (gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        for (let i = 0; i < oppositePlayer.table.length; i++) {
            const element = oppositePlayer.table[i];
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                if (element) {
                    this.dealDamageToCreature(2, element, gameContext, onDone);
                }
            });
        }

        taskQueue.continueWith(continuation);
    };
}

class Lad extends Dog{

    constructor(name='Браток', maxPower=2){
        super(name, maxPower)
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getInGameCount() {
        return this.inGameCount || 0; 
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1)
        continuation();
    }

    doBeforeRemoving(continuation){
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation();
    }
    static getBonus() {
        let count = Lad.getInGameCount()
        return count*(count + 1) / 2
    }
    
    modifyDealedDamageToCreature(value, fromCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(this.maxPower - Lad.getBonus());
    }
    getDescriptions() {
        return Lad.prototype.hasOwnProperty('modifyTakenDamage') && Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') ?
        [super.getDescriptions(this).join(' '), 'Чем их больше, тем они сильнее'] : super.getDescriptions(this);
    }
}

class Rogue extends Creature{
    constructor(name='Изгой', maxPower=2){
        super(name, maxPower);
    }

    doBeforeAttack(gameContext, continuation) {
        const { oppositePlayer, position, updateView } = gameContext;
        const oppositeCard = oppositePlayer.table[position];
        if (oppositeCard) {
            const oppositeCardPrototype = Object.getPrototypeOf(oppositeCard);
            const abilities = ['modifyDealedDamageToCreature', 'modifyDealedDamageToPlayer', 'modifyTakenDamage'];
            this.view.signalAbility(() => {
                for (let ability of abilities) {
                    if (oppositeCardPrototype.hasOwnProperty(ability)) {
                        delete oppositeCardPrototype[ability];
                    }
                }
                updateView();
                super.doBeforeAttack(gameContext, continuation);
                });
        } else super.doBeforeAttack(gameContext, continuation);
    }  
}

class Brewer extends Duck {
    constructor(name='Пивовар', maxPower=2) {
        super(name, maxPower);
    }

    doBeforeAttack(gameContext, continuation) {
        const { currentPlayer, oppositePlayer } = gameContext;
        const ducks = [...currentPlayer.table, ...oppositePlayer.table].filter(card => isDuck(card));
        this.view.signalAbility(() => {
            for (let duck of ducks){
                duck.maxPower += 1;
                duck.currentPower += 2;
                duck.view.signalHeal(() => duck.updateView());
            }
            super.doBeforeAttack(gameContext, continuation);
        });
    }
}

class PseudoDuck extends Dog {
    constructor(name='Псевдоутка', maxPower = 3) {
        super(name, maxPower);
        this.quacks = Duck.prototype.quacks.bind(this);
        this.swims = Duck.prototype.swims.bind(this);
    }
}

class Nemo extends Creature {
    constructor(name = 'Немо', maxPower = 4) {
        super(name, maxPower);
    }

    doBeforeAttack(gameContext, continuation) {
        const { oppositePlayer, position, updateView } = gameContext;
        const oppositeCard = oppositePlayer.table[position];
        if (oppositeCard) {
            const prototype = Object.getPrototypeOf(oppositeCard);
            this.view.signalAbility(() => {
                Object.setPrototypeOf(this, prototype);
                updateView();
                this.doBeforeAttack(gameContext, continuation);
            });
        } else super.doBeforeAttack(gameContext, continuation);
    }
}

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

// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Gatling(),
    new Rogue(),
    new Brewer(),
    new Nemo()
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Trasher(),
    new Dog(),
    new Lad(),
    new PseudoDuck()
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});