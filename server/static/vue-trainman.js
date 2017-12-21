(function(global, factory){
    
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.VueTrainman = factory());
    
}(this, function(){
    var VueTrainman = function(){};
    
    VueTrainman.install = function(Vue, options){
        
        var VueMixin = {};
        
        //router act helper
        Object.defineProperty(Vue.prototype, '$act', {
            get: function(){ 
                return this._self.$route && (this._self.$route.meta.act || this._self.$route.params.act);
            }
        });
        
        Vue.prototype.$train = {
            toggle:function(ta,cv,set){
                var index = -1;
                for(var i=0,l=ta.length;i<l;i++) if(ta[i] === cv) {index=i+1;break;}
                if(arguments.length > 2) for(var i=0,l=ta.length;i<l;i++) if( ta[i] == set ) return ta[i];
                index = ta.length == index ? 0 : index;
                return ta[index];
            }
        };
        
        var AutoPopCache = (function(){
            var AutoPopCache = function(){
                this.$cache = [];
            };
            
            AutoPopCache.prototype = {
                $append:function(meta){
                    typeof meta === "object" && this.$cache.push(meta);
                }
            };
            
            return (new AutoPopCache());
        }());
        
        VueMixin.beforeRouteUpdate = function(to,from,next){
            AutoPopCache.$cache = AutoPopCache.$cache.filter(function(meta){
                if(meta.fullPath === to.fullPath){
                    meta.pop();
                    return false;
                }
                return true;
            });
            next();
        };
        
        // $track
        VueMixin.created = function(){
            this.$track = {};
        };
        
        function cloneDeep(obj){
            try {
                return JSON.parse(JSON.stringify(obj));
            } catch(e) {
                console.error("Problemalling",obj);
                throw e;
            }
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
                trackDock.push(cloneDeep(this[key]));
            }
            
            if(this.$route && autoPop === true){
                AutoPopCache.$append({
                    fullPath:this.$route.fullPath,
                    pop:function(){ this.$pop(key); }.bind(this)
                });
            }
        };
        
        Vue.prototype.$freez = function(key){
            if(!key) return console.warn("require string type track key",key);
            var trackDock = touchTrack(this,key);
            if(trackDock){
                Array.prototype.splice.call(trackDock,0,trackDock.length);
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