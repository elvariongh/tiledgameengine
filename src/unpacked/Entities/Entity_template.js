/*! TiledGameEngine v0.0.6 - 17th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
(function(w, TGE) {
    "use strict";
    function NewEntity() {
        // call super-class implementation
        TGE['EntitiesFactory']['entity'].call(this);

        // cached value of entity screen position
        this.scr = undefined;
    };

    // super-class inheritance
    NewEntity.prototype = Object.create(TGE['EntitiesFactory']['entity'].prototype);

    NewEntity.prototype.init = function(data, assetManager, map) {
        // convert source data: screen coordinates to the tile coordinates, if any
        // data.x = data.x / map.tilewidth * 2;
        // data.y = data.y / map.tileheight;

        // call super-class implementation
        TGE['EntitiesFactory']['entity'].prototype['init'].call(this, data, assetManager, map);
    };

    NewEntity.prototype.update = function update(dt, time, viewport) {
        this.redraw = true;
        if (!this.animation) {
            this.redraw = false;
            return 1000;
        }
    };

    NewEntity.prototype.render = function render(ctx, stage, viewport) {
        if (!this.visible) return;
    };

    TGE.EntitiesFactory.register('NewEntity', NewEntity);
})(window, TiledGameEngine);