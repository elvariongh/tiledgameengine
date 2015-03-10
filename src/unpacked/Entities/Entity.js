/*! TiledGameEngine v0.0.1 - 10th Mar 2015 | https://github.com/elvariongh/tiledgameengine */
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
     *  Initialize entity
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
     *  @param {number} dt          Time difference from previous call
     *  @param {number} time        Time of current call
     *  @param {array}  viewport    TypedArray with view port position and dimenstion: [left, top, width, height, visible]
     */
    Entity.prototype['update'] = function(dt, time, viewport) {
        return 1000;
    };
    
    /**
     *  @param {object} ctx         CanvasContext to draw in
     *  @param {object} stage       Reference to current active stage
     *  @param {array}  viewport    TypedArray with view port position and dimenstion: [left, top, width, height, visible]
     */
    Entity.prototype['render'] = function(ctx, stage, viewport) {
        if (!this['redraw'] || !this['visible'] || !this['img']) return;
        
        this['redraw'] = false;
    };
    
    TGE['EntitiesFactory']['register']('Entity', Entity);
})(TiledGameEngine);