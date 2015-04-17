/*! TiledGameEngine v0.0.6 - 17th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
/** History:
 *  Who             When            What    Status  Description
 *  @elvariongh     23 Mar, 2015    #2      Fixed   getAssets static method implementation added
 */
(function(w, TGE) {
    "use strict";

    var _noOffset = new Int32Array([0,0]);
    
    var behaviorActions = {move: 0, swing: 1, shoot: 2, wait: 3};
    
    var faceDirection = {   SW:  0,
                            W:   1,
                            NW:  2,
                            N:   3,
                            NE:  4,
                            E:   5,
                            SE:  6,
                            S:   7};
    
    function Unit() {
        // call super-class implementation
        TiledGameEngine['EntitiesFactory']['entity'].call(this);

        this.imgName = undefined;

        this.animation = undefined;

        this.frameIdx = 0;
        this.animDirection = 0; // for 'back_forth' animation 0 - forward, 1 - rewind
        this.direction = faceDirection.W;
        
        this.lasttime = 0;
        
        this.dt = 0;
        
        this.scr = undefined;
        this.frame = undefined;
        this.path = [];
        this.nextPath = [];
        this.dx = 0;
        this.dy = 0;
        
        this.finalStates = {'die': 1, 'critdie': 1, 'stance': 2};
        this.defaultState = 'stance';
        this.state = this.defaultState;
        
        this['mobile'] = true;
        
        this.action = behaviorActions.wait;
        this.actionX = undefined;
        this.actionY = undefined;
    }
    
    // super-class inheritance
    Unit.prototype = Object.create(TiledGameEngine['EntitiesFactory']['entity'].prototype);

    Unit.prototype.init = function(data, assetManager, map) {
        // convert source data to the entities coordinates
        data.x = map.px2tx(data.x);// / map.tilewidth * 2;
        data.y = map.py2ty(data.y);// / map.tileheight;

        // call super-class implementation
        TiledGameEngine['EntitiesFactory']['entity'].prototype['init'].call(this, data, assetManager, map);
        
        this['z'] += 19;

        this.imgName = data['properties']['img'];

        this.img = assetManager.get(this.imgName);

        if (!this.img) {
            throw('can not get image asset');
        }
        
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
            // face direction
            var v = data['properties']['direction'];
            if (isNaN(+v)) {
                v = v.toUpperCase();
                switch (v) {
                    case 'SW':  this.direction = faceDirection.SW; break;
                    case 'W':   this.direction = faceDirection.W; break;
                    case 'NW':  this.direction = faceDirection.NW; break;
                    case 'N':   this.direction = faceDirection.N; break;
                    case 'NE':  this.direction = faceDirection.NE; break;
                    case 'E':   this.direction = faceDirection.E; break;
                    case 'SE':  this.direction = faceDirection.SE; break;
                    case 'S':   this.direction = faceDirection.S; break;
                    default:    this.direction = faceDirection.SW; break;
                }
            } else {
                v = (+v)%8;
                if (v < 0) v = 0;
                this.direction = v;
            }
        } else {
            this.direction = faceDirection.SW;
        }
        
        if (data['properties']['state']) {
            // initial state
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
        
        this['mutable'] = true;

        this['bus']['notify']('entityChangeState', this);
    };
    
    Unit.prototype.update = function update(dt, time, viewport) {
        this.redraw = false;
        if (!this.animation || !this.img) {
            if (!this.img) {
                this.img = this.am.get(this.imgName);
            }

            return 1000;
        }

        if (time >= this.lasttime) {
            if (!this.lasttime) this.lasttime = time;

            this.dt = this.lasttime - time;

            if (this.dt > this.animation[this.state]['duration']*this.animation[this.state]['frames']) {
                this.lasttime = time - this.dt % (this.animation[this.state]['duration']*this.animation[this.state]['frames']);
            }
            
            while (time >= this.lasttime) {
                if (this.animation[this.state]['type'] === 'looped') {
                    if (this.frameIdx === this.animation[this.state]['frames']-1) {
                        // last frame in sequence - change the state, if any
                        this.finishAction();
                        
                        if (this.path.length) {
                            // unit has path - make next step
                            this.nextStep();
                            this.lasttime = time + this.animation[this.state]['duration'];
                            break;
                        } else {
                            if (!this.finalStates[this.state]) {
                                // current state is not final state - switch to default
                                this['changeState'](this.defaultState, time);
                                this.lasttime = time + this.animation[this.state]['duration'];
                                break;
                            } else {
                                // current state is final - loop sequence
                                this.frameIdx = (this.frameIdx + 1) % this.animation[this.state]['frames'];
                            }
                        }
                    } else {
                        this.frameIdx = (this.frameIdx + 1) % this.animation[this.state]['frames'];
                    }
                    
                    this.redraw = true;
                } else if (this.animation[this.state]['type'] === 'back_forth') {
                    if (this.animDirection) --this.frameIdx;
                    else ++this.frameIdx;

                    if (this.frameIdx >= this.animation[this.state]['frames']) {
                        this.frameIdx = this.animation[this.state]['frames']-2;
                        this.animDirection = 1;
                    } else if (this.frameIdx < 0) {
                        // last frame in sequence - change the state, if any
                        this.finishAction();

                        if (this.path.length) {
                            this.nextStep();
                            this.lasttime = time + this.animation[this.state]['duration'];
                            break;
                        } else {
                            if (!this.finalStates[this.state]) {
                                // current state is not final - switch to default
                                this['changeState'](this.defaultState, time);
                                this.lasttime = time + this.animation[this.state]['duration'];
                                break;
                            } else {
                                // current state is final - continue animation
                                this.animDirection = 0;
                                this.frameIdx = 1;
                            }
                        }
                    }

                    this.redraw = true;
                } else if (this.animation[this.state]['type'] === 'play_once') {
                    if (this.frameIdx === this.animation[this.state]['frames']-1) {
                        // last frame in sequence - change the state, if any
                        this.finishAction();

                        if (this.path.length) {
                            this.nextStep();
                            
                            this.lasttime = time + this.animation[this.state]['duration'];
                            break;
                        } else {
                            if (!this.finalStates[this.state]) {
                                // last frame in sequence - switch to default state
                                this['changeState'](this.defaultState, time);
                                this.redraw = true;
                                this.lasttime = time + this.animation[this.state]['duration'];
                                break;
                            } else {
                                // stop animation
                                this.lasttime = time + this.animation[this.state]['duration']*this.animation[this.state]['frames'];
                                this.redraw = false;
                            }
                        }
                    } else {
                        this.frameIdx = (this.frameIdx + 1) % this.animation[this.state]['frames'];
                        this.redraw = true;
                    }
                }
                
                this.lasttime += this.animation[this.state]['duration'];
                
                if (this.dx || this.dy) {
                    this['bus']['notify']('entityUpdated', this);
                }
            }
//            this.redraw = true;
        }

        this.dt = this.lasttime - time;

        // check if unit is visible
        if (!this.isVisible(viewport)) {
            this.redraw = false;
            
            this.dt += ~~(this.animation[this.state]['duration'] * (this.animation[this.state]['frames'] - this.frameIdx));
            
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
        
        var offset;
        
        if (this.dx || this.dy) {
            offset = stage.tile2Scr(this.dx, this.dy);
            offset[0] = ~~((offset[0] - viewport[0] - this.map.mapwidth/2) * this.frameIdx / this.animation[this.state]['frames']);
            offset[1] = ~~((offset[1] - viewport[1]) * this.frameIdx / this.animation[this.state]['frames']);
        } else {
            offset = _noOffset;
        }

        this.frame = this.animation[this.state]['frame'][this.frameIdx][this.direction];

        ctx.drawImage(this.img, this.frame[0], this.frame[1], this.frame[2], this.frame[3], 
                                this.scr[0] + viewport[0] - this.frame[4] + offset[0], 
                                this.scr[1] + viewport[1] - this.frame[5] + offset[1], 
                                this.frame[2], this.frame[3]);
    };

    /**
     *  Move unit to new position.
     * @param   {number}    x           new X coordinate (in tiles)
     * @param   {number}    y           new Y coordinate (in tiles)
     */
    Unit.prototype['move'] = function(x, y) {
        x = +x; y = +y;
        
        if (this['x'] === x && this['y'] === y) return;

        this.changeState('run', 0);

        this.dx = x - this['x'];
        this.dy = y - this['y'];

        // change unit face direction
             if (this.dx === 0 && this.dy < 0) this.direction = faceDirection.N;
        else if (this.dx === 0 && this.dy > 0) this.direction = faceDirection.S;
        else if (this.dy === 0 && this.dx < 0) this.direction = faceDirection.W;
        else if (this.dy === 0 && this.dx > 0) this.direction = faceDirection.E;
        else if (this.dx > 0   && this.dy > 0) this.direction = faceDirection.SE;
        else if (this.dx < 0   && this.dy < 0) this.direction = faceDirection.NW;
        else if (this.dx > 0   && this.dy < 0) this.direction = faceDirection.NE;
        else this.direction = faceDirection.SW;

        this.scr = undefined;
    };
    
    Unit.prototype['setPath'] = function(path) {
        
        var b = [];
        for (var i = 0, l = path.length; i < l; ++i) {
            b[b.length] = {action: behaviorActions.move, x: path[i].x, y: path[i].y};
        }
        
        if (!this.path.length) {
            this.path = b;
            if (!this.dx && !this.dy) {
                this['nextStep']();
            }
        } else {
            this.nextPath = b;
        }
    };
    
    Unit.prototype.finishAction = function() {
        if (this.action === behaviorActions.move) {
            if (this.dx || this.dy) this.finishStep();
            return;
        }
        
        if (this.action === behaviorActions.wait) return;
        
        // just attack action left
        console.log(this.name, this.action);
        TGE['bus']['notify']('entityActionFinished', this);
        
        
        this.action = behaviorActions.wait;
    };
    
    Unit.prototype['finishStep'] = function() {
        this.x += this.dx;
        this.y += this.dy;
        this['z'] = this['x'] + this['y']*this['map']['width']*20 + 19;
        
        this.dx *= -1; this.dy *= -1;
        
        TGE['bus']['notify']('entityMoved', this);
        this['bus']['notify']('entityMoved', this);
        
        this.scr = undefined;

        this.dx = this.dy = 0;
        
        if (this.nextPath.length) {
            this.path.length = 0;
            this.setPath(this.nextPath);
            this.nextPath.length = 0;
        }
        
        if (!this.path.length && !this.dx && !this.dy) {
            this['bus']['notify']('entityFinishPath', this);
        }
        
        this.action = behaviorActions.wait;
    };
    
    Unit.prototype['nextStep'] = function() {
        if (!this.path.length) {
            this.action = behaviorActions.wait;
            return false;
        }
        
        if (this.finalStates[this.state] === 1) { return false; }

        var step = this.path.shift();
        
        switch (step['action']) {
            case behaviorActions.move: {
                this.move(step['x'], step['y']);
                this.action = step['action'];
                return true;
            } break;
            case behaviorActions.swing: 
            case behaviorActions.shoot: {
                var dx = step['x'] - this['x'],
                    dy = step['y'] - this['y'];

                // change unit face direction
                     if (dx === 0 && dy < 0) this.direction = faceDirection.N;
                else if (dx === 0 && dy > 0) this.direction = faceDirection.S;
                else if (dy === 0 && dx < 0) this.direction = faceDirection.W;
                else if (dy === 0 && dx > 0) this.direction = faceDirection.E;
                else if (dx > 0   && dy > 0) this.direction = faceDirection.SE;
                else if (dx < 0   && dy < 0) this.direction = faceDirection.NW;
                else if (dx > 0   && dy < 0) this.direction = faceDirection.NE;
                else this.direction = faceDirection.SW;
                
                if (step['action'] === behaviorActions.shoot) {
                    this.changeState('shoot');
                } else {
                    this.changeState('swing');
                }
                
                this.action = step['action'];
                this.actionX = step['x'];
                this.actionY = step['y'];
                return true;
            } break;
            case behaviorActions.wait: {
                this.changeState('stance');

                this.action = step['action'];
                return true;
            } break;
        }
        return true;
    };
    
    Unit.prototype['pushBehavior'] = function(b) {
        if (b instanceof Array) {
            for (var i = b.length; i; --i) {
                this.path.unshift(b[i-1]);
            }
        } else {
            this.path.unshift(b);
            if (b.immediate) {
                if (this.animation[this.state]['type'] === 'back_forth') {
                    this.animDirection = 1;
                    this.frameIdx = 0;
                } else {
                    this.frameIdx = this.animation[this.state]['frames']-1;
                }
            }
        }
    };
    
    Unit.prototype['changeState'] = function(state, time) {
        this.dx = this.dy = 0;
        this.frameIdx = 0;
        this.lasttime = time || 0;
        
        if (this.state === state) return;
        
        this.state = state;
        
        this['bus']['notify']('entityChangeState', this);
    };

    Unit.getAssets = function(obj) {
        var assets = [];
        if (obj['properties']) {
            if (obj['properties']['img'] && obj['properties']['inf']) {
                assets[assets.length] = obj['properties']['img'];
                assets[assets.length] = obj['properties']['inf'];
            }
            return assets;
        }

        return undefined;
    };

    Unit.prototype.behaviorActions = behaviorActions;
    
    Unit.prototype['onEntityMoved'] = function(key, ent) {
        
        var x = ent['x'],
            y = ent['y'],
            p = this['map']['getPath'](this['x'], this['y'], x, y, true);

            if (p) {p.pop(); this.map.setEntityPath(this,p)};
    };
    
    TGE.EntitiesFactory.register('unit', Unit);
})(window, TiledGameEngine);