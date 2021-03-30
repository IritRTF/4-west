import SpeedRate from './SpeedRate.js';
import TaskQueue from './TaskQueue.js';

const CardView = function() {
    function CardView() {
        this.inBottomRow = false;
        this.card = createFromTemplate();
        this.signal = this.card.querySelector('.cardSignal');
        this.name = this.card.querySelector('.cardName');
        this.descriptions = this.card.querySelector('.cardDescriptions');
        this.image = this.card.querySelector('.cardImage img');
        this.currentPower = this.card.querySelector('.cardCurrentPower');
        this.maxPower = this.card.querySelector('.cardMaxPower');
    }

    CardView.prototype.putInDeck = function(deck, inBottomRow, position) {
        deck.appendChild(this.card);
        this.inBottomRow = inBottomRow;
        this.card.style['left'] = `${3*position}px`;
    };

    CardView.prototype.updateData = function ({name, descriptions, image, currentPower, maxPower}) {
        this.name.innerText = name;
        if (image) {
            this.image.setAttribute('src', `images/${image}`);
        } else {
            this.image = null;
        }
        this.descriptions.innerHTML = descriptions.map(d => `<div>${d}</div>`).join('');
        this.currentPower.innerText = currentPower;
        this.maxPower.innerText = maxPower;
    };

    CardView.prototype.flipFront = function(continuation) {
        const taskQueue = new TaskQueue();

        const timeInSec = 0.5/SpeedRate.get();
        taskQueue.push(
            () => {
                this.card.classList.remove('flipped');
                this.card.style.transitionDuration = `${timeInSec}s`;
            },
            () => {
                this.card.style.transitionDuration = null;
            },
            timeInSec*1000
        );

        taskQueue.continueWith(continuation);
    };

    CardView.prototype.flipBack = function(continuation) {
        const taskQueue = new TaskQueue();

        const timeInSec = 0.5/SpeedRate.get();
        taskQueue.push(
            () => {
                this.card.classList.add('flipped');
                this.card.style.transitionDuration = `${timeInSec}s`;
            },
            () => {
                this.card.style.transitionDuration = null;
            },
            timeInSec*1000
        );

        taskQueue.continueWith(continuation);
    };

    CardView.prototype.signalHeal = function(continuation) {
        signal(this.signal, SpeedRate.get(), 'heal', continuation);
    };

    CardView.prototype.signalDamage = function(continuation) {
        signal(this.signal, SpeedRate.get(), 'damage', continuation);
    };

    CardView.prototype.signalAbility = function(continuation) {
        signal(this.signal, SpeedRate.get(), 'ability', continuation);
    };

    CardView.prototype.showAttack = function(continuation) {
        const taskQueue = new TaskQueue();

        const attackClass = this.inBottomRow ? 'attackUp' : 'attackDown';

        const timeInSec = 0.3/SpeedRate.get();
        taskQueue.push(
            () => {
                this.card.classList.add(attackClass);
                this.card.style.animationDuration = `${timeInSec}s`;
            },
            () => {
                this.card.classList.remove(attackClass);
                this.card.style.animationDuration = null;
            },
            timeInSec*1000
        );

        taskQueue.continueWith(continuation);
    };

    CardView.prototype.moveTo = function(target, continuation) {
        const taskQueue = new TaskQueue();

        const targetOffset = getOffset(target);
        const cardOffset = getOffset(this.card);
        const dx = targetOffset.left - cardOffset.left;
        const dy = targetOffset.top - cardOffset.top;

        const timeInSec = 0.5/SpeedRate.get();
        taskQueue.push(
            () => {
                this.card.style['transform'] = `translate(${dx}px, ${dy}px)`;
                this.card.style['transitionDuration'] = `${timeInSec}s`;
            },
            () => {
                target.appendChild(this.card);
                this.card.style['left'] = '0px';
                this.card.style['top'] = '0px';
                this.card.style['transform'] = '';
                this.card.style['transitionDuration'] = null;
            },
            timeInSec*1000
        );

        taskQueue.continueWith(continuation);
    };

    CardView.prototype.remove = function(continuation) {
        const taskQueue = new TaskQueue();

        const timeInSec = 0.3/SpeedRate.get();
        taskQueue.push(
            () => {
                this.card.classList.add('fadeOut')
                this.card.style.animationDuration = `${timeInSec}s`;
            },
            () => {
                this.card.parentNode.removeChild(this.card);
                this.card.style.animationDuration = null;
            },
            timeInSec*1000
        );

        taskQueue.continueWith(continuation);
    };

    function createFromTemplate() {
        const cardTemplate = document.getElementById('cardTemplate');
        return cardTemplate.cloneNode(true);
    }

    function signal(signalElement, speedRate, signalName, continuation) {
        const taskQueue = new TaskQueue();

        const timeInSec = 0.5/speedRate;
        taskQueue.push(
            () => {
                signalElement.classList.add(signalName);
                signalElement.classList.add('blink');
                signalElement.style.animationDuration = `${timeInSec}s`;
            },
            () => {
                signalElement.classList.remove('blink');
                signalElement.classList.remove(signalName);
                signalElement.style.animationDuration = null;
            },
            timeInSec*1000
        );

        taskQueue.continueWith(continuation);
    }

    function getOffset(element) {
        const rectangle = element.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return {
            top: rectangle.top + scrollTop,
            left: rectangle.left + scrollLeft
        };
    }

    return CardView;
}();

export default CardView;
