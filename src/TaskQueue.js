function runNextTask(taskQueue) {
    if (taskQueue.running || taskQueue.tasks.length === 0) {
        return;
    }
    taskQueue.running = true;
    const task = taskQueue.tasks.shift();

    if (task.runAndContinue) {
        setTimeout(() => {
            task.runAndContinue(() => {
                task.dispose && task.dispose();
                taskQueue.running = false;

                setTimeout(() => {
                    runNextTask(taskQueue);
                });
            });
        }, 0);
    }
    else {
        runNextTask(taskQueue);
    }
}

class TaskQueue {
    constructor() {
        this.tasks = [];
        this.running = false;
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
        runNextTask(this);
    }
    continueWith(action) {
        this.push(action, null, 0);

    };


}

export default TaskQueue;
