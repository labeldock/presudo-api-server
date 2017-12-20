(function(global, factory){
    
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.VueTrainman = factory());
    
}(this, function(){
    var VueTrainman = function(){};
    
    VueTrainman.snapshot = function(){
        
    };
    
    VueTrainman.install = function(Vue, options){
        
        var VueMixin = {};
        
        //router action helper
        Object.defineProperty(Vue.prototype, '$action', {
            get: function(){ 
                return this._self.$route && this._self.$route.params.action;
            }
        });
        
        VueMixin.beforeRouteUpdate = function(to,from,next){
            console.log("to",to);
            next();
        };
        
        var AutoPopCache = (function(){
            var AutoPopCache = function(){};
            
            AutoPopCache.prototype = {
                $append:function(){
                    
                },
                $delete:function(){
                    
                }
            };
            
            return (new AutoPopCache());
        }());
        
        // $track
        
        VueMixin.created = function(){
            this.$track = {};
        };
        
        function touchTrack(vueInstance,key){
            if(!vueInstance.$track){
                vueInstance.$track = {};
            }
            if(!vueInstance.$track[key]){
                vueInstance.$track[key] = [];
            }
            return vueInstance.$track[key];
        };
        
        Vue.prototype.$stash = function(key,autoPop){
            if(!key) return console.warn("require string type track key",key);
            var trackDock = touchTrack(this,key);
            if(trackDock){
                trackDock.push(JSON.parse(JSON.stringify(this[key])));
            }
            
            if(this.$route && autoPop === true){
                AutoPopCache[ this.$route.fullPath ] = {
                    
                }
            }
        };
        
        Vue.prototype.$freez = function(key,autoBack){
            if(!key) return console.warn("require string type track key",key);
            var trackDock = touchTrack(this,key);
            if(trackDock){
                this.$pop(key,false);
            }
        };
        
        Vue.prototype.$pop = function(key,revert){
            if(!key) return console.warn("require string type track key",key);
            var trackDock = touchTrack(this,key);
            
            if(trackDock && trackDock.length){
                if(revert === false){
                    return trackDock.pop();
                } else {
                    this[key] = trackDock.pop();
                    return this[key];
                }
            }
        };
        
        //router-link 디렉티브
        Vue.directive("router-link",{
            bind:function(el){
                el.addEventListener("click",function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    var linkTo = el.getAttribute("to");
                                
                    if(linkTo){
                        Vue.nextTick();
                        router.push(linkTo);
                    }
                });
            }
        });
        
        Vue.mixin(VueMixin);
    };
    
    return VueTrainman;
}));