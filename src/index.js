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

class Creature extends Card{
    constructor(name, maxPower, image) {
        super();
    };

    get currentPower(){
        return this._currentPower;
    }

    set currentPower(value){
        this._currentPower = (value <= this.maxPower) ? value : this.maxPower;
    }

    getDescriptions(){
        return [getCreatureDescription(this), super.getDescriptions()];
    }
}

class Duck extends Creature{
    constructor(name = "Мирная утка", currentPower = 2){
        super();
        this.name = name;
        this.maxPower = currentPower;
        this.currentPower = currentPower;
    }
    quacks() { console.log('quack'); return true;};
    swims() { console.log('float: both;'); return true; };
}

class Dog extends Creature{
    constructor(name = "Пес-бандит", currentPower = 3){
        super();
        this.name = name;
        this.maxPower = currentPower;
        this.currentPower = currentPower;
    }
}

class Trasher extends Dog{
    constructor(name = "Громила", currentPower = 5){
        super();
        this.name = name;
        this.maxPower = currentPower;
        this.currentPower = currentPower;
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        if (value - 1 != 0)
            this.view.signalAbility(() => {continuation(value - 1);})
        else
            continuation(value - 1);
    }
}

// 5 задание
class Gatling extends Creature{
    constructor(name = "Гатлинг", currentPower = 6){
        super();
        this.name = name;
        this.maxPower = currentPower;
        this.currentPower = currentPower;
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        taskQueue.push(onDone => this.view.showAttack(onDone));
        const oppositeCards = oppositePlayer.table;
        for(let i = 0; i < oppositeCards.length; i++){
            let oppositeCard = oppositeCards[i];
            taskQueue.push(onDone => {
                if (oppositeCard) {
                    this.dealDamageToCreature(this.currentPower, oppositeCard, gameContext, onDone);
                }
                else {
                    onDone();
                }
            });
        }
        taskQueue.continueWith(continuation);
    }
}

// 6 задание
class Lad extends Dog {
    constructor(name = "Браток", currentPower = 2){
        super();
        this.name = name;
        this.maxPower = currentPower;
        this.currentPower = currentPower;
    }

    static getInGameCount() {
        return this.inGameCount; 
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    // Позволяет определять способности, которые должны активироваться при входе в игру.
    doAfterComingIntoPlay(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        Lad.inGameCount = (Lad.inGameCount > 0) ? Lad.inGameCount + 1: 1;
        continuation();
    };

// Основа для утки.
function Duck() {
    this.quacks = function () { console.log('quack') };
    this.swims = function () { console.log('float: both;') };
    // Позволяет определять способности, которые должны активироваться или завершаться при выходе карты из игры.
    doBeforeRemoving(continuation) {
        Lad.inGameCount = Lad.inGameCount - 1;
        continuation();
    };

    static getBonus() {
        let count = Lad.inGameCount;
        return count * (count + 1) / 2;
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        let bonus = Lad.getBonus();
        continuation(value + bonus);
    };

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        console.log(Lad.getBonus())
        continuation(value - Lad.getBonus());
    };

    getDescriptions() {
        let descriptions = super.getDescriptions();
        descriptions[0] = 'Чем их больше, тем они сильнее';
        return descriptions;
    }
}

//Не вызывается из Card
function getInheritanceDescription (card) {
    const names = [];
    let obj = card;
    while (true) {
        obj = Object.getPrototypeOf(obj);
        names.push(obj.constructor.name);
        if (obj === Card.prototype)
            break;
    }
    return names.join('➔ ');
}

// Основа для собаки.
function Dog() {
// 7 задание
class Rogue extends Creature { 
    constructor(name = 'Изгой', currentPower = 2) { 
        super(); 
        this.name = name; 
        this.maxPower = currentPower; 
        this.currentPower = currentPower; 
    }; 

    doBeforeAttack(gameContext, continuation) { 
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext; 
        let enemy = oppositePlayer.table[position]; 
        let proto = Object.getPrototypeOf(enemy); 
        let roguePrototype = Object.getPrototypeOf(enemy); 
        let cards = Object.getOwnPropertyNames(roguePrototype); 
        for (let i = 0; i <cards.length; i++) { 
            if (proto.hasOwnProperty("modifyDealedDamageToCreature")) { 
                this.modifyDealedDamageToCreature = proto.modifyDealedDamageToCreature;
                delete proto["modifyDealedDamageToCreature"]; 
            } 
            if (proto.hasOwnProperty("modifyDealedDamageToPlayer")) { 
                this.modifyDealedDamageToPlayer = proto.modifyDealedDamageToPlayer;
                delete proto["modifyDealedDamageToPlayer"]; 
            } 
            if (proto.hasOwnProperty("modifyTakenDamage")) { 
                this.modifyTakenDamage = proto.modifyTakenDamage;
                delete proto["modifyTakenDamage"];
            } 
        }; 
        updateView(); 
        continuation(); 
    } 
}

// 8 задание
class Brewer extends Duck{
    constructor(name = 'Пивовар', currentPower = 2){
        super();
        this.name = name
        this.maxPower = currentPower;
        this.currentPower = currentPower;
    }

    attack(gameContext, continuation){
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        let allCards = currentPlayer.table.concat(oppositePlayer.table);
        allCards.forEach(card => {
            if (isDuck(card)) {
                card.view.signalHeal();
                card.maxPower += 1;
                card.currentPower += 2
                card.updateView();
            }
        });

        taskQueue.push(onDone => this.view.showAttack(onDone));
        taskQueue.push(onDone => {
            const oppositeCard = oppositePlayer.table[position];
            if(oppositeCard !== undefined && oppositeCard !== null) {
                this.dealDamageToCreature(this.currentPower, oppositeCard, gameContext, onDone);
            }
            else {
                this.dealDamageToPlayer(1, gameContext, onDone);
            }
        });
        gameContext.updateView();
        taskQueue.continueWith(continuation);
    }
}

// 9 задание
class PseudoDuck extends Dog {
    constructor(name = 'Псевдоутка', currentPower = 3) {
        super();
        this.name = name;
        this.maxPower = currentPower;
        this.currentPower = currentPower;
    }

    quacks() { console.log('quack'); return true; };

    swims() { console.log('float: both;'); return true; };
}

// 10 задание 
class Nemo extends Creature{
    constructor(name = "Nemo"){
        super();
        this.name = name;
        this.wasStealed = false;
        this.maxPower = 4;
        this.currentPower = this.maxPower;
    }

    doBeforeAttack(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        const oppositeCard = oppositePlayer.table[position];
        if (oppositeCard && !this.wasStealed) {
            this.wasStealed = true;
            Object.setPrototypeOf(this, oppositeCard);
            this.doBeforeAttack(gameContext, continuation);
        }
        continuation();
        gameContext.updateView();
    }
}

// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Card('Мирный житель', 2),
    new Card('Мирный житель', 2),
    new Card('Мирный житель', 2),
    new Nemo(),
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Card('Бандит', 3),
    new Gatling(),
    new Dog(),
    new Dog(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

SpeedRate.set(1);
// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
});