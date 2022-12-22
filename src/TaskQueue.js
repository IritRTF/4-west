export default class TaskQueue {
    constructor() {
        this.tasks = [];
    }

    push(run, dispose, duration) {
        if (duration === undefined || duration === null) {
            this.tasks.push({ runAndContinue: run, dispose });
        } else {
            this.tasks.push({
                runAndContinue: (continuation) => {
                    run();
                    setTimeout(() => {
                        continuation();
                    }, duration);
                },
                dispose
            });
        }
        nextTask(this);
    };

    continueWith(action) {
        this.push(action, null, 0);
    };
};

function nextTask(taskQueue) {
    if (taskQueue.running || taskQueue.tasks.length === 0) {
        return;
    }
    taskQueue.running = true;
    const currentTask = taskQueue.tasks.shift();

    if (currentTask.runAndContinue) {
        setTimeout(() => {
            currentTask.runAndContinue(() => {
                currentTask.dispose && currentTask.dispose();
                taskQueue.running = false;

                setTimeout(() => {
                    nextTask(taskQueue);
                });
            });
        }, 0);
    } else {
        nextTask(taskQueue);
    }
}

nextTask(new TaskQueue());