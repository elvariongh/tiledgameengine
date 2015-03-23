/*! TiledGameEngine v0.0.4 - 23th Mar 2015 | https://github.com/elvariongh/tiledgameengine */
/** History:
 *	Who				When			What	Status	Description
 *  @elvariongh		23 Mar, 2015	#2		Fixed	isRegistered and getAssets methods implementation
 */
(function(TGE) {
    "use strict";

    /** @constructor */
    function EntitiesFactory() {
		this._pool = {};
		this._poolFlags = {};
    };
    
    EntitiesFactory.prototype['register'] = function(typeName, entity) {
        this[typeName.toLowerCase()] = entity;
    };
    
    EntitiesFactory.prototype['create'] = function(json) {
		// Check input data for entity type
        if (!json['type']) return undefined;

		// Check if required entity type is registered
        var t = json['type'].toLowerCase();
		if (!this[t]) return undefined;

		// Create entity and return new instance
		var ent = new this[t]();
		ent['init'].apply(ent, arguments);
		
		return ent;
    };
	
	EntitiesFactory.prototype['createPool'] = function(json) {
		// Check input data for entity type
        if (!json['type']) return false;

		// Check if required entity type is registered
        var t = json['type'].toLowerCase();
		if (!this[t]) return false;
		
		// Check if pool for that type of entities already exists
		if (this._pool[t]) {
			// pool for that Entity type already exists
			return true;
		} 
		json['poolSize'] = json['poolSize'] || 10;	// default pool size is 10
		json['type'] = t;
		
		// Pool array item structure:
		// {	busy: 	@boolean,
		//		obj:	@Entity }
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
		
		return true;
	};
	
	EntitiesFactory.prototype['retain'] = function(type) {
		type = type.toLowerCase();
		
		if (!this[type]) return undefined;
		
		if (!this._pool[type]) return undefined;
		
		for (var i = 0, l = this._pool[type].length; i < l; ++i) {
			if (!this._poolFlags[type][i]) {
				this._poolFlags[type][i] = 1;
				
				return this._pool[type][i];
			}
		}
		
		// no free room in pool - increase room
		var ent = this._makeShared(type);// new this[type]();
		ent['_idx'] = this._pool[type].length;
		ent['init'].apply(ent, this._pool[type]['_data']);
		
		this._pool[type][this._pool[type].length] = ent;
		this._poolFlags[type][this._pool[type].length] = 1;

		return ent;
	}
	
	EntitiesFactory.prototype['release'] = function(obj) {
		var type = obj['type'].toLowerCase(),
			idx = obj['_idx'];

		if (idx < 0 || idx === undefined) return false;

		if (!this[type]) return false;
		
		if (!this._pool[type]) return false;
		
		if (this._pool[type].length <= idx) return false;
		
		this._poolFlags[type][idx] = 0;
		
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
		function shared() { TGE['EntitiesFactory'][type].call(this); };
		shared.prototype = Object.create(TGE['EntitiesFactory'][type].prototype);
		shared.prototype['release'] = function() { TGE['EntitiesFactory']['release'](this); };

		return new shared();
	};
    
    TGE['EntitiesFactory'] = new EntitiesFactory();
})(TiledGameEngine);