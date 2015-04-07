/*! TiledGameEngine v0.0.5 - 07th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
(function(TGE) {
    // @constructor
    // Publish-Subscruber pattern implementation
    function PubSub() {
        /** @private */
        this.handlers = {};
    }
    
    // Add new handler for event == key
    PubSub.prototype['subscribe'] = function(key, handler) {
        key = key.toLowerCase();
        if (this.handlers[key] === undefined)
            this.handlers[key] = [];
        this.handlers[key].push(handler);
        
        return this.handlers[key].length - 1;
    };

        // Remove handler for key
    PubSub.prototype['unsubscribe'] = function(key, sid) {
        key = key.toLowerCase();

        if (!this.handlers[key])
            return;

//          var index = this.handlers[key].indexOf(handler)
// @2Do: replace slice with other alg
          if (~sid) {
            this.handlers[key].splice(sid, 1)
            
            if (!this.handlers[key].length) {
                delete this.handlers[key];
            }
          }
    };

        // Notify all handlers for the specified key. Value is optional
    PubSub.prototype['notify'] = function(key, value) {
        key = key.toLowerCase();

        if (!this.handlers[key])
            return;

        for (var i = this.handlers[key].length; i--;) {
            if (value) {
                this.handlers[key][i](key, value);
            } else {
                this.handlers[key][i](key);
            }
        }
    };
    
    TGE['PubSub'] = PubSub;
    TGE['bus'] = new TGE['PubSub']();
})(TiledGameEngine);