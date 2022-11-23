import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

function isDuck(card){
    return card && card.quacks && card.swims;
}

function isDog(card){
    return card instanceof Dog;
}

function getCreatureDescription(card){
    if (isDuck(card)&&isDog(card)){
        return 'Утка-собака';
    }
    if (isDuck(card)){
        return 'Утка';
    }
    if (isDog(card)){
        return 'Собака';
    }
    return 'Существо';
}

class Creature extends Card{}

class Duck extends Creature{
    constructor(name = 'Мирный житель', currentPower = 2){
        super();
        this.name = name;
        this.maxPower = this.currentPower;
        this.currentPower = currentPower;
    }

    quacks() {
        console.log('quack');
    }

    swims () {
        console.log('float:both;');
    }
}

class Dog extends Creature{
    constructor(name = 'Бандит', currentPower = 3){
        super();
        this.name = name;
        this.maxPower = currentPower;
        this.currentPower= currentPower;
    }
}

class Gatling extends Creature{
    constructor(name = 'Гатлинг', currentPower = 6){
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

class Trasher extends Dog {
    constructor(name = 'Громила', currentPower = 5){
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

class Lad extends Dog{
    static inGameCount;
    constructor(name='Браток', currentPower = 2){
        super();
        this.name = name;
        this.maxPower = currentPower;
        this.currentPower = currentPower;
    }

    doAfterComingIntoPlay(gameContext, continuation){
        const {currentPlayer, oppositePlayer, position, updateView} =  gameContext;
        Lad.inGameCount = (Lad.inGameCount > 0) ? Lad.inGameCount + 1: 1;
        continuation();
    };

    doBeforeRemoving(continuation){
        Lad.inGameCount = Lad.inGameCount - 1;
        continuation();
    };

    static gameBonus(){
        return Lad.getInGameCount() * (Lad.getInGameCount + 1)/2
    };

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
    new Duck(),
    new Gatling(),
    new Brewer(),
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Dog(),
    new Trasher(),
    new PseudoDuck(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
