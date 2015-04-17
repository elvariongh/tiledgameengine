/*! TiledGameEngine v0.0.6 - 17th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
/** History:
 *  Who             When            What    Status  Description
 *  @elvariongh     23 Mar, 2015    #2      Fixed   getAssets static method interface added
 */
(function(TGE) {
    "use strict";
    /** 
     *  @constructor
     *  Entity class constructor to define all internal variables
     */
    function Entity() {
        this['am'] = undefined;                 // Reference to #assetManager
        this['map'] = undefined;                // Reference to #TiledMap
        
        this['img'] = undefined;                // Entity image, if required
        
        this['visible'] = false;                // Is entity visible in viewport
        this['clickable'] = false;              // Does entity can be selected by click/tap
        this['redraw'] = false;                 // Does redraw require on next AF
        this['mobile'] = false;                 // Does entity can move on map
        this['mutable'] = false;                // Does entity can change its internal state (does update required)
        this['bus'] = undefined;                // Private notification bus
        
        this['id'] = undefined;                 // Entity ID
        this['_type'] = undefined;              // Entity type
        this['name'] = '';                      // Entity name

        this['x'] = this['y'] = this['z'] = 0;  // Entity coordinates and z-index

        this['binded'] = undefined;             // Reference to other entity binded to
        this['_sidUpdate'] = -1;                // SID for other entity update notification
        this['_sidMove'] = -1;                  // SID for other entity move notification
        
//        this['_aidx'] = -1;
    };
    
    /** 
     *  Initialize entity, parse entity data and prepare other entity-related stuff
     *  @param  {object}    data            Entity initialization data object
     *  @param  {object}    assetManager    Reference to the TiledGameEngine.Assets instance
     *  @param  {object}    map             Reference to the TiledGameEngine.TiledMap instance
     */
    Entity.prototype['init'] = function(data, assetManager, map) {
        this['_type'] = data['type'];

        this['am'] = assetManager;
        this['map'] = map;
        
        this['x'] = data['x'] || 0;
        this['y'] = data['y'] || 0;
        this['z'] = this['x'] + this['y']*map['width']*20;
        
        this['name'] = data['name'];
        
//        this['_data'] = data;
        
        this['visible'] = true;
        this['redraw'] = true;
        this['clickable'] = true;
        this['bus'] = new TGE['PubSub']();
        
        this['binded'] = undefined;
        
        this['_sidUpdate'] = -1;
        this['_sidMove'] = -1;

        // get custom properties
        if (data['properties']) {
            if (data['properties']['clickable']) {
                // define if entity can be selected by tap/click
                this['clickable'] = (data['properties']['clickable'] === 'false' || data['properties']['clickable'] === '0') ? 0 : 1;
            }

            if (data['properties']['mobile']) {
                // define if entity is able to move. I.e. Unit can move, but teleport is not
                this['mobile'] = (data['properties']['mobile'] === 'true' || data['properties']['mobile'] === '1') ? 1 : 0;
            }
            
            if (data['properties']['behavior']) {
                // behavior pattern
                if (TGE.AI) {
                    // split string representation of arguments to regular array
                    var b = data['properties']['behavior'].split('(');
                    
                    if (b.length > 1) {
                        b[1] = b[1].split(')')[0].split(',');
                    }
                    
                    // set "brains" for that entity
                    TGE.AI.bind(this, b[0], b[1]);
                }
            }
        }

        if (data['visible']) {
            // initial visible state of entity
            this['visible'] = (data['visible'] === 'false' || data['visible'] === '0') ? 0 : 1;
        }
    };
    
    /**
     *  Update entity state and return time till next update (in ms)
     *  @param  {number}    dt          Time difference from previous call
     *  @param  {number}    time        Time of current call
     *  @param  {array}     viewport    TypedArray with view port position and dimension: [left, top, width, height, visible]
     *
     *  @return {number}    Time till next update
     */
    Entity.prototype['update'] = function(dt, time, viewport) {
        return 1000;
    };
    
    Entity.prototype['isVisible'] = function(viewport) {
        return this['visible'];
    };
    
    /**
     *  Render entity to specified canvas
     *  @param  {object}    ctx         CanvasContext to draw in
     *  @param  {object}    stage       Reference to current active stage
     *  @param  {array}     viewport    TypedArray with view port position and dimension: [left, top, width, height, visible]
     */
    Entity.prototype['render'] = function(ctx, stage, viewport) {
        if (!this['redraw'] || !this['visible'] || !this['img']) return;
        
        this['redraw'] = false;
    };
    
    /**
     *  Move entity to new position.
     * @param   {number}    x           new X coordinate (in tiles)
     * @param   {number}    y           new Y coordinate (in tiles)
     */
    Entity.prototype['move'] = function(x, y) {
        x = +x; y = +y;
        this['x'] = x;
        this['y'] = y;
        
        this['z'] = x + y*this['map']['width']*20;

        TGE['bus']['notify']('entityMoved');
    };
    
    /**
     *  Parse source entity data object and return assets, required to be loaded. This is a 
     *  static method for class, that is not assigned with particular instance
     *  @param  {object}    obj     Source entity data to be parsed. It it the same 
     *                              data, that should be passed to the init method of instance
     *
     *  @return {undefined|Array}   Returns array of assets to be loaded or undefined, if not required
     */
    Entity['getAssets'] = function(obj) {
        return undefined;
    };
    
    /**
     *  Bind one entity to other entity modifications
     *  @param  {object}    ent     Spectating entity object
     */
    Entity.prototype['bind'] = function(ent) {
        if (this['binded']) { this['unbind'](this['binded']); };
        
        if (ent) {
            this['_sidUpdate']      = ent['bus']['subscribe']('entityUpdated',    this['onEntityUpdated'].bind(this));
            this['_sidMove']        = ent['bus']['subscribe']('entityMoved',      this['onEntityMoved'].bind(this));
            this['_sidBreakLinks']  = ent['bus']['subscribe']('_breakLinks',      this['onBreakLinks'].bind(this));
            
            this['binded'] = ent;
        }
    };
    
    Entity.prototype['unbind'] = function(ent) {
        if (!ent) ent = this['binded'];

        if (ent) {
            ent['bus']['unsubscribe']('entityUpdated', this['_sidUpdate']);
            ent['bus']['unsubscribe']('entityMoved', this['_sidMove']);
        }

        this['_sidMove'] = this['_sidUpdate'] = -1;
        this['binded'] = undefined;
    };
    
    Entity.prototype['onBreakLinks'] = function(k, v) {
        this['unbind'](v);

        if (this.release) {
            this.release();
        }
    };
    
    Entity.prototype['breakLinks'] = function() {
        this['bus']['notify']('_breakLinks', this);
    };
    
    Entity.prototype['onEntityUpdated'] = function(key, ent) {
    };

    Entity.prototype['onEntityMoved'] = function(key, ent) {
    };

    // Register enitity type in the @EntitiesFactory
    TGE['EntitiesFactory']['register']('Entity', Entity);
})(TiledGameEngine);