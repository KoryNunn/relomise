# Reliable Promise

An example of how Promises should have been.

## Usage

```
var Promise = require('relomise');
```

## Why

Promises should not catch thrown errors, we have very simple ways of dealing with rejections. try-catch is not only unneccissary, but detrimental to flow control.

## Examples


Have a look at the [tests](./test/index.js) to see how it would work.




That said, the Promise API is kinda average reguardless, and unneccissarily adds complexity over the CPS pattern.

We *could* have had:

```
function Promise(function(callback) {
    ...code...
    callback(error, result)
})
```

that would have made interop much more simple:

```
var myFile = await new Promise(callback => fs.readFile('fileName.txt', 'utf8', callback))
```

Or even neater: (Like how [righto](github.com/korynunn/righto) is implemented)

```
// NOT a constructor
promise(function(...args, callback){ }, args...)
```

that would have made interop seamless:

```
var myFile = await promise(fs.readFile, 'fileName.txt', 'utf8')
```

But instead we got this:

```
var myFile = await new Promise((reject, resolve) => fs.readFile('fileName.txt', 'utf8', function(error, result){
    if(error){
        reject(error)
    } else {
        resolve(result)
    }
}))
```