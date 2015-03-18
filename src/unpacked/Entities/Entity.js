/*! TiledGameEngine v0.0.2 - 18th Mar 2015 | https://github.com/elvariongh/tiledgameengine */
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
     *  @param {object} data            Entity initialization data object
     *  @param {object} assetManager    Reference to the TiledGameEngine.Assets instance
     *  @param {object} map             Reference to the TiledGameEngine.TiledMap instance
     */
    Entity.prototype['init'] = function(data, assetManager, map) {
        this['am'] = assetManager;
        this['map'] = map;
        
        this['x'] = data['x'] || 0;
        this['y'] = data['y'] || 0;
        this['z'] = this['x'] + this['y']*map['width']*20;
        
        this['name'] = data['name'];
        
        this['_data'] = data;
        
        this['visible'] = true;
        this['redraw'] = true;
    };
    
    /**
     *  Update entity state and return time till next update (in ms)
     *  @param  {number} dt          Time difference from previous call
     *  @param  {number} time        Time of current call
     *  @param  {array}  viewport    TypedArray with view port position and dimension: [left, top, width, height, visible]
     *  @return {number} Time till next update
     */
    Entity.prototype['update'] = function(dt, time, viewport) {
        return 1000;
    };
    
    /**
     *  Render entity to specified canvas
     *  @param {object} ctx         CanvasContext to draw in
     *  @param {object} stage       Reference to current active stage
     *  @param {array}  viewport    TypedArray with view port position and dimension: [left, top, width, height, visible]
     */
    Entity.prototype['render'] = function(ctx, stage, viewport) {
        if (!this['redraw'] || !this['visible'] || !this['img']) return;
        
        this['redraw'] = false;
    };
    
    // Register enitity type in the @EntitiesFactory
    TGE['EntitiesFactory']['register']('Entity', Entity);
})(TiledGameEngine);