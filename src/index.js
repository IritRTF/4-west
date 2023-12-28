import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card{
    getDescriptions(){
        let firstStr = super.getDescriptions();
        let secondStr = getCreatureDescription(this);
        return [firstStr, secondStr];
    }
}

class Duck extends Creature{
    constructor(name = 'Мирная утка', maxPower = 2){
        super(name, maxPower)
    }
    quacks() { console.log('quack') };
    swims() { console.log('float: both;') };
}

class Dog extends Creature{
    constructor(name  = 'Пес-бандит',  maxPower = 3){
        super(name, maxPower)
    }
}

class Gatling extends Creature{
    constructor(name  = 'Гатлинг',  maxPower = 6){
        super(name, maxPower)
    }
    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        for (let index = 0; index < oppositePlayer.table.length; index++) {
            const element = oppositePlayer.table[index];
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



class Trasher extends Dog{
    constructor(name = 'Мусорщик', maxPower = 5){
        super (name, maxPower)
    }
    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => {continuation(value - 1)});
    };
    getDescriptions(){
        return ['Полученный урон меньше на 1', super.getDescriptions()];
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
    
    new Duck(),
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Trasher(),
    new Dog(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
