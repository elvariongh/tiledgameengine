/*! TiledGameEngine v0.0.6 - 17th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
(function(w, TGE) {
    "use strict";
    function Target() {
        // call super-class implementation
        TGE['EntitiesFactory']['entity'].call(this);

        this.scr = undefined;
        
        this.frames = 10;
        this.frame = 0;
        this.duration = 1000;
        
        this.lasttime = 0;
        this.dt = undefined;
        
        this.type = 'loop';
        this.direction = 0;
        
        this.color = 'rgba(255, 025, 025, ';
        this._alphaStep = 0.005;
        this._startAlpha = 0.05;
    };

    // super-class inheritance
    Target.prototype = Object.create(TGE['EntitiesFactory']['entity'].prototype);

    Target.prototype.init = function(data, assetManager, map) {
        // call super-class implementation
        TGE['EntitiesFactory']['entity'].prototype['init'].call(this, data, assetManager, map);
        
        if (data['fps']) {
            this.duration = 1000 / +data['fps'];
        }
        
        if (data['color']) {
            this.color = data['color'] ? data['color'] : this.color;

            var c = this.color.split(',');
            
            this._startAlpha = parseFloat(c[3]);
            this._alphaStep = this._startAlpha / this.frames;
            
            c.pop();
            
            this.color = c.join(',') + ',';
        }

        this['clickable'] = false;
        this['mutable'] = true;
    };
    
    Target.prototype.onRetain = function() {
        this.frame = 0;
        this.lasttime = 0;
    };
    
    Target.prototype.update = function update(dt, time, viewport) {
        this.redraw = false;

        if (time >= this.lasttime) {
            if (!this.lasttime) this.lasttime = time;
            while (time >= this.lasttime) {
                if (this.type === 'back_forth') {
                    if (this.direction) --this.frame;
                    else ++this.frame;

                    if (this.frame >= this.frames) {
                        this.frame = this.frames-2;
                        this.direction = 1;
                    } else if (this.frame < 0) {
                        this.direction = 0;
                        this.frame = 1;
                        
                        if (this.release) {
                            this.release();
                        }
                    }
                } else {
                    // looped
                    if (this.frame === this.frames-1) {
                        if (this.release) {
                            this.release();
                        }
                        else this.frame = (this.frame + 1) % this.frames;
                    } else {
                        this.frame = (this.frame + 1) % this.frames;
                    }
                }
                this.lasttime += this.duration;
            }
            this.redraw = true;
        }

        this.dt = this.lasttime - time;
        
        if (!this.visible) this.redraw = false;
        
        return ~~(this.dt);
    };
    
    Target.prototype.render = function render(ctx, stage, viewport) {
        if (!this.visible) return;

        if (!this.scr) {
            var scr = stage.tile2Scr( this.x, this.y);
            this.scr = new Int32Array([scr[0] - viewport[0], scr[1] - viewport[1] + ~~(this.map.tileheight/2)]);
        }
            
        ctx.save();
        ctx.beginPath();
        
        ctx.strokeStyle = this.color + (this._startAlpha - this.frame * this._alphaStep) + ')';
        ctx.lineWidth = this.frame+1;
        
        var PI2 = 2*Math.PI, x = this.scr[0] + viewport[0], y = this.scr[1] + viewport[1];
//		for (var i = 0; i < this.frame+1; ++i) {
        var i = this.frame;
            ctx.ellipse(x, y, 4 + i*4, 2 + i*2, 0, 0, PI2);
            ctx.stroke();
//		}

        ctx.closePath();
        ctx.restore();
    };
    /**
     *  Move target to new position.
     * @param   {number}    x           new X coordinate (in tiles)
     * @param   {number}    y           new Y coordinate (in tiles)
     */

     Target.prototype['move'] = function(x, y) {
        x = +x; y = +y;
        this['x'] = x;
        this['y'] = y;
        
        this['z'] = x + y*this['map']['width']*20 + 18;
        
        this.frame = 0;
        
        this.scr = undefined;

        TGE['bus']['notify']('entityMoved');
    };
    
    TGE.EntitiesFactory.register('Target', Target);
})(window, TiledGameEngine);