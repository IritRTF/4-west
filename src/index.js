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
function getCreatureDescription(card){
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

//Существо 
class Creature extends Card{
    constructor(name , maxPower ,image ){
        super(name , maxPower , image);
    }
    getcurentPower(){return this.curentPower;}
    setcurrentPower(value){
        this.curentPower = this.curentPower + value > this.maxPower ?
         this.maxPower :  this.curentPower + value;
    }
    getDescriptions(){
        return [getCreatureDescription(this) , super.getDescriptions()]
    }
}

// Основа для утки.

class Duck extends Creature{
    constructor(name = 'Мирная утка' , maxPower = 2 ,image){
        super(name,maxPower,image);
    }
    quacks(){ console.log('quack')}
    swims () { console.log('float: both;')}
}



class Dog extends Creature{
    constructor(name = 'Пес-бандит' , maxPower = 3 ,image){
        super(name,maxPower,image);
    }
}
//Гатлинг 
class Gatling extends Creature{
    constructor(){
        super('Гатлинг',6);
        this.currentPower = 2;
    }
    getDescriptions(){
        return [ 'При атаке наносит 2 урона по очереди всем картам противника на столе, но не атакует игрока-противника' ,
         getCreatureDescription(this) ,
          super.getDescriptions() 
        ]
    }
    attack(gameContext, continuation){
        const oppCards = gameContext.oppositePlayer.table;
        const taskQueue = new TaskQueue();

        for(let position = 0; position < oppCards.length; position++) {
            taskQueue.push(onDone => {
                const card = gameContext.oppositePlayer.table[position];
                if (card) {
                    this.dealDamageToCreature(this.currentPower, card, gameContext, onDone);
                }
            })
        }
        taskQueue.continueWith(continuation);
    }
}
//Братки
class Lad extends Dog{

    constructor(){
        super('Браток' , 2);
    }
    
    static setInGameCount(value) { this.inGameCount = value; }
    static getInGameCount() { return this.inGameCount || 0; }

    doAfterComingIntoPlay(gameContext, continuation){
        let count = Lad.getInGameCount();
        Lad.setInGameCount(count + 1);
        super.doAfterComingIntoPlay(gameContext, continuation);
    }
    doBeforeRemoving(continuation){
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        super.doBeforeRemoving(continuation);
    }
    static getBonus(){
        let count = Lad.getInGameCount();
        return count*(count + 1) / 2 ;
    }
    modifyDealedDamageToCreature(value, fromCard, gameContext, continuation){
        continuation(value + Lad.getBonus());
    }
    modifyTakenDamage(value, fromCard, gameContext, continuation){
        continuation(this.maxPower - Lad.getBonus());
    }
    getDescriptions() {
        const descriptions = [...super.getDescriptions()];
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature')) {
            descriptions.unshift('Чем их больше, тем они сильнее');
        }
        return descriptions;
    }
}
//Изгой 
class Rogue extends Creature{
    constructor(){
        super('Изгой' , 2);
    }
    getAbility(oppCard , updateView , gameContext , continuation){
        let oppPrototype = Object.getPrototypeOf(oppCard);
        let abilities = ['modifyDealedDamageToCreature', 'modifyDealedDamageToPlayer', 'modifyTakenDamage'];
        this.view.signalAbility(() => {
             for(let abil of abilities){
                if (oppPrototype.hasOwnProperty(abil)){
                    console.log("Object.getPrototypeOf(oppCard)");
                    delete oppPrototype[abil];
                }
            }
            updateView();
            });
    }
    doBeforeAttack(gameContext, continuation){
        const { oppositePlayer, position, updateView } = gameContext;
        const oppCard = oppositePlayer.table[position];
        if (oppCard){
            this.getAbility(oppCard , updateView , gameContext , continuation);
        }
        
        super.doBeforeAttack(gameContext, continuation);
    }
}

//Псевдоутка
class PseudoDuck extends Dog{
    constructor(){
        super('Псевдоутка' , 3);
    }
    quacks(){console.log('quack');}
    swims(){console.log('swim')}
}

//Немо
class Nemo extends Creature{
    constructor(){
        super('Немо' ,4);
    }
    doBeforeAttack(gameContext ,continuation){
        const oppCard = gameContext.oppositePlayer.table[gameContext.position];
        const oppPrototype = Object.getPrototypeOf(oppCard);
        if(oppCard)
            this.view.signalAbility(() => {
                Object.setPrototypeOf(this ,oppPrototype );
                this.doBeforeAttack(gameContext,continuation);
                gameContext.updateView();
            });
        else super.doBeforeAttack(gameContext,continuation);
    }
}
//Пивовар
class Brewer extends Duck{
    constructor(){
        super('Пивовар' , 2 )
    }
    doBeforeAttack(gameContext , continuation){
        this.view.signalAbility(() => {
            const cards = gameContext.currentPlayer.table.concat(gameContext.oppositePlayer.table).filter(x => isDuck(x));
            for (let card of cards){
                card.maxPower++;
                card.curentPower += 2;
                card.view.signalHeal(() => card.updateView())
            }
            super.doBeforeAttack(gameContext,continuation);
        });
    }
}
//Громила
class Trasher extends Dog{
    constructor(){
        super('Громила' , 5);
    }
    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => { continuation(value - 1)});
    }
    getDescriptions(){
        return [ 'Если Громилу атакуют, то он получает на 1 меньше урона' , getCreatureDescription(this) , super.getDescriptions() ]
    }
}


const seriffStartDeck = [
    new Nemo(),
];
const banditStartDeck = [
    new Brewer(),
    new Brewer(),
];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
