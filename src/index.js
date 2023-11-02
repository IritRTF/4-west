import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card{
    getDescriptions(){
        let str1 = super.getDescriptions();
        let str2 = getCreatureDescription(this);
        return[str1, str2];
    }

}

class Duck extends Creature{
    constructor(name = "Мирная утка", maxPower = 2){
        super(name, maxPower)
    }
    quacks() { console.log('quack') };
    swims() { console.log('float: both;') };
}

class BigDuck extends Duck{
    constructor(name = "Большая утка", maxPower = 4){
        super(name, maxPower)
    }
}

class Dog extends Creature{
    constructor(name = "Пес-бандит", maxPower = 3){
        super(name, maxPower)       
    }
}

class Trasher extends Dog{
    constructor(name = "Громила", maxPower = 4){
        super(name, maxPower)
    }
    modifyDealedDamageToCreature (value, toCard, gameContext, continuation) {
        this.view.signalAbility(() => {continuation(value - 1)});
    };
    getDescriptions() {
        return ['Входящий урон уменьшен на 1',
            super.getDescription(),
            
        ];
    };
}

class Gatling extends Creature{
    constructor(name = "Гатлинг", maxPower = 6){
        super(name, maxPower)   
    } 
    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        for(let i = 0; i<oppositePlayer.table.length; i++){
            const element = oppositePlayer[i];
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
    new Gatling(),
    new BigDuck(),
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Trasher(),
    new Dog(),
    new Dog(),
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
