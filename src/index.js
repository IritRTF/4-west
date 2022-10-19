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
    constructor(){
        super();
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
        return this.inGameCount; // || 0; 
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

    // Позволяет определять способности, которые должны активироваться или завершаться при выходе карты из игры.
    doBeforeRemoving(continuation) {
        Lad.inGameCount = Lad.inGameCount - 1;
        continuation();
    };

    static getBonus() {
        // количество * (количество + 1) / 2
        let count = Lad.inGameCount;
        return count * (count + 1) / 2;
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        let bonus = Lad.getBonus();
        console.log(bonus)
        continuation(value + bonus);
    };

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        console.log(Lad.getBonus())
        continuation(value - Lad.getBonus());
    };

    getDescriptions(){
        let descriptions = super.getDescriptions();
        if(Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') || Lad.prototype.hasOwnProperty('modifyTakenDamage')){
            return ['«Чем их больше, тем они сильнее»', descriptions[0], descriptions[1]];
        }
        return [getInheritanceDescription(this), descriptions[0], descriptions[1]];
    }

    // getDescriptions() {
    //     if(Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') || Lad.prototype.hasOwnProperty('modifyTakenDamage')){
    //         return [getInheritanceDescription(this)];
    //     }
    //     return [getInheritanceDescription(this)];
    // };
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

// 7 задание

// //Проверка 3
// const seriffStartDeck = [
//     new Duck(),
//     new Duck(),
//     new Duck(),
// ];
// const banditStartDeck = [
//     new Dog(),
// ];

//Проверка 4
// const seriffStartDeck = [
//     new Duck(),
//     new Duck(),
//     new Duck(),
//     new Duck(),
// ];
// const banditStartDeck = [
//     new Trasher(),
// ];

// //Проверка 5
// const seriffStartDeck = [
//     new Duck(),
//     new Duck(),
//     new Duck(),
//     new Gatling(),
// ];
// const banditStartDeck = [
//     new Trasher(),
//     new Dog(),
//     new Dog(),
// ];

// // Проверка 6
// const seriffStartDeck = [
//     new Duck(),
//     new Duck(),
//     new Duck(),
// ];
// const banditStartDeck = [
//     new Lad(),
//     new Lad(),
// ];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});