// like angular promise object
var Promise = require("bluebird");

var q = function(fn){ return new Promise(fn); };

q.all     = Promise.all;
q.resolve = Promise.resolve;
q.reject  = Promise.reject;
q.reduce  = Promise.reduce;
q.race    = Promise.race;
q.sequance = function(tasks){
    var current = Promise.cast(), results = [];
    for (var i = 0; i < tasks.length; ++i) {
        results.push(current = current.thenReturn().then(tasks[i]));
    }
    return Promise.all(results);
};

module.exports = q;