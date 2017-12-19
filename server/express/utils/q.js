// like angular promise object
var Bluebird = require("bluebird");
var q = function(fn){ return new Bluebird(fn); };


q.all       = Bluebird.all;
q.resolve   = Bluebird.resolve;
q.reject    = Bluebird.reject;
q.defer     = function(){
    var resolve, reject;
    var promise = new Bluebird(function() {
        resolve = arguments[0];
        reject = arguments[1];
    });
    return {
        resolve: resolve,
        reject: reject,
        promise: promise
    };
};
q.promisify = Bluebird.promisify;
q.timeout   = Bluebird.timeout;
q.valueOf = function(maybeQ){
    return q(function(resolve,reject){
        typeof maybeQ === "object" && maybeQ !== null && maybeQ.then ?
        maybeQ.then(resolve).catch(reject) :
        resolve(maybeQ) ;
    });
};

//extra utility
(function(q){
    var asArray = function(data){
        if(data instanceof Array){
            return data;
        }
        if(typeof data === "undefined" || data === null || data === NaN ){
            return [];
        }
        if(typeof data === "object" && typeof data.toArray === "function"){
            return data.toArray();
        }
        return [data];
    };

    q.sequance = function(data,fn,serialPipeOutMode){
        if(typeof fn === "undefined"){
            fn = function(datum){
                if(typeof datum === "function"){
                    return q(datum);
                }
            }
        }
        
        return q(function(resolve,reject){
            data = asArray(data);
            
            if(typeof serialPipeOutMode === "undefined"){
                serialPipeOutMode = typeof data[0] === "function";
            }
                
            var resolveResult = [];
            var index  = 0;
            var nextFn = function(beforeResolved){
                if(index < data.length){
                    var fnResult;
                    if(serialPipeOutMode){
                        var serialPipeOutModeFunc = data[index++];
                        if(typeof serialPipeOutModeFunc === "function"){
                            fnResult = serialPipeOutModeFunc(beforeResolved,index,data.length);
                        } else {
                            fnResult = serialPipeOutModeFunc;
                        }
                    } else {
                        fnResult = fn(data[index++],index-1);
                    }
                    
                    q.valueOf(fnResult)
                    .then(function(r){
                        resolveResult.push(r), nextFn(r);
                    })
                    .catch(function(reason){
                        if(!serialPipeOutMode && (reason instanceof Error)){
                            reason.success = data.slice(index-1);
                        }
                        reject(reason);
                    });
                    
                } else {
                    return resolve(serialPipeOutMode ? beforeResolved : resolveResult);
                }
            };
            nextFn(fn);
        }); 
    };

    q.serialExecutor = (function(){
        
        var PromisedSerialExecutor = function(){
            this.$jobs      = [];
            this.$excutable = true;
        };
        
        var getJob = function(qfn){
            return typeof qfn === "function" ? qfn : undefined;
        };
        
        var getJobs = function(qfns){
            return asArray(qfns).filter(function(fn){
                if(getJob(fn)) {
                    return true;
                } else {
                    console.log("These types can not be registered. Only functions are allowed.",fn)
                }
            });
        };
        
        var executeThis = function(pse){
            if(pse.$excutable === true && pse.$jobs.length){
                pse.$excutable = false;
                
                var job = pse.$jobs.shift();
                
                q.valueOf(job.qFn)
                .then(function(r){
                    job.defer.resolve(r);
                    pse.$excutable = true;
                    executeThis(pse);
                })
                .catch(function(r){
                    job.defer.reject(r);
                    pse.$excutable = true;
                });
            }
        };
        
        PromisedSerialExecutor.prototype = {
            reserve:function(qfn,timeout){
                qfn = getJob(qfn);
                if(qfn){
                    var defer = q.defer();
                    
                    this.$jobs.push({
                        qFn:fn,
                        defer:defer,
                        timeout:timeout || 0
                    });
                    
                    return defer.promise;
                } else {
                    throw new Error("PromisedSerialExecutor allow only Function");
                }
            },
            push:function(qfn,timeout){
                var promise = this.reserve(qfn,timeout);
                return promise ? (start(),promise) : promise;
            },
            start:function(){
                if(jobs.length){ executeThis(this); }
            }
        };
        
        return function(){
            return new PromisedSerialExecutor();
        };
    }());
    
}(q));


module.exports = q;