const TaskQueue = function() {
    function TaskQueue() {
        this.tasks = [];
        this.running = false;
    }

    TaskQueue.prototype.push = function(run, dispose, duration) {
        if (duration === undefined || duration === null) {
            this.tasks.push({runAndContinue: run, dispose});
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
    };

    TaskQueue.prototype.continueWith = function(action) {
        this.push(action, null, 0);
    };

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

    return TaskQueue;
}();

export default TaskQueue;
