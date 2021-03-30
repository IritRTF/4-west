import SpeedRate from './SpeedRate.js';
import TaskQueue from './TaskQueue.js';

const PlayerView = function () {
    function PlayerView(playerRow, playerTable, inBottomRow) {
        this.inBottomRow = inBottomRow;
        this.signal = playerRow.querySelector('.playerSignal');
        this.image = playerRow.querySelector('.playerImage img');
        this.currentPower = playerRow.querySelector('.playerCurrentPower');
        this.maxPower = playerRow.querySelector('.playerMaxPower');
        this.deck = playerTable.querySelector('.deckPlace');
        this.table =  playerTable.querySelectorAll('.cardPlace');
    }

    PlayerView.prototype.updateData = function ({image, currentPower, maxPower}) {
        if (this.image) {
            this.image.setAttribute('src', `images/${image}`);
        } else {
            this.image = null;
        }
        this.currentPower.innerText = currentPower;
        this.maxPower.innerText = maxPower;
    };

    PlayerView.prototype.signalHeal = function(continuation) {
        signal(this.signal, SpeedRate.get(), 'heal', continuation);
    };

    PlayerView.prototype.signalDamage = function(continuation) {
        signal(this.signal, SpeedRate.get(), 'damage', continuation);
    };

    PlayerView.prototype.signalTurnStart = function(continuation) {
        signal(this.signal, SpeedRate.get()/2, 'turnStart', continuation);
    };

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

    return PlayerView;
}();

export default PlayerView;
