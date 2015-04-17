/*! TiledGameEngine v0.0.6 - 17th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
(function(w, TGE) {
    "use strict";
    /** @constructor */
    function AI() {};

    /**
     * Register new behavior pattern for further usage
     * @param   {String}    name    AI behavior pattern name name
     * @param   {AIPattern} gears   AI behavior class to register
     */
    AI.prototype['register'] = function(name, gears) {
        this[name.toLowerCase()] = gears;
    };
    
    /**
     * Link AI behavior pattern with entitiy.
     * @param   {Entity}    entity  Entity object to link
     * @param   {String}    name    AI behavior pattern name
     * @param   {Array}     args    Initialization arguments for AI pattern
     * @return  {Boolean}   TRUE on success, FALSE otherwize
     */
    AI.prototype['bind'] = function(entity, name, args) {
        if (!entity) return false;
        name = name.toLowerCase();
        if (!this[name]) return false;
        
        return this[name]['bind'](entity, args);
    };

    TGE['AI'] = new AI();
})(window, TiledGameEngine);