/*! TiledGameEngine v0.0.5 - 07th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
(function(w, TGE) {
    "use strict";
	function NewEntity() {
        // call super-class implementation
        TGE['EntitiesFactory']['entity'].call(this);

        this.scr = undefined;
	};

    // super-class inheritance
    NewEntity.prototype = Object.create(TGE['EntitiesFactory']['entity'].prototype);

    NewEntity.prototype.init = function(data, assetManager, map) {
        // convert source data to the entities coordinates
        // data.x = data.x / map.tilewidth * 2;
        // data.y = data.y / map.tileheight;

        // call super-class implementation
        TGE['EntitiesFactory']['entity'].prototype['init'].call(this, data, assetManager, map);
	};
	
    Unit.prototype.update = function update(dt, time, viewport) {
        this.redraw = true;
        if (!this.animation) {
            return 1000;
        }
	};
	
    Unit.prototype.render = function render(ctx, stage, viewport) {
        if (!this.visible) return;

        if (!this.scr) {
            var scr = stage.tile2Scr( this.x, this.y);
            this.scr = new Int32Array([scr[0] - viewport[0], scr[1] - viewport[1] + ~~(this.map.tileheight/2)]);
        }

		var color = 'rgba(255, 0, 0, 0.5)',
			bgcolor = 'rgba(255, 0, 0, 0.25)';
		ctx.beginPath();
		ctx.ellipse(this.scr[0] + viewport[0], this.scr[1] + viewport[1], 20, 10, 0, 0, 2*Math.PI);
		ctx.strokeStyle = color;
		ctx.fillStyle = bgcolor;
		ctx.lineWidth = 1;
		ctx.fill();
		ctx.stroke();
		ctx.closePath();
	};
	
    TGE.EntitiesFactory.register('NewEntity', NewEntity);
})(window, TiledGameEngine);