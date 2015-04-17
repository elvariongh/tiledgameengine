/*! TiledGameEngine v0.0.6 - 17th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
(function(TGE) {
    "use strict";
    
    var res_scr2Tile = new Int32Array(2),
        res_tile2Scr = new Int32Array(2);
        
    // internal function variable moved to global scope to eleminate GC
//    var tx, ty, i;  
    
    /**
     * Construct TiledMapStage instance 
     * @constructor
     * @extends Stage
     * @param {Assets|null|undefined}   assetManager        Reference to the TiledGameEngine.Assets instance or null
     * @param {Screen|undefined}        [screen=undefined]  Reference to the #Screen object
     * @param {TiledMap}                map                 Reference to the TiledGameEngine.TiledMap instance
     */
    function TiledMapStage(assetManager, screen, map) {
        TiledGameEngine['Stage'].call(this, 'TiledMapStage', assetManager, screen);
        
        this.map = map;    // referense to TiledMap object
        
        this.backbuffer = [];    // array of canvas backbuffer
        
        this.cached = false;
        
        this.pos = [];
        
        this.mousePosX = 0;
        this.mousePosY = 0;
        
        this.animation = true;
        
        this.viewportX = 0;
        this.viewportY = 0;
        this.viewportW = 0;
        this.viewportH = 0;
        
        this.viewportMoved = false;
        this.viewportResized = true;
    };
    
    // super-class inheritance
    TiledMapStage.prototype = Object.create(TGE['Stage'].prototype);
    
    /**
     * Activate stage.
     */
    TiledMapStage.prototype['activate'] = function() {
        TiledGameEngine['Stage'].prototype['activate'].call(this);
        
        if (this['screen']['layers'] < this.map['layerscnt']+1) {
            this['screen']['addLayer'](this.map['layerscnt'] - this['screen']['layers'] + 1);
        } else if (this['screen']['layers'] > this.map['layerscnt'] + 1) {
            this['screen']['remLayer'](this['screen']['layers'] - this.map['layerscnt'] - 1);
        }
        
        this['screen']['clear']();

        this['screen']['setBGColor'](this.map['bgcolor']);
        this['redraw'] = true;
        
        if (this.map) {
            this.pos = [~~(-this.map['mapwidth']/2 + this['screen']['viewport'][2]/2), 0];
            this['screen']['move']( this.pos[0], this.pos[1]);
            
            this['screen']['setBoundingBox'](   this['screen']['viewport'][2] - this.map['mapwidth'],
                                                this['screen']['viewport'][3] - this.map['mapheight'], 
                                                this['screen']['viewport'][2], 
                                                this['screen']['viewport'][3]);
        }
        
        this['screen']['fade'](true);
    };
    
    TiledMapStage.prototype['onViewportResize'] = function(key, value) {
        TiledGameEngine['Stage'].prototype['onViewportResize'].call(this, key, value);
        
        this['screen']['setBoundingBox'](   this['screen']['viewport'][2] - this.map['mapwidth'],
                                            this['screen']['viewport'][3] - this.map['mapheight'], 
                                            this['screen']['viewport'][2], 
                                            this['screen']['viewport'][3]);

        this.cached = false;
        this.viewportMoved = true;
        this.viewportResized = true;
    }

    TiledMapStage.prototype['onViewportMove'] = function(key, value) {
        TiledGameEngine['Stage'].prototype['onViewportMove'].call(this, key, value);
        
        this.cached = false;
        this.viewportMoved = true;
    }

    TiledMapStage.prototype.scr2Tile = function(x, y) {
        // convert screen position to tiles
        x = (x - this['screen']['viewport'][0] - this.map['mapwidth']/2)/ this.map['tilewidth'];
        y = (y - this['screen']['viewport'][1])/ this.map['tileheight'];
        
        res_scr2Tile[0] = ~~(x + y); 
        res_scr2Tile[1] = ~~(y - x); 
        
        return res_scr2Tile;//[~~(x + y), ~~(y - x)];
    }
    
    TiledMapStage.prototype.tile2Scr = function(x, y) {
        res_tile2Scr[0] = ~~(((x - y) * this.map['tilewidth'] / 2) + this['screen']['viewport'][0] + this.map['mapwidth']/2);
        res_tile2Scr[1] = ~~(((x + y) * this.map['tileheight'] / 2) + this['screen']['viewport'][1]);
        return res_tile2Scr;
    }
    
    
    /**
     * Update routine for the TiledMapStage. If map is not parsed yet - 10 FPS is enought.
     * @param {number}  dt      time difference from last update
     * @return {number}         Return time difference (in ms) to next update
     */
    TiledMapStage.prototype['update'] = function(dt, t) {
        // 2 FPS if no screen, no map or stage is not active
        if (!this['screen'] || !this.map || !this['active']) return 500;
        
        if (!this.map['ready']) {
            return 100; // 10 FPS is enough for idle stage
        }
        
        this['redraw'] = false;
        
        var dt2;

//      t = t - t%10;
        
//        if (this.viewportMoved) this.animation = true;
        
        // mark stage as invalid - redraw required
        var cnt = this.map['entities'].length,
            vp = this['screen']['viewport'];
        if (!cnt || !this.animation) {
            dt = dt % 16;
            
//            console.log(1, ~~(16 - dt));
            return ~~(16 - dt); // 60 FPS by default
        } else {
            dt2 = 1000;
            
            if (this.map['resortRequired']) {
                this.map['sortEntities']();
            }
            
            this.map['lockEntities']();
            for (var i = 0; i < cnt; ++i) {
                var obj = this.map['entities'][i];
                
                if (obj['mutable']) {
                    dt2 = Math.min(dt2, obj['update'](dt, t, vp));
                    
                    this['redraw'] |= obj['redraw'];
                } else if ((this.viewportMoved || this.viewportResized) && !obj['mutable']) {
                    obj['isVisible'](vp);
                }
            }
            this.map['unlockEntities']();

            return dt2;
        }
    };
    
    TiledMapStage.prototype['render'] = function() {
        // stage is not active, map is not defined, no view port or map is not parsed yet
        if (!this['active'] || !this.map || !this['screen']) return;
        if (!this.map['ready']) return;

        // viewport array structure: [left, top, width, height, visible]
        var vp = this['screen']['viewport'];

        if (!this.cached || this.viewportMoved || this.viewportResized) {
            this.prerender(true);
            this.cached = true;
        }
        
        // mark stage as up to date - no redraw needed
        this['redraw'] = false;
        
        var layerscount = this.map['layers'].length,
            i = 0,
            layer,
            ctx;

        if (this.viewportMoved) {
            this['screen']['clear']();
        
            for (; i < layerscount; ++i) {
                layer = this.map['layers'][i];
                
                // ignore object and image layers
                if (layer['type'] !== 'tilelayer') continue;

                // layer is not visible - ignore it
                if (!layer['visible']) continue;

                // layer should not be rendered - ignore it
                if (!layer['properties']['render']) continue;

                // layer should be merged with other - ignore it
                if (layer['properties']['mergeWithLayer']) continue;

                ctx = this['screen']['getLayer'](layer['ctxlayer']);
                ctx.drawImage(this.backbuffer[layer['ctxlayer']], 0, 0);
            }
        }
        
        // clear view port moving/resizing flags
        this.viewportMoved = false;
        this.viewportResized = false;
        
        ctx = this['screen']['getLayer'](this.map['entitiesLayer']);

        if (ctx) {
            ctx.clearRect(0, 0, vp[2], vp[3]);

            this.map['lockEntities']();

            for (i = 0, layerscount = this.map['entities'].length; i < layerscount; ++i) {
                var obj = this.map['entities'][i];
                
                if (obj['visible']) obj['render'](ctx, this, vp);
            }
            
            this.map['unlockEntities']();
        }

        if (false) {
            ctx = this['screen']['getLayer'](this['screen']['layers']-1);
            this.renderGrid(ctx);
        }
    };
    
    TiledMapStage.prototype.renderLayer = function(ctx, layerID, isox, isoy, width, height, maxx, maxy) {
        var layer = this.map['layers'][layerID],   // layer object to render
            data = layer['data'],                   // get layer data and itterate through it for rendering
            scr = layer['screen'],                  // get pre-processed values
            x, y,
            startX = -width,
            lastX = width,
            startY = -height,
            lastY = height,
            tx, ty,
            idx, tsidx,
            tileset,
            img, j,
            vp = this['screen']['viewport'];        // view port reference

        // ignore object and image layers
        if (layer['type'] !== 'tilelayer') {
            console.log('ignore (type)', layer['name']);
            return;
        }
        
        // layer is not visible - ignore it
        if (!layer['visible']) {
            console.log('ignore (visible)', layer['name']);
            return;
        }
        
        // layer is not planned to be rendered - ignore it
        if (!layer['properties']['render']) {
            console.log('ignore (render)', layer['name']);
            return;
        }
            
        for (y = startY; y <= lastY; y++) {
            for (x = startX; x <= lastX; x++) {
            
                if ((x + y) & 1) continue;
                
                
                tx = isox + ~~((y + x)/2);
                ty = isoy + ~~((y - x)/2);


                if (tx < 0 || ty < 0) continue;
                if (tx >= maxx || ty >= maxy) continue;

                j = tx + ty * maxx;

                idx = data[j];
            
                if (!idx) continue; // if tile index is 0 - no tile for render

                // check if tilesed was found for that tile
                tsidx = scr[j*5+0];
                if (tsidx < 0) continue;
            
                tileset = this.map['tilesets'][tsidx];
            
                // check if image is loaded
                img = this['am'].get(tileset['image']);
                if (!img) continue;

                // render image
                ctx.drawImage(img, 
                                scr[j*5+1], scr[j*5+2],                         // position in image map
                                tileset['tilewidth'], tileset['tileheight'],    // dimension on image
                                scr[j*5+3] + this.map['mapwidth']/2 + vp[0],    // x-position on screen
                                scr[j*5+4] + vp[1],                             // y-position on screen
                                tileset['tilewidth'], tileset['tileheight']);   // dimension on screen
            }
        }
    };
    
    TiledMapStage.prototype.prerender = function(onScreen) {
        var i = 0,                                          // {number}     layer id
            layer,                                          // {object}     reference for layer
            layerscount =  this.map['layers'].length,       // {number}     count of layers
            ctx,                                            // {Object}     Canvas2DContext reference
            vp = this['screen']['viewport'],                // {Array}      viewport array structure: [left, top, width, height, visible]
            iso = this.scr2Tile(vp[2]/2, vp[3]/2),          // {Array}      get center tile
            w = (~~(vp[2] / this.map['tilewidth']) + 2),    // {number}     calculate screen dimension in tiles
            h = (~~(vp[3] / this.map['tileheight']) + 2),   // {number}
            width = vp[2],                                  // {number}     canvas width
            height = vp[3];                                 // {number}     canvas height
        
        // if layer is rendered to offscreen - create full size canvas and render whole layer into it
        if (!onScreen) {
            w = (~~(this.map['mapwidth'] / this.map['tilewidth']) + 2);
            h = (~~(this.map['mapheight'] / this.map['tileheight']) + 2);
            
            width = this.map['mapwidth'];
            height = this.map['mapheight'];
        }
        
        w = w > this.map['width'] ? this.map['width'] : w;
        h = h > this.map['height'] ? this.map['height'] : h;

        // loop through layers to render
        for (; i < layerscount; ++i) {
            layer = this.map['layers'][i];
            
            // ignore object and image layers
            if (layer['type'] !== 'tilelayer') continue;
            
            // layer is not visible - ignore it
            if (!layer['visible']) continue;
            
            // layer is not planned to be rendered
            if (!layer['properties']['render']) continue;
            
            // if layer is rendered to on screen - create backbuffer canvas with viewport dimension
            if (!this.backbuffer[layer['ctxlayer']]) {
                this.backbuffer[layer['ctxlayer']] = document.createElement('canvas');
                this.backbuffer[layer['ctxlayer']].width = width;
                this.backbuffer[layer['ctxlayer']].height = height;
                ctx = this.backbuffer[layer['ctxlayer']].getContext('2d');
            } else {
                ctx = this.backbuffer[layer['ctxlayer']].getContext('2d');
                
                if (!layer['properties']['mergeWithLayer']) {
                    if (this.viewportResized) {
                        this.backbuffer[layer['ctxlayer']].width = width;
                        this.backbuffer[layer['ctxlayer']].height = height;
                    } else {
                        ctx.clearRect(0, 0, width, height);
                    }
                }
            }
            
            this.renderLayer(ctx, i, iso[0], iso[1], w, h, this.map['width'], this.map['height']);
        }
        
        // store last rendered viewport position and dimension
        this.viewportX = this['screen']['viewport'][0];
        this.viewportY = this['screen']['viewport'][1];
    };

    TiledMapStage.prototype.renderGrid = function(ctx) {
        ctx.clearRect(0, 0, this['screen']['viewport'][2], this['screen']['viewport'][3]);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(29, 57, 101, 0.75)";
        ctx.fillStyle = "rgba(255, 255, 255, 1)";
        ctx.textAlign = "center";
//        ctx.textBaseline = "middle";
        
        var iso = this.scr2Tile(this['screen']['viewport'][2]/2, this['screen']['viewport'][3]/2);
        
        var w = (~~(this['screen']['viewport'][2] / this.map['tilewidth']) + 2); if (!w%2) w++;
        var h = (~~(this['screen']['viewport'][3] / this.map['tileheight']) + 2); if (!h%2) h++;
        
        var dx = this.map['mapwidth']/2 + this['screen']['viewport'][0],
            dy = this['screen']['viewport'][1],
            points = [	[- 0,                       + 0],
                        [+ this.map['tilewidth']/2, + this.map['tileheight']/2],
                        [- 0,                       + this.map['tileheight']],
                        [- this.map['tilewidth']/2, + this.map['tileheight']/2]];
        
        for (var x = -w; x < w; x++) {
            for (var y = -h; y < h; y++) {
            
                if ((x + y) & 1) continue;
                
                var tx = iso[0] + ~~((y + x)/2),
                    ty = iso[1] + ~~((y - x)/2);
                    
                if (tx < 0 || ty < 0) continue;
                if (tx >= this.map['width'] || ty >= this.map['height']) continue;

                var scrx = ~~((tx - ty) * this.map['tilewidth'] / 2),
                    scry = ~~((tx + ty) * this.map['tileheight'] / 2);
                
                ctx .dashedLine(points[0][0] + dx + scrx, points[0][1] + dy + scry, points[1][0] + dx + scrx, points[1][1] + dy + scry)
                    .dashedLine(points[1][0] + dx + scrx, points[1][1] + dy + scry, points[2][0] + dx + scrx, points[2][1] + dy + scry);
                
                if (!this.map.isFree(tx, ty)) {
                    ctx.fillText('B', scrx + dx, scry + dy + this.map.tileheight/2);
                }
            }
        }

        ctx.closePath();
        ctx.stroke();
    }

    TiledMapStage.prototype['follow'] = function(ent) {
        if (ent) {
            if (this['_sidUpdate']) ent['bus']['unsubscribe']('entityUpdated', this['_sidUpdate']);
            
            var off = this.tile2Scr(ent['x'], ent['y']),
                x = -off[0] + this['screen']['viewport'][0] + this['screen']['viewport'][2]/2,
                y = -off[1] + this['screen']['viewport'][1] + this['screen']['viewport'][3]/2;

            this['screen']['move'](x, y);
            
            
            this['_sidUpdate'] = ent['bus']['subscribe']('entityUpdated',    this._onEntityUpdated.bind(this));
//            this['_sidMove'] = ent['bus']['subscribe']('entityMoved',      this['onEntityMoved'].bind(this));
        }
    }
    
    TiledMapStage.prototype._onEntityUpdated = function(key, ent) {
        if (!ent) return;
        
        if (!ent.visible) return;
        
        var offset = this.tile2Scr(ent.dx, ent.dy),
            viewport = this['screen']['viewport'];
        offset[0] = ~~((offset[0] - viewport[0] - this.map.mapwidth/2) / ent.animation[ent.state]['frames']);
        offset[1] = ~~((offset[1] - viewport[1]) / ent.animation[ent.state]['frames']);
        
        var x = viewport[0] - offset[0],
            y = viewport[1] - offset[1];

        this['screen']['move'](x, y);
    }

    TGE['TiledMapStage'] = TiledMapStage;
})(TiledGameEngine);