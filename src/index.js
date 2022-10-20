import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

class Creature extends Card{
    getDescriptions(){
        let string1 = getCreatureDescription(this);
        let string2 = super.getDescriptions();
        return [string1,string2]
    }
}

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

function isLad(card) {
    return card instanceof Lad;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isLad(card)) {
        return 'Чем их больше, тем они сильнее';
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



// Основа для утки.
class Duck extends Creature{
    constructor(){
        super()
        this.name = "Мирная утка";
        this.maxPower = 2;
        this.currentPower = 2;
    }
    quacks() 
    { 
        onsole.log('quack') 
    };
    swims() 
    { 
        console.log('float: both;') 
    };
}


// Основа для собаки.
class Dog extends Creature{
    constructor(){
        super()
        this.name = "Пес-бандит";
        this.maxPower = 3;
        this.currentPower = this.maxPower;
    }
}

class PseudoDuck extends Dog{
    constructor(){
        super()
        this.name = "Псевдоутка";
        this.maxPower = 3;
        this.currentPower = this.maxPower;
    }
    quacks() 
    { 
        onsole.log('quack') 
    };
    swims() 
    { 
        console.log('float: both;') 
    };
}

class Lad extends Dog{
    static inGameCount;
    constructor(){
        super()
        this.name = "Браток";
        this.maxPower = 2;
        this.currentPower = this.maxPower;
    }
    doAfterComingIntoPlay(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        continuation();
    };
    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation();
    };
    static getBonus() {
        return Lad.getInGameCount() * (Lad.getInGameCount() + 1) / 2
    };
    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    };
    modifyTakenDamage(value, fromCard, gameContext, continuation){
        continuation(value - Lad.getBonus());
    };
    static getInGameCount() { return Lad.inGameCount || 0; }
    static setInGameCount(value) { Lad.inGameCount = value; }
}

class Gatling extends Creature{
    constructor(){
        super()
        this.name = "Гатлинг";
        this.maxPower = 6;
        this.currentPower = this.maxPower;
    }
    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        let allCards = gameContext.oppositePlayer.table;
        for(let position = 0; position < allCards.length; position++) {
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                const card = allCards[position];
                if (card) {
                    this.dealDamageToCreature(2, card, gameContext, onDone);
                } else {
                    onDone();
                }
            });
        }
        taskQueue.continueWith(continuation);
    };

}


class Rogue extends Creature{
    constructor(){
        super()
        this.name = "Изгой";
        this.maxPower = 2;
        this.currentPower = this.maxPower;
    }
    attack(gameContext, continuation){
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                const oppositeCard = oppositePlayer.table[position];
                if(oppositeCard!==undefined && oppositeCard!==null ){//проверка на наличие опонента
                    
                    console.log(oppositeCard)
                    const proto = Object.getPrototypeOf(oppositeCard)

                    if (proto.hasOwnProperty("modifyDealedDamageToCreature"))
                    {
                        this.modifyDealedDamageToCreature = proto.modifyDealedDamageToCreature;
                        delete proto["modifyDealedDamageToCreature"]
                    }

                    if (proto.hasOwnProperty("modifyDealedDamageToPlayer"))
                    {
                        this.modifyDealedDamageToPlayer = proto.modifyDealedDamageToPlayer;
                        delete proto["modifyDealedDamageToPlayer"]
                    }

                    if (proto.hasOwnProperty("modifyTakenDamage"))
                    {
                        this.modifyTakenDamage = proto.modifyTakenDamage;
                        delete proto["modifyTakenDamage"]
                    }
                    

                    if (oppositeCard) {
                        this.dealDamageToCreature(this.currentPower, oppositeCard, gameContext, onDone);
                    }
                }
                else
                {
                    this.dealDamageToPlayer(1, gameContext, onDone);
                }
            });
        
        gameContext.updateView()
        taskQueue.continueWith(continuation);
    }
}

class Trasher extends Dog{
    constructor(){
        super()
        this.name = "Громила"
        this.maxPower = 5;
        this.currentPower = this.maxPower;
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation){
        continuation(value - 1);
    };
}


class Brewer extends Duck{
    constructor(){
        super()
        this.name = "Пивовар"
        this.maxPower = 2
        this.currentPower = this.maxPower
    }

    attack(gameContext, continuation){
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        let allCards = currentPlayer.table.concat(oppositePlayer.table);
        allCards.forEach(card => {
            if (isDuck(card))
            {
                card.view.signalHeal();
                card.maxPower += 1;
                card.currentPower = (card.currentPower + 2 <= card.maxPower) ? card.currentPower + 2 : card.currentPower + 1
                card.updateView();  
            }
        });

        taskQueue.push(onDone => this.view.showAttack(onDone));
        taskQueue.push(onDone => {
            const oppositeCard = oppositePlayer.table[position];
            if(oppositeCard!==undefined && oppositeCard!==null)//Проверил есть ли оппозиция 
            {
                const proto = Object.getPrototypeOf(oppositeCard)
            
                this.dealDamageToCreature(this.currentPower, oppositeCard, gameContext, onDone);
            } 
            else {
                this.dealDamageToPlayer(1, gameContext, onDone);
            }
        });
        gameContext.updateView()
        taskQueue.continueWith(continuation);
    }
}


class Nemo extends Creature {
    constructor() {
        super();
        this.name = "Немо";
        this.maxPower = 4;
        this.currentPower = this.maxPower;
    }

    doBeforeAttack(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        if(oppositePlayer.table[position]!==undefined && oppositePlayer.table[position]!=null)//Проверил есть ли оппозиция
        {
            let oppositePlayerProto = Object.getPrototypeOf(oppositePlayer.table[position]);
            Object.setPrototypeOf(this, oppositePlayerProto);
            
            if (oppositePlayerProto.hasOwnProperty("modifyDealedDamageToCreature"))
            {
                this.modifyDealedDamageToCreature = oppositePlayerProto.modifyDealedDamageToCreature;
            }

            if (oppositePlayerProto.hasOwnProperty("modifyDealedDamageToPlayer"))
            {
                this.modifyDealedDamageToPlayer = oppositePlayerProto.modifyDealedDamageToPlayer;
            }

            if (oppositePlayerProto.hasOwnProperty("modifyTakenDamage"))
            {
                this.modifyTakenDamage = oppositePlayerProto.modifyTakenDamage;
            }
        }
        else {
            this.dealDamageToPlayer(this.currentPower, gameContext, continuation);
        }
        gameContext.updateView();
        continuation();
    };
}


// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Trasher(),
    new Rogue(),
    new Gatling(),
    new Duck(),

];
const banditStartDeck = [
    new Nemo(),
    new Gatling(),
    new Rogue(),
    new Duck(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});