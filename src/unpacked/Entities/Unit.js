/*! TiledGameEngine v0.0.2 - 18th Mar 2015 | https://github.com/elvariongh/tiledgameengine */
(function(w, TGE) {
    "use strict";

    function Unit() {
        // call super-class implementation
        TiledGameEngine['EntitiesFactory']['entity'].call(this);

        this.imgName = undefined;

        this.animation = undefined;
        this.state = 'stance';

        this.frameIdx = 0;
        this.animDirection = 0; // for 'back_forth' animation 0 - forward, 1 - rewind
        this.direction = 1;
        
        this.lasttime = 0;
        
        this.dt = 0;
        
        this.scr = undefined;
        this.frame = undefined;
    }
    
    // super-class inheritance
    Unit.prototype = Object.create(TiledGameEngine['EntitiesFactory']['entity'].prototype);

    Unit.prototype.init = function(data, assetManager, map) {
        // convert source data to the entities coordinates
        data.x = data.x / map.tilewidth * 2;
        data.y = data.y / map.tileheight;

        // call super-class implementation
        TiledGameEngine['EntitiesFactory']['entity'].prototype['init'].call(this, data, assetManager, map);

        this.img = assetManager.get(data['properties']['img']);

        this.imgName = data['properties']['img'];
        
        this.animation = assetManager.get(data['properties']['inf']);
        
        this.state = 'stance';
        
        this.width = this.height = 0;
        
        if (this.animation) {
            
            for (var state in this.animation) {
                if (this.animation[state]['frame']) {
                    var frames = this.animation[state]['frames'];
                    
                    for (var frame = 0; frame < frames; ++frame) {
                        for (var direction = 0; direction < 8; ++direction) {
                            if (this.animation[state]['frame'][frame][direction]) {
                                this.animation[state]['frame'][frame][direction] = new Int32Array(this.animation[state]['frame'][frame][direction]);
                                
                                this.width = Math.max(this.width, this.animation[state]['frame'][frame][direction][2]);
                                this.height = Math.max(this.height, this.animation[state]['frame'][frame][direction][3]);
                            }
                        }
                    }
                }
            }
        }
        
        this.frameIdx = 0;
        this.animDirection = 0; // for back_forth animation 0 - forward, 1 - rewind
        
        // get custom properties
        if (data['properties']['direction']) {
            var v = data['properties']['direction'];
            if (isNaN(+v)) {
                v = v.toUpperCase();
                switch (v) {
                    case 'SW':  this.direction = 0; break;
                    case 'W':   this.direction = 1; break;
                    case 'NW':  this.direction = 2; break;
                    case 'N':   this.direction = 3; break;
                    case 'NE':  this.direction = 4; break;
                    case 'E':   this.direction = 5; break;
                    case 'SE':  this.direction = 6; break;
                    case 'S':   this.direction = 7; break;
                    default:    this.direction = 0; break;
                }
            } else {
                v = (+v)%8;
                if (v < 0) v = 0;
                this.direction = v;
            }
        } else {
            this.direction = 0;
        }
        
        if (data['properties']['state']) {
            if (this.animation[data['properties']['state']]) {
                this.state = data['properties']['state'];
            } else {
                console.warn('Unknown state value ('+data['properties']['state']+') for '+this.name);
            }
        }
        
        this.lasttime = 0;
        
        this.dt = 0;
        
        this.scr = undefined;
        this.frame = undefined;
    };
    
    Unit.prototype.update = function update(dt, time, viewport) {
        this.redraw = false;
        if (!this.animation || !this.img) {
            return 1000;
        }

        if (time >= this.lasttime) {
            if (!this.lasttime) this.lasttime = time;
            while (time >= this.lasttime) {
                if (this.animation[this.state]['type'] === 'looped') {
                    this.frameIdx = (this.frameIdx + 1) % this.animation[this.state]['frames'];
                } else if (this.animation[this.state]['type'] === 'back_forth') {
                    if (this.animDirection) --this.frameIdx;
                    else ++this.frameIdx;

                    if (this.frameIdx >= this.animation[this.state]['frames']) {
                        this.frameIdx = this.animation[this.state]['frames']-2;
                        this.animDirection = 1;
                    } else if (this.frameIdx < 0) {
                        this.animDirection = 0;
                        this.frameIdx = 1;
                    }
                } else if (this.animation[this.state]['type'] === 'play_once') {
                    if (this.frameIdx === this.animation[this.state]['frames']-1) {
                        // last frame in sequence
                        this.frameIdx = 0;
                        this.state = 'stance';
                    } else {
                        this.frameIdx = (this.frameIdx + 1) % this.animation[this.state]['frames'];
                    }
                }
                
                this.lasttime += this.animation[this.state]['duration'];
            }
            this.redraw = true;
        }

        this.dt = this.lasttime - time;
    
        if (!this.img) {
            this.img = this.am.get(this.imgName);
            
            this.redraw = false;
        }
        
        // check if unit is visible
        this.isVisible(viewport);
        
        if (!this.visible) {
            this.redraw = false;
            
            var r = ~~(this.animation[this.state]['duration'] * (this.animation[this.state]['frames'] - this.frameIdx) - 0*this.dt);
            
            this.frameIdx = 0;
            
//            console.log(this.name, 'update', r);
            return r;
        }

        return ~~(this.dt);
    };
    
    Unit.prototype.isVisible = function(viewport) {
        if (this.scr) {
            if (this.scr[0] + ~~(this.width/2) + viewport[0] > 0 &&
                this.scr[1] + ~~(this.height/2) + viewport[1] > 0 &&
                this.scr[0] + viewport[0] - ~~(this.width/2) < viewport[2] &&
                this.scr[1] + viewport[1] - ~~(this.height/2) < viewport[3]) {
                this.visible = true;
            } else {
                this.visible = false;
            }
        } else {
            this.visible = true;
        }
        
        return this.visible;
    }
    
    Unit.prototype.render = function render(ctx, stage, viewport) {
        if (!this.visible || !this.img) return;
        
        if (!this.scr) {
            var scr = stage.tile2Scr( this.x, this.y);
            this.scr = new Int32Array([scr[0] - viewport[0], scr[1] - viewport[1] + ~~(this.map.tileheight/2)]);
        }

        this.frame = this.animation[this.state]['frame'][this.frameIdx][this.direction];

        ctx.drawImage(this.img, this.frame[0], this.frame[1], this.frame[2], this.frame[3], 
                                this.scr[0] + viewport[0] - this.frame[4], 
                                this.scr[1] + viewport[1] - this.frame[5], 
                                this.frame[2], this.frame[3]);
    };
    
    TGE.EntitiesFactory.register('unit', Unit);
})(window, TiledGameEngine);