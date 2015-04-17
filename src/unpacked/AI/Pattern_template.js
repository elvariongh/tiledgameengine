/*! TiledGameEngine v0.0.6 - 17th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
(function(w, TGE) {
    "use strict";
    
    var _ents = [];
    
    function AIPattern() {
    };
    
    /**
     *  Bind entity instance with this AI pattern
     *  @param  {Entity}    ent     Entity to be binded
     *  @param  {Array}     args    Initialization arguments
     *  @return {Boolean}   TRUE on success, FALSE otherwise
     */
    AIPattern.bind = function(ent, args) {
        if (!args) args = [];
        
        _ents[ent['id']] = {args: args}
        return true;
    };
    
    // Register AI pattern in AI factory
    TGE.AI.register('AIPattern', AIPattern);
})(window, TiledGameEngine);