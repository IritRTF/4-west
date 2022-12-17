import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card instanceof Duck;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

function isTrasher(card){
    return card instanceof Thasher;
}

function isGatling(card){
    return card instanceof Gatling;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isTrasher(card)) {
        return 'Громила';
    }
    if (isGatling(card)) {
        return 'Гатлинг';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}
// Creature
export default class Creature extends Card{
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
    }

    getDescriptions() {
        return [getCreatureDescription(this), super.getDescriptions()]
    }

}


// Основа для утки.
class Duck extends Creature {
    constructor() {
        super('Мирная утка', 2);
    }

    quacks() {
        console.log('quack');
    }

    swim(){
        console.log('float: both;');
    }

}


// Основа для собаки.
class Dog extends Creature {
    constructor(name='Абу-бандит', maxPower=3) {
        super(name, maxPower);
    }
}

class Thasher extends Dog {
    constructor() {
        super('Громила', 5);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility();
        continuation(value - 1);
    }
}

class Gatling extends Creature {
    constructor() {
        super('Гатлинг', 6);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        for(let position = 0; position < gameContext.oppositePlayer.table.length; position++) {
            taskQueue.push(onDone => {
                const card = gameContext.oppositePlayer.table[position];
                if (card) {
                    card.dealDamageToCreature(this.currentPower, card, gameContext, onDone);
                } else {
                    onDone();
                }
            });
        }
        taskQueue.continueWith(continuation);
    }
}

class Lad extends Dog {
    static inGameCount = 0;

    constructor() {
        super('Браток', 2);
        Lad.inGameCount++;
    }

    static getInGameCount(){
        return this.inGameCount || 0;
    }

    static setInGameCount(value){
        Lad.inGameCount = value;
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(value - 1);
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        Lad.setInGameCount(0);
        continuation();
    }

    doBeforeRemoving(continuation){
        Lad.inGameCount--;
        continuation();
    }

}


// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
    new Gatling()
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Thasher(),
    new Dog(),
    new Dog()
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
