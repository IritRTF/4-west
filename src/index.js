import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return Boolean(card && card.quacks && card.swims);
}

// Отвечает является ли карта собакой.
function isTrasher(card) {
    return card instanceof Trasher;
}

function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками

function getCreatureDescription(card) {
    if (card instanceof Lad){
        return "чем их, тем они сильнее!"
    }

    if (card instanceof Gatling){
        return "Наносит 2 ед. урона картам все картам противника"
    }

    if (isTrasher(card)){
        return 'получает на 1 ед. урона меньше';
    }
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (card instanceof Brewer){
        return "раздает всем уткам пиво при получении урона !";
    }
    if (isDuck(card)) {
        return 'Утка';
    }
     if (card instanceof Rogue) {
        return 'Похищает способности';
    }

    if (isDog(card)) {
        return 'Собака';
    }
    
    return 'Существо';
}

class Creature extends Card{
    constructor(name = null, power = 0, image = null){
        super(name, power, image)
    }

    get currentPower(){
        return this._currentPower;
    }
    set currentPower(value){
        this._currentPower = Math.min(value, this.maxPower);
    }

    getDescriptions(){
        return [getCreatureDescription(this), ...super.getDescriptions()]
    }
}

// Основа для утки.
class Duck extends Creature {
    constructor(name = "Мирная утка", power = 2, image = null ) {
        super(name, power, image)
    }

    quacks() {
        console.log('quack');
    }

    swims () {
        console.log('float: both;');
    };
}


// Основа для собаки.
class Dog extends Creature{
    constructor(name = 'Пес-бандит', power = 3, image = null){
        super(name, power, image)
    }
}


class Trasher extends Dog{
    constructor(name = 'Громила', power = 5, image = null){
        super(name, power, image)
    }


    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility((() => continuation(value - 1) ));
    }
}

class Gatling extends Creature{
    constructor(name = 'Гатлинг', power = 6, image = null) {
        super(name, power, image);
    }


    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const { currentPlayer, oppositePlayer, position, updateView } = gameContext;

        for( let i = 0; i < oppositePlayer.table.length; i++){
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                const oppositeCard = oppositePlayer.table[i];
                if (oppositeCard) {
                    this.dealDamageToCreature(2, oppositeCard, gameContext, onDone);
                }
            });
    }
        taskQueue.continueWith(continuation);
    }

}

class Lad extends Dog{
    constructor(name = 'Браток', power = 2, image=null){
        super(name, power, image)
    }

    static get inGameCount(){
        return this._inGameCount || 0;
    }

    static set inGameCount(value){
        this._inGameCount = value;
    }

    static get bonus(){
        return this.inGameCount - 1 || 0;
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        if (Lad.bonus > 0){
            this.view.signalAbility((() => continuation(value - Lad.bonus) ));
        }else{
            continuation(value);
        }
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        if (Lad.bonus > 0){
            this.view.signalAbility((() => continuation(value + Lad.bonus) ));
        }else{
            continuation(value);
        }
    }


    doAfterComingIntoPlay(gameContext, continuation) {
        const { currentPlayer, oppositePlayer, position, updateView } = gameContext;
        Lad.inGameCount = currentPlayer.table.filter(card => card instanceof Lad).length;
        continuation();
    }

    doBeforeRemoving(continuation) {
        Lad.inGameCount = Lad.inGameCount - 1;
        continuation();
    }

}

class Rogue extends Creature{
    constructor(name = 'Изгой', power = 2, image = null){
        super(name, power, image)
    }


    doBeforeAttack(gameContext, continuation) {
        const { currentPlayer, oppositePlayer, position, updateView } = gameContext;
        this.view.signalAbility((signal_continuation) => {
            const oppositeCard = oppositePlayer.table[position];
            const oppositeCardPrototype = Object.getPrototypeOf(oppositeCard)

            if (!oppositeCard || oppositeCard instanceof Rogue) {
                continuation();
                return;
            }
            if (oppositeCardPrototype.hasOwnProperty('modifyDealtDamageToCreature')) {
                this.modifyDealtDamageToCreature =
                    oppositeCardPrototype.modifyDealtDamageToCreature;
                delete oppositeCardPrototype['modifyDealtDamageToCreature'];
            }
            if (oppositeCardPrototype.hasOwnProperty('modifyDealtDamageToPlayer')) {
                this.modifyDealtDamageToPlayer =
                    oppositeCardPrototype['modifyDealtDamageToPlayer'];
                delete oppositeCardPrototype['modifyDealtDamageToPlayer'];
            }
            if (oppositeCardPrototype.hasOwnProperty('modifyTakenDamage')) {
                this.modifyTakenDamage = oppositeCardPrototype['modifyTakenDamage'];
                delete oppositeCardPrototype['modifyTakenDamage'];
            }
        });
        continuation();
        updateView();
    }
}


class Brewer extends Duck{
    constructor(name="Пивовар", power=2, image=null){
        super(name, power, image);
    }

    doBeforeAttack(gameContext, continuation) {

        const { currentPlayer, oppositePlayer, position, updateView } = gameContext;

        for(let player of [currentPlayer, oppositePlayer]){
            for(let i = 0; i < player.table.length; i++){
                if (isDuck(player.table[i])){

                    player.table[i].view.signalHeal( () =>{
                        player.table[i].maxPower++;
                        player.table[i].currentPower += 2;
                        updateView();
                    });
                }
            }
        }
        continuation();
    }

}


class PseudoDuck extends Dog{
    constructor(name="Псевдоутка", power=3, image=null){
        super(name, power, image);
    }

    quacks() {
        console.log('quack');
    }

    swims () {
        console.log('float: both;');
    };
}

class Nemo extends Creature{
    constructor(name="Немо", power=4, image=null){
        super(name, power, image);
    }

    doBeforeAttack(gameContext, continuation) {
        const { currentPlayer, oppositePlayer, position, updateView } = gameContext;

        if(!oppositePlayer.table[position]){
            continuation();
        }else{
            const oppositePrototype = Object.getPrototypeOf(oppositePlayer.table[position]);
            this.view.signalAbility(() => {
                console.log(this.doBeforeAttack)
                Object.setPrototypeOf(this, oppositePrototype)
                console.log(this.doBeforeAttack)
                updateView();
                oppositePlayer.table[position].doBeforeAttack.apply(this, [gameContext, continuation]);
            });
        }
    }
}
const seriffStartDeck = [new Nemo()];
const banditStartDeck = [new Brewer(), new Brewer()];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
