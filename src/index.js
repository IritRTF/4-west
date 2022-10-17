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

    //Правильно ли работает?
    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        if (value - 1 != 0)
            this.view.signalAbility(() => {continuation(value - 1);})
        else
            continuation(value - 1);
    }
}


class Gatling extends Creature{
    constructor(name = "Гатлинг", currentPower = 6){
        super();
        this.name = name;
        this.maxPower = currentPower;
        this.currentPower = currentPower;
    }
}


const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
    new Gatling(),
];
const banditStartDeck = [
    new Trasher(),
    new Dog(),
    new Dog(),
];

// // Колода Шерифа, нижнего игрока.
// const seriffStartDeck = [
//     new Duck(),
//     new Duck(),
//     new Duck(),
// ];

// const banditStartDeck = [
//     new Trasher(),
// ];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});



