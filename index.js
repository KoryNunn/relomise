function Promise (fn) {
    var result;
    var success;
    var isComplete;
    var callbacks;

    function complete () {
        if (!callbacks) {
            return;
        }

        callbacks.forEach(function ([successHandler, rejectionHandler, finallyHandler]) {
            if (success) {
                successHandler && successHandler(result);
            } else {
                rejectionHandler && rejectionHandler(result);
            }

            finallyHandler && finallyHandler();
        });
    }

    function resolve (resolvedResult) {
        if (isComplete) {
            throw new Error('Promise completed more than once');
        }

        isComplete = true;
        success = true;
        result = resolvedResult;
        complete();
    }

    function reject (resolvedError) {
        if (isComplete) {
            throw new Error('Promise completed more than once');
        }

        isComplete = true;
        success = false;
        result = resolvedError;
        complete();
    }

    setTimeout(function () {
        fn(resolve, reject);
    });

    function resolveHandler (error, result, resolve, reject, handler) {
        var handlerResult = handler(error || result);
        if (handlerResult && typeof handlerResult.then === 'function') {
            handlerResult.then(resolve, reject);
        } else {
            resolve(handlerResult);
        }
    }

    function then (successHandler, rejectionHandler) {
        return new Promise(function (resolve, reject) {
            function onResolved (result) {
                resolveHandler(null, result, resolve, reject, successHandler);
            }
            function onRejected (error) {
                if (rejectionHandler) {
                    return resolveHandler(error, null, resolve, reject, rejectionHandler);
                }

                reject(error);
            }

            if (isComplete) {
                if (success) {
                    onResolved(result);
                } else {
                    if (rejectionHandler) {
                        onRejected(result);
                    } else {
                        reject(result);
                    }
                }
            }

            if (!callbacks) {
                callbacks = [];
            }

            callbacks.push([onResolved, onRejected]);
        });
    }

    function catchFn (handler) {
        return this.then(result => result, handler);
    }

    function finallyFn (handler) {
        return new Promise(function (resolve, reject) {
            if (isComplete) {
                handler();
                return;
            }

            if (!callbacks) {
                callbacks = [];
            }

            callbacks.push([null, null, handler]);
        });
    }

    this.then = then;
    this.catch = catchFn;
    this.finally = finallyFn;
}

Promise.reject = function (result) {
    return new Promise(function (resolve, reject) {
        reject(result);
    });
};

function fromIterator (fn) {
    return function AsyncFunction () {
        var args = Array.from(arguments);

        var errored;

        var lastValue;

        return new Promise(function (resolve, reject) {
            function rejectIterator (error) {
                if (errored) {
                    return;
                }
                errored = true;
                reject(error);
            }

            var generator = fn.apply(null, args);

            function run () {
                if (errored) {
                    return;
                }
                var next = generator.next(lastValue);
                if (next.done) {
                    if (errored) {
                        return;
                    }
                    return resolve(next.value);
                }
                if (next.value && typeof next.value.then === 'function') {
                    next.value
                        .then(function (value) {
                            lastValue = value;
                            run();
                        }, rejectIterator);
                    return;
                }
                lastValue = next.value;
                run();
            }

            run();
        });
    };
}

Promise.all = function (eventuals) {
    var results = [];
    var running = eventuals.length;

    return new Promise(function (resolve, reject) {
        function handleEventual(eventual, index){
            eventual.then(
                result => {
                    if (running) {
                        running--;
                        results[index] = result;

                        if (running === 0) {
                            resolve(results);
                        }
                    }
                },
                error => {
                    if (running) {
                        running = false;
                        results = null;
                        reject(error);
                    }
                }
            );
        }

        eventuals.forEach(handleEventual);
    });
};

Promise.async = fromIterator;

module.exports = Promise;
