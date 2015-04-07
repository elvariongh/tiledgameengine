/*! TiledGameEngine v0.0.5 - 07th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
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
        this['am'] = undefined;
        this['map'] = undefined;
        
        this['x'] = this['y'] = this['z'] = 0;
        this['name'] = '';
        
        this['img'] = undefined;
        
        this['redraw'] = false;
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
        
        this['visible'] = true;             // if true - this entity will be rednered in viewport
        this['redraw'] = true;              // if true - this entity should be redrawn
        this['clickable'] = true;           // if true - this entity could be selected by tap/click
        this['bus'] = new TGE['PubSub']();  // internal notification bus for followers
        
        this['binded'] = undefined;         // reference to the binded object
        
        this['_sidUpdate'] = -1;
        this['_sidMove'] = -1;
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
     *  Start listening for other entity modifications events
     *  @param  {Entity}    ent     Spectating entity object
     */
    Entity.prototype['bind'] = function(ent) {
//        ent['onEntityUpdated'] = this._onEntityUpdated.bind(this);

        if (this['binded']) { this['unbind'](this['binded']); };
        
        if (ent) {
            this['_sidUpdate'] = ent['bus']['subscribe']('entityUpdated',    this['onEntityUpdated'].bind(this));
            this['_sidMove'] = ent['bus']['subscribe']('entityMoved',      this['onEntityMoved'].bind(this));
            
            this['binded'] = ent;
        }
    };
    
    /**
     *  Stop listening for other entity events
     *  @param  {Entity|undefined}  ent     Entity object to unbind
     */
    Entity.prototype['unbind'] = function(ent) {
        if (!ent) ent = this['binded'];

        if (ent) {
            ent['bus']['unsubscribe']('entityUpdated', this['_sidUpdate']);
            ent['bus']['unsubscribe']('entityMoved', this['_sidMove']);
        }

        this['_sidMove'] = this['_sidUpdate'] = -1;
        this['binded'] = undefined;
    };
    
    /**
     *  3rd part entity update notification handler
     */
    Entity.prototype['onEntityUpdated'] = function(key, ent) {
    };

    /**
     *  3rd part entity move notification handler
     */
    Entity.prototype['onEntityMoved'] = function(key, ent) {
    };

    // Register enitity type in the @EntitiesFactory
    TGE['EntitiesFactory']['register']('Entity', Entity);
})(TiledGameEngine);