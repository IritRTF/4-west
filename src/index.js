import Card from './Card.js';
import Game from './Game.js';
// import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

function isTrasher(card){
    return card instanceof Trasher;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isTrasher(card)){
        return 'Trasher'
    }
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
    constructor(name, maxPower, image, ...descriptions){
        super(name, maxPower, image)
        this.description = descriptions
    }

    getDescriptions(...values){
            return [getCreatureDescription(this), `MaxPower: ${this.maxPower}`, super.getDescriptions(), ...values, this.description]
    }
}


// Основа для утки.
class Duck extends Creature{
    constructor(name = 'Какая-то утка', maxPower = 2, image, ...description) {
        super(name, maxPower, image);
    }
    quacks(){
        console.log('quack')
    }

    swims() {
        console.log('float: both;')
    }
}

class Dog extends Creature{
    constructor(name = 'Какая-то собака', maxPower = 3, image, ...description) {
        super(name, maxPower, image, description);
    }
}

class Trasher extends Dog{
    constructor(name, maxPower = 5, image){
        let description = 'Очень мощьный юнит. Хана кряквам.'
        super('Trasher', maxPower, image, description)
    }
    modifyTakenDamage(value, fromCard, gameContext, continuation){
        this.view.signalAbility(() => {
            continuation(value-1)})
    }
    

}


// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck('Бугай', 3),
    new Duck('Бугай побольше', 4),
    new Duck('Мирный житель', 2),
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Dog(),
    new Trasher(),
    new Dog('Очень большая собака', 5),
    new Dog('Какая-то мелочь', 2),
    new Dog('Обычная собака')
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
