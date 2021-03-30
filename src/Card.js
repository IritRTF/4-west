import {default as View} from './CardView.js';
import TaskQueue from './TaskQueue.js';

const Card = function () {
    function Card(name, maxPower, image) {
        this.name = name;
        this.image = image;

        this.maxPower = maxPower;
        this.currentPower = maxPower;

        this.view = new View();
        this.updateView();
    }

    // Размещает карту в колоде в начале игры.
    // Нельзя переопределять в наследниках.
    Card.prototype.putInDeck = function (deck, inBottomRow, position) {
        this.view.putInDeck(deck, inBottomRow, position);
    };

    // Вызвается, когда карта должна войти в игру.
    // Нельзя переопределять в наследниках.
    Card.prototype.comeIntoPlay = function (gameContext, place, continuation) {
        const taskQueue = new TaskQueue();

        taskQueue.push(onDone => this.view.flipFront(onDone));
        taskQueue.push(onDone => this.view.moveTo(place, onDone));

        taskQueue.push(onDone => this.doAfterComingIntoPlay(gameContext, onDone));

        taskQueue.continueWith(continuation);
    };

    // Вызывается при входе карты в игру, сразу после размещения карты в нужной позиции на столе.
    // Можно переопределить в наследниках.
    // Позволяет определять способности, которые должны активироваться при входе в игру.
    Card.prototype.doAfterComingIntoPlay = function (gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        continuation();
    };

    // Карта действует в рамках хода, когда настало ее время.
    // Нельзя переопределять в наследниках.
    Card.prototype.actInTurn = function (gameContext, continuation) {
        const taskQueue = new TaskQueue();

        taskQueue.push(onDone => this.doBeforeAttack(gameContext, onDone));
        taskQueue.push(onDone => this.attack(gameContext, onDone));

        taskQueue.push(onDone => gameContext.oppositePlayer.removeDead(onDone));
        taskQueue.push(onDone => gameContext.currentPlayer.removeDead(onDone));

        taskQueue.continueWith(continuation);
    };

    // Вызывается перед атакой.
    // Можно переопределить в наследниках.
    // Позволяет определять способности, которые должны активироваться при атаке.
    Card.prototype.doBeforeAttack = function (gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        continuation();
    };

    // Определяет что делает карта при атаке.
    // Обычно карта атакует противоположенную карту, а если ее нет, то наносит урон игроку-противнику.
    // Можно переопределять в наследниках.
    // Позволяет изменить поведение карты при атаке.
    Card.prototype.attack = function (gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        taskQueue.push(onDone => this.view.showAttack(onDone));
        taskQueue.push(onDone => {
            const oppositeCard = oppositePlayer.table[position];

            if (oppositeCard) {
                this.dealDamageToCreature(this.currentPower, oppositeCard, gameContext, onDone);
            } else {
                this.dealDamageToPlayer(1, gameContext, onDone);
            }
        });

        taskQueue.continueWith(continuation);
    };

    // Определяет правила нанесения урона другим картам.
    // Нельзя переопределять в наследниках.
    // Нужно использовать при изменении поведения карты при атаке.
    Card.prototype.dealDamageToCreature = function (value, toCard, gameContext, continuation) {
        const taskQueue = new TaskQueue();

        let actualValue = value;

        taskQueue.push(onDone => {
            this.modifyDealedDamageToCreature(actualValue, toCard, gameContext, (v) => {
                if (v !== undefined) {
                    actualValue = v;
                }
                onDone();
            });
        });

        taskQueue.push(onDone => {
            toCard.takeDamage(Math.max(actualValue, 0), this, gameContext, onDone);
        });

        taskQueue.continueWith(continuation);
    };

    // Изменяет урон, наносимый картой при атаке карт противника.
    // Можно переопределить в наследниках.
    // Позволяет определять способности, которые меняют наносимый урон при атаке карт противника.
    Card.prototype.modifyDealedDamageToCreature = function (value, toCard, gameContext, continuation) {
        continuation(value);
    };

    // Определяет правила нанесения урона игроку-противнику.
    // Нельзя переопределять в наследниках.
    // Нужно использовать при изменении поведения карты при атаке.
    Card.prototype.dealDamageToPlayer = function (value, gameContext, continuation) {
        const taskQueue = new TaskQueue();

        let actualValue = value;

        taskQueue.push(onDone => {
            this.modifyDealedDamageToPlayer(actualValue, gameContext, (v) => {
                if (v !== undefined) {
                    actualValue = v;
                }
                onDone();
            });
        });

        taskQueue.push(onDone => {
            gameContext.oppositePlayer.takeDamage(Math.max(actualValue, 0), onDone);
        });

        taskQueue.continueWith(continuation);
    };

    // Изменяет урон, наносимый картой при атаке игрока-противника.
    // Можно переопределить в наследниках.
    // Позволяет определять способности, которые меняют наносимый урон при атаке игрока-противника.
    Card.prototype.modifyDealedDamageToPlayer = function (value, gameContext, continuation) {
        continuation(value);
    };

    // Определяет правила получения картой урона.
    // Нельзя переопределять в наследниках.
    Card.prototype.takeDamage = function (value, fromCard, gameContext, continuation) {
        const taskQueue = new TaskQueue();

        let actualValue = value;

        taskQueue.push(onDone => {
            this.modifyTakenDamage(actualValue, fromCard, gameContext, (v) => {
                if (v !== undefined) {
                    actualValue = v;
                }
                onDone();
            });
        });

        taskQueue.push(onDone => {
            if (actualValue <= 0) {
                onDone();
                return;
            }

            this.currentPower = this.currentPower - actualValue;
            this.updateView();
            this.view.signalDamage(onDone);
        });

        taskQueue.continueWith(continuation);
    };

    // Изменяет урон, наносимый карте.
    // Можно переопределить в наследниках.
    // Позволяет определять способности, которые меняют наносимый карте урон.
    Card.prototype.modifyTakenDamage = function (value, fromCard, gameContext, continuation) {
        continuation(value);
    };

    // Перемещает карту в заданное место на столе.
    // Нельзя переопределять в наследниках.
    Card.prototype.moveTo = function (place, continuation) {
        this.view.moveTo(place, continuation);
    };

    // Выводит карту из игры.
    // Нельзя переопределять в наследниках.
    Card.prototype.removeFromGame = function (continuation) {
        const taskQueue = new TaskQueue();

        taskQueue.push(onDone => this.doBeforeRemoving(onDone));
        taskQueue.push(onDone => this.view.remove(onDone));

        taskQueue.continueWith(continuation);
    };

    // Вызывается при выходе карты из игры непосредственно перед удалением ее со стола.
    // Можно переопределить в наследниках.
    // Позволяет определять способности, которые должны активироваться или завершаться при выходе карты из игры.
    Card.prototype.doBeforeRemoving = function (continuation) {
        continuation();
    };

    // Строит описания карты, которые показываются на ее лицевой стороне.
    // Можно переопределить в наследниках.
    Card.prototype.getDescriptions = function () {
        return [
            getInheritanceDescription(this)
        ];
    };

    // Строит описание цепочки прототипов с помощью имен конструкторов.
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

    // Обновляет вид карты.
    // Нельзя переопределять в наследниках.
    // Можно использовать, если известно какие карты затронуты изменениями.
    Card.prototype.updateView = function () {
        this.view.updateData({
            name: this.name,
            descriptions: this.getDescriptions(),
            image: this.image,
            currentPower: this.currentPower,
            maxPower: this.maxPower
        });
    };

    return Card;
}();

export default Card;
