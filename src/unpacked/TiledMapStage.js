/*! TiledGameEngine v0.0.2 - 18th Mar 2015 | https://github.com/elvariongh/tiledgameengine */
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
        
        this.tmap = map;    // referense to TiledMap object
        
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
        
        if (this['screen']['layers'] < this.tmap['layerscnt']) {
            this['screen']['addLayer'](this.tmap['layerscnt'] - this['screen']['layers']);
        } else if (this['screen']['layers'] > this.tmap['layerscnt']) {
            this['screen']['remLayer'](this['screen']['layers'] - this.tmap['layerscnt']);
        }
        
        this['screen']['clear']();

        this['screen']['setBGColor'](this.tmap['bgcolor']);
        this['redraw'] = true;
        
        if (this.tmap) {
            this.pos = [~~(-this.tmap['mapwidth']/2 + this['screen']['viewport'][2]/2), 0];
            this['screen']['move']( this.pos[0], this.pos[1]);
            
            this['screen']['setBoundingBox'](   - (this.tmap['mapwidth'] - this['screen']['viewport'][2]), 
                                                - (this.tmap['mapheight'] - this['screen']['viewport'][3]), 
                                                this.tmap['mapwidth'] - this['screen']['viewport'][2], // - this['screen']['viewport'][2], 
                                                this.tmap['mapheight'] - this['screen']['viewport'][3]);// - this['screen']['viewport'][3]);
        }
        
        this['screen']['fade'](true);
    };
    
    TiledMapStage.prototype['onViewportResize'] = function(key, value) {
        TiledGameEngine['Stage'].prototype['onViewportResize'].call(this, key, value);
        
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
        x = (x - this['screen']['viewport'][0] - this.tmap['mapwidth']/2)/ this.tmap['tilewidth'];
        y = (y - this['screen']['viewport'][1])/ this.tmap['tileheight'];
        
        res_scr2Tile[0] = ~~(x + y); 
        res_scr2Tile[1] = ~~(y - x); 
        
        return res_scr2Tile;//[~~(x + y), ~~(y - x)];
    }
    
    TiledMapStage.prototype.tile2Scr = function(x, y) {
        res_tile2Scr[0] = ~~(((x - y) * this.tmap['tilewidth'] / 2) + this['screen']['viewport'][0] + this.tmap['mapwidth']/2);
        res_tile2Scr[1] = ~~(((x + y) * this.tmap['tileheight'] / 2) + this['screen']['viewport'][1]);
        return res_tile2Scr;
    }
    
    
    /**
     * Update routine for the TiledMapStage. If map is not parsed yet - 10 FPS is enought.
     * @param {number}  dt      time difference from last update
     * @return {number}         Return time difference (in ms) to next update
     */
    TiledMapStage.prototype['update'] = function(dt, t) {
        // 2 FPS if no screen, no map or stage is not active
        if (!this['screen'] || !this.tmap || !this['active']) return 500;
        
        if (!this.tmap['ready']) {
            return 100; // 10 FPS is enough for idle stage
        }
        
        this['redraw'] = false;
        
        var dt2;
        
//        if (this.viewportMoved) this.animation = true;
        
        // mark stage as invalid - redraw required
        var cnt = this.tmap['objects'].length;
        if (!cnt || !this.animation) {
            dt = dt % 16;
            
//            console.log(1, ~~(16 - dt));
            return ~~(16 - dt); // 60 FPS by default
        } else {
            dt2 = 1000;
            
            for (var i = 0; i < cnt; ++i) {
                var obj = this.tmap['objects'][i];
                
                dt2 = Math.min(dt2, obj['update'](dt, t, this['screen']['viewport']));
                
                this['redraw'] |= obj['redraw'];
            }

            return dt2;
        }
    };
    
    TiledMapStage.prototype['render'] = function() {
        // stage is not active, map is not defined, no view port or map is not parsed yet
        if (!this['active'] || !this.tmap || !this['screen']) return;
        if (!this.tmap['ready']) return;

        // viewport array structure: [left, top, width, height, visible]
        var vp = this['screen']['viewport'];

        if (!this.cached || this.viewportMoved || this.viewportResized) {
            this.prerender(true);
            this.cached = true;
        }
//            return;

//        else 
        {
            // mark stage as up to date - no redraw needed
            this['redraw'] = false;
            
            var layerscount = this.tmap['layers'].length,
                i = 0,
                layer,
                ctx;

            if (this.viewportMoved) {
                this['screen']['clear']();
            
                for (; i < layerscount; ++i) {
                    layer = this.tmap['layers'][i];
                    
                    // ignore object and image layers
                    if (layer['type'] !== 'tilelayer') continue;

                    // layer is not visible - ignore it
                    if (!layer['visible']) continue;

                    if (!layer['properties']['render']) continue;

                    if (layer['properties']['mergeWithLayer']) continue;

                    ctx = this['screen']['getLayer'](layer['ctxlayer']);
                    ctx.drawImage(this.backbuffer[layer['ctxlayer']], 0, 0);
                }
            }
            
            // clear view port moving/resizing flags
            this.viewportMoved = false;
            this.viewportResized = false;
            
            if (true) {
                ctx = this['screen']['getLayer'](this.tmap['entitiesLayer']);

                if (ctx) {
                    ctx.clearRect(0, 0, vp[2], vp[3]);

                    for (i = 0, layerscount = this.tmap['objects'].length; i < layerscount; ++i) {
                        var obj = this.tmap['objects'][i];
                        
                        if (obj.visible) obj['render'](ctx, this, vp);
                    }
                }
            }
        }
    };
    
    TiledMapStage.prototype.renderLayer = function(ctx, layerID, isox, isoy, width, height, maxx, maxy) {
        var layer = this.tmap['layers'][layerID],   // layer object to render
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
            
                tileset = this.tmap['tilesets'][tsidx];
            
                // check if image is loaded
                img = this['am'].get(tileset['image']);
                if (!img) continue;

                // render image
                ctx.drawImage(img, 
                                scr[j*5+1], scr[j*5+2],                         // position in image map
                                tileset['tilewidth'], tileset['tileheight'],    // dimension on image
                                scr[j*5+3] + this.tmap['mapwidth']/2 + vp[0],   // x-position on screen
                                scr[j*5+4] + vp[1],                             // y-position on screen
                                tileset['tilewidth'], tileset['tileheight']);   // dimension on screen
            }
        }
    };
    
    TiledMapStage.prototype.prerender = function(onScreen) {
        var i = 0,                                          // {number}     layer id
            layer,                                          // {object}     reference for layer
            layerscount =  this.tmap['layers'].length,      // {number}     count of layers
            ctx,                                            // {Object}     Canvas2DContext reference
            vp = this['screen']['viewport'],                // {Array}      viewport array structure: [left, top, width, height, visible]
            iso = this.scr2Tile(vp[2]/2, vp[3]/2),          // {Array}      get center tile
            w = (~~(vp[2] / this.tmap['tilewidth']) + 2),   // {number}     calculate screen dimension in tiles
            h = (~~(vp[3] / this.tmap['tileheight']) + 2),  // {number}
            width = vp[2],                                  // {number}     canvas width
            height = vp[3];                                 // {number}     canvas height
        
        // if layer is rendered to offscreen - create full size canvas and render whole layer into it
        if (!onScreen) {
            w = (~~(this.tmap['mapwidth'] / this.tmap['tilewidth']) + 2);
            h = (~~(this.tmap['mapheight'] / this.tmap['tileheight']) + 2);
            
            width = this.tmap['mapwidth'];
            height = this.tmap['mapheight'];
        }
        
        w = w > this.tmap['width'] ? this.tmap['width'] : w;
        h = h > this.tmap['height'] ? this.tmap['height'] : h;

        // loop through layers to render
        for (; i < layerscount; ++i) {
            layer = this.tmap['layers'][i];
            
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
            
            this.renderLayer(ctx, i, iso[0], iso[1], w, h, this.tmap['width'], this.tmap['height']);
        }
        
        // store last rendered viewport position and dimension
        this.viewportX = this['screen']['viewport'][0];
        this.viewportY = this['screen']['viewport'][1];
    };

    TGE['TiledMapStage'] = TiledMapStage;
})(TiledGameEngine);