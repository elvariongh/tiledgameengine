(function(w, TGE) {
    /**
     * Construct TiledMapStage instance 
     * @constructor
     * @extends Stage
     * @param {Assets|null|undefined}   assetManager        Reference to the TiledGameEngine.Assets instance or null
     * @param {Screen|undefined}        [screen=undefined]  Reference to the #Screen object
     * @param {TiledMap}                map                 Reference to the TiledGameEngine.TiledMap instance
     */
    function TiledMapStage(assetManager, screen, map) {
        TGE.Stage.call(this, 'TiledMapStage', assetManager, screen);
        
        this.map = map;
    }
    
    // super-class inheritance
    TiledMapStage.prototype = Object.create(TGE.Stage.prototype);
    
    /**
     * Activate stage.
     */

    TiledMapStage.prototype.activate = function() {
        TiledGameEngine.Stage.prototype.activate.call(this);
        
        if (this.screen.layers < this.map.layers.length) {
            this.screen.addLayer(this.map.layers.length - this.screen.layers);
        }

        this.screen.setBGColor(this.map.bgcolor);
        this.redraw = true;
    };

/*
    TiledMapStage.prototype.deactivate = function() {
        TiledGameEngine.Stage.prototype.deactivate.call(this);
    };
*/

    /**
     * Update routine for the TiledMapStage. If map is not parsed yet - 10 FPS is enought.
     * @param {number}  dt      time difference from last update
     * @return {number}         Return time difference (in ms) to next update
     */
    TiledMapStage.prototype.update = function(dt) {
        // 2 FPS if no screen, map or stage is not active
        if (!this.screen || !this.map || !this.active) return 500;
        
        if (this.map.ready) {
            // mark stage as invalid - redraw required
//            this.redraw = true;
            
            dt = dt % 32;

            return 32 - dt; // 30 FPS by default
        } else {
            return 100; // 10 FPS is enough for idle stage
        }
    };

    TiledMapStage.prototype.render = function() {
        // mark stage as up to date - no redraw needed
        this.redraw = false;

        // stage is not active, map is not defined, no viewport or map is not parsed yet
        if (!this.active || !this.map || !this.screen) return;
        if (!this.map.ready) return;
        
        var i = 0,                                      // {number}     layer id
            layer,                                      // {object}     reference for layer
            layerscount =  this.map.layers.length,      // {number}     count of layers
            data,                                       // {TypedArray} reference for layer data
            j,                                          // {number}     itterator for layer data
            datalength,                                 // {number}     layer data length
            idx,                                        // {number}     tile index
            tx, ty,                                     // {number}     tile x and tile y
            tileset,                                    // {number}     tileset for tile with index @idx
            tsidx,                                      // {number}     tileset index
            imgx, imgy,                                 // {number}     tile coordinates inside tileset image
            img,                                        // {Image}      tileset image
            scrx, scry,                                 // {number}     screen coordinates
            ctx;
            
        this.screen.clear();
        
        for (; i < layerscount; ++i) {
            layer = this.map.layers[i];
            
            // ignore object and image layers
            if (layer['type'] !== 'tilelayer') {
                continue;
            }
            
            // layer is not visible - ignore it
            if (!layer['visible']) continue;
            
//            if (layer['name'] !== 'background') continue;
            
            // get layer data and itterate through it for rendering
            data = layer['data'];
            
            datalength = data.length;
            
            for (j = 0; j < datalength; ++j) {
                idx = data[j];
                
                if (!idx) continue; // if tile index is 0 - no tile for render
                
                tsidx = this.map.tilesets.length;
                
                for (;tsidx--;) {
                    tileset = this.map.tilesets[tsidx];
                    
                    if (idx >= tileset['firstgid'] && idx <= tileset['lastgid']) break;
                }
                
                // no tilesed found for that layer
                if (tsidx < 0) continue;
                
                img = this.am.get(tileset['image']);
                
                if (!img) continue;
                
                idx -= tileset['firstgid'];
                
                imgx = ~~(idx % tileset['cols']) * tileset['tilewidth'];
                imgy = ~~(idx / tileset['cols']) * tileset['tileheight'];
                
                // convert tile coordinates to screen coordinates
                tx = ~~(j % layer['width']);
                ty = ~~(j / layer['width']);
                
                scrx = (tx - ty) * this.map.tilewidth / 2;
                scry = (tx + ty) * this.map.tileheight / 2;
                
                // adjust tile position, if any
                if (tileset['tileoffset']) {
                    scrx += tileset['tileoffset']['x'];
                    scry += tileset['tileoffset']['y'];
                }
                
                scry -= tileset['tileheight'];
                
                // render progress bar

                // viewport array structure: [left, top, width, height, visible]
                var vp = this.screen.viewport;
                ctx = this.screen.getLayer(i);
                ctx.drawImage(img, imgx, imgy, tileset['tilewidth'], tileset['tileheight'], scrx + vp[0], scry + vp[1], tileset['tilewidth'], tileset['tileheight']);
            }
            
//            break;
        }
        
    };

    TGE['TiledMapStage'] = TiledMapStage;
})(window, TiledGameEngine);