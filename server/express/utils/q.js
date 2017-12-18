// like angular promise object
var Bluebird = require("bluebird");
var q = function(fn){ return new Bluebird(fn); };

q.defer     = Bluebird;
q.all       = Bluebird.all;
q.resolve   = Bluebird.resolve;
q.reject    = Bluebird.reject;
q.reduce    = Bluebird.reduce;
q.race      = Bluebird.race;
q.promisify = Bluebird.promisify;
q.sequance =  (function(){
    
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
    
    return function(data,fn,serialPipeOutMode){
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
                    
                    if(typeof fnResult === "object" && fnResult !== null && fnResult.then){
                        fnResult.then(function(r){
                            resolveResult.push(r);
                            return nextFn(r),r;
                        }).catch(function(reason){
                            if(!serialPipeOutMode && (reason instanceof Error)){
                                reason.success = data.slice(index-1);
                            }
                            return reject(reason);
                        });
                    } else {
                        resolveResult.push(fnResult);
                        nextFn(fnResult);
                    }
                } else {
                    return resolve(serialPipeOutMode ? beforeResolved : resolveResult);
                }
            };
            nextFn(fn);
        }); 
    };
}())

module.exports = q;