module.exports = (function(){
    
    var Listener = function(){
        this.$events = {};
    }
    
    function destroyFactory(events, eventName, listenFn){
        return function destroyFn(){
            var eventScope = events[eventName];
            if(eventScope){
                for(var d=eventScope,i=0,l=d.length;i<l;i++){
                    if(d[i] == listenFn){
                        events[eventName].splice(i,1);
                        return true;
                        break;
                    }
                }
            }
            return false;
        };
    };
    
    Listener.prototype = {
        emit:function(eventName){
            if(this.$events[eventName]){
                var args = Array.prototype.slice.call(arguments,1);
                return this.$events[eventName].map(function(fn){
                    return fn.apply(fn,args);
                });
            }
            
        },
        on:function(eventName,listenFn){
            if(!this.$events[eventName]){
                this.$events[eventName] = [];
            }
            if(typeof listenFn === "function"){
                this.$events[eventName].push(listenFn);
                return destroyFactory(this.$events, eventName, listenFn);
            } else {
                return function destroyFn(){/* no have destroyed */};
            }
        },
        off:function(eventName,listenFn){
            return destroyFactory(this.$events, eventName,listenFn)();
        },
        retains:function(){
            var events = this.$events;
            return Object.keys(events).reduce(function(result,key){
                result[key] = events[key].length;
                return result;
            },{});
        }
    };
    
    return function(){
        return new Listener();
    };
}())