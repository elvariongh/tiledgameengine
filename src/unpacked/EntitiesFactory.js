/*! TiledGameEngine v0.0.6 - 17th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
/** History:
 *  Who             When            What    Status  Description
 *  @elvariongh     23 Mar, 2015    #2      Fixed   isRegistered and getAssets methods implementation
 */
(function(TGE) {
    "use strict";

    var _id = 1;
    
    /** @constructor */
    function EntitiesFactory() {
        this._pool = {};        // map for pooled entities: typeName => [obj#0, obj#1...obj#N, _data]. _data - init arguments for entity
        this._poolFlags = {};   // map for pooled entites flag: typeName => [flag#0...flag#N]. Flag indicates free/busy state
    };
    
    /**
     * Register new entity type for further usage
     * @param   {String}    typeName    Entity type name, assiciated with new entity
     * @param   {Entity}    ent         Entity class to register
     */
    EntitiesFactory.prototype['register'] = function(typeName, entity) {
        this[typeName.toLowerCase()] = entity;
    };
    
    /**
     * Create new entity instance. json argument should contain at least one filed - type, 
     * which indicates required entity type
     * @param   {object}    json    JSON object for required entity
     * @return  {Entity|undefiend}  Returns new entity instance or undefined, if required 
     *                              entity type is not registered
     */
    EntitiesFactory.prototype['create'] = function(json) {
        // Check input data for entity type
        json['type'] = json['type'].toLowerCase();

        if (!json['type']) return undefined;

        // Check if required entity type is registered
        var t = json['type'].toLowerCase();
        
        if (!this[t]) return undefined;

        // Create entity and return new instance
        var ent = new this[t]();
        ent['id'] = _id++;
        ent['init'].apply(ent, arguments);

        return ent;
    };

    /**
     * Create new pool of specified entity type. json argument should contain at least on field - type,
     * which indicates required entity type.
     * Other optional parameters:
     *  json['poolSize']    Initial pool size for that entity type
     * @param   {object}    json    JSON object with pool and entity description
     * @return  {Boolean}   TRUE on successfull pool creating, FALSE otherwise
     */
    EntitiesFactory.prototype['createPool'] = function(json) {
        // Check input data for entity type

        if (!json['type']) return false;

        // Check if required entity type is registered
        var t = json['type'] = json['type'].toLowerCase();
//        var t = json['type'].toLowerCase();
        if (!this[t]) return false;

        // Check if pool for that type of entities already exists
        if (this._pool[t]) {
            // pool for that Entity type already exists
            return true;
        } 
        
        json['poolSize'] = json['poolSize'] || 10;  // default pool size is 10
//        json['type'] = t;

        var pool = new Array(json['poolSize']);

        for (var i = 0; i < json['poolSize']; ++i) {
            var ent = this._makeShared(t);// new this[t]();

            ent['_idx'] = i;

            ent['init'].apply(ent, arguments);

            pool[i] = ent;
        }

        pool['_data'] = arguments;

        this._pool[t] = pool;
        this._poolFlags[t] = new Array(json['poolSize']);
		
		for (i = 0; i < json['poolSize']; ++i) {
			this._poolFlags[t][i] = 0;
		}
        
        return true;
    };

    /**
     * Return pooled entity from the pool. If entity object has onRetain method it will be called
     * @param   {String}    type    Required entity type
     * @return  {Entity|undefined}  If required entity type is not registered or 
     *                              it is not pooled - returns undefiend. Entity object on success.
     */
    EntitiesFactory.prototype['retain'] = function(type) {
        type = type.toLowerCase();

        if (!this[type]) return undefined;

        if (!this._pool[type]) return undefined;

        var ent = undefined;

        for (var i = 0, l = this._pool[type].length; i < l; ++i) {
            if (!this._poolFlags[type][i]) {
                this._poolFlags[type][i] = 1;

                ent = this._pool[type][i];
                ent['id'] = _id++;
                
                break;
            }
        }

        // no free room in pool - increase room
        if (!ent) {
            ent = this._makeShared(type);// new this[type]();
            ent['_idx'] = this._pool[type].length;
            ent['id'] = _id++;
            ent['init'].apply(ent, this._pool[type]['_data']);

            this._pool[type][this._pool[type].length] = ent;
            this._poolFlags[type][this._pool[type].length] = 1;
        }

        if (ent['onRetain']) ent['onRetain'].apply(ent);

        return ent;
    }

    /**
     * Release previously retained entity and mark it as free to reuse. 
     * If entity object has onRelease method it will be called.
     * @param   {Entity}    obj Entity object to be released
     * @return  {Boolean}   TRUE on success, FALSE otherwise
     */
    EntitiesFactory.prototype['release'] = function(obj) {
        var type = obj['_type'].toLowerCase(),
            idx = obj['_idx'];

        if (idx < 0 || idx === undefined) return false;

        if (!this[type]) return false;

        if (!this._pool[type]) return false;

        if (this._pool[type].length <= idx) return false;

        this._poolFlags[type][idx] = 0;

        obj['visible'] = false;

        TGE['bus']['notify']('entityReleased', obj);

        return true;
    };

    EntitiesFactory.prototype['isRegistered'] = function(typeName) {
        if (!this[typeName.toLowerCase()]) return false;

        return true;
    };

    EntitiesFactory.prototype['getAssets'] = function(typeName, obj) {
        if (!this[typeName.toLowerCase()]) return undefined;

        return this[typeName.toLowerCase()]['getAssets'](obj);
    };
    
    EntitiesFactory.prototype._makeShared = function(type) {
        if (!this['_'+type+'Shared']) {
            function shared() { TGE['EntitiesFactory'][type].call(this); };
            shared.prototype = Object.create(this[type].prototype);
            shared.prototype['release'] = function() { 
                TGE['EntitiesFactory']['release'](this); 
            };
            
            this['_'+type+'Shared'] = shared;
        }

        return new this['_'+type+'Shared'];
    };
    
    TGE['EntitiesFactory'] = new EntitiesFactory();
})(TiledGameEngine);