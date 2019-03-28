var test = require('tape');
var Promise = require('../');
var async = Promise.async;

function makeAnEventualPromiseThatResolves (value) {
    return new Promise(resolve => setTimeout(() => resolve(value), 100));
}

test('Normal promise stuff works', function (t) {
    t.plan(8);

    var foo = new Promise(function (resolve, reject) {
        resolve(2);
    });
    var bar = new Promise(function (resolve, reject) {
        resolve(6);
    });
    var baz = bar.then(result => result * 2);
    var fail = foo.then(result => Promise.reject(result));
    var recover = fail.catch(result => result);
    var recover2 = fail.then(() => {}, result => result);

    foo.then(t.pass);
    bar.then(t.pass);
    baz.then(t.pass);
    fail.catch(t.pass);
    recover.then(t.pass);
    recover2.then(t.pass);
    foo.finally(t.pass);
    fail.finally(t.pass);
});

test('Throwing stuff', function (t) {
    t.plan(1);

    process.once('uncaughtException', function (error) {
        t.equal(error.message, 'Dont catch me');
    });

    var promise = new Promise(function (resolve, reject) {
        throw new Error('Dont catch me');
    });

    promise.then(t.fail);
});

test('Async/await working', async function (t) {
    t.plan(1);

    var foo = await new Promise(function (resolve, reject) {
        resolve(2);
    });

    t.equal(foo, 2);

    try {
        await Promise.reject(new Error('fail'));

        t.fail('Should not hit');
    } catch (error) {
        // This is just to stop the process from crashing.
    }
});

test('Async/await with recovery', async function (t) {
    t.plan(2);

    var foo = await new Promise(function (resolve, reject) {
        resolve(2);
    });

    t.equal(foo, 2);

    var error = await Promise.reject(new Error('fail'))
        .catch(error => error);

    t.equal(error.message, 'fail');
});

test('Async/await with thrown execptions', function (t) {
    t.plan(1);

    async function myTask () {
        return new Promise(function (resolve, reject) {
            throw new Error('Dont catch me');
        });
    }

    process.once('uncaughtException', function (error) {
        t.equal(error.message, 'Dont catch me');
    });

    myTask().catch(() => t.fail('Should not have caught this'));
});

test('Fixes "Async/await"', function (t) {
    t.plan(1);

    var myTask = async(function * () {
        var promiseA = makeAnEventualPromiseThatResolves(1);
        var promiseB = makeAnEventualPromiseThatResolves(2);

        var a = yield promiseA;
        var b = yield promiseB;
        var result = a + b;

        return result;
    });

    myTask().then(result => t.equal(result, 3));
});

test('Fixes "Async/await" throws', function (t) {
    t.plan(1);

    var myTask = async(function * () {
        throw new Error('Dont catch me');
    });

    process.once('uncaughtException', function (error) {
        t.equal(error.message, 'Dont catch me');
    });

    myTask().catch(() => t.fail('Should not have caught this'));
});

test('.all success', function (t) {
    t.plan(1);

    var promiseA = makeAnEventualPromiseThatResolves(1);
    var promiseB = makeAnEventualPromiseThatResolves(2);

    var all = Promise.all([promiseA, promiseB]);

    all.then(results => t.deepEqual(results, [1, 2]));
});

test('.all 1 failure', function (t) {
    t.plan(1);

    var promiseA = makeAnEventualPromiseThatResolves(1);
    var promiseB = makeAnEventualPromiseThatResolves(2)
        .then(() => Promise.reject(new Error('My error')));

    var all = Promise.all([promiseA, promiseB]);

    all.catch(error => t.equal(error.message, 'My error'));
});

test('.all 2 failures', function (t) {
    t.plan(1);

    var promiseA = makeAnEventualPromiseThatResolves(1)
        .then(() => Promise.reject(new Error('My error 1')));
    var promiseB = makeAnEventualPromiseThatResolves(2)
        .then(() => Promise.reject(new Error('My error 2')));

    var all = Promise.all([promiseA, promiseB]);

    all.catch(error => t.equal(error.message, 'My error 1'));
});
