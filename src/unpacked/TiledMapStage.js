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
        TiledGameEngine['Stage'].call(this, 'TiledMapStage', assetManager, screen);
        
        this.tmap = map;    // referense to TiledMap object
        
        this.backbuffer = [];    // array of canvas backbuffer
        
        this.cached = false;
        
        this.pos = [];
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
            this.pos = [- ~~(this.tmap['mapwidth']/4), - ~~(this.tmap['mapheight']/4)];
            this['screen']['move'](this.pos[0], this.pos[1]);
            
            this['screen']['setBoundingBox'](   - (this.tmap['mapwidth'] - this['screen']['viewport'][2]), 
                                                - (this.tmap['mapheight'] - this['screen']['viewport'][3]), 
                                                this['screen']['viewport'][2], // - this['screen']['viewport'][2], 
                                                this['screen']['viewport'][3]);// - this['screen']['viewport'][3]);
        }
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
    TiledMapStage.prototype['update'] = function(dt) {
        // 2 FPS if no screen, map or stage is not active
        if (!this['screen'] || !this.tmap || !this['active']) return 500;
        
        if (this.tmap['ready']) {
            // mark stage as invalid - redraw required
//            this.redraw = true;

            dt = dt % (1000/60);

            return ~~((1000/60) - dt);// - dt; // 60 FPS by default
        } else {
            return 100; // 10 FPS is enough for idle stage
        }
    };

    TiledMapStage.prototype['render'] = function() {
        // stage is not active, map is not defined, no viewport or map is not parsed yet
        if (!this['active'] || !this.tmap || !this['screen']) return;
        if (!this.tmap['ready']) return;

        if (!this.cached) {
            this.prerender();
            this.cached = true;
        } else {
            // mark stage as up to date - no redraw needed
            this['redraw'] = false;

            // viewport array structure: [left, top, width, height, visible]
            var vp = this['screen']['viewport'];
            
            var layerscount = this.tmap['layers'].length,
                i = 0,
                vp = this['screen']['viewport'],
                layer,
                ctx;
                
                for (; i < layerscount; ++i) {
                    layer = this.tmap['layers'][i];
                    
                    // ignore object and image layers
                    if (layer['type'] !== 'tilelayer') continue;
                    
                    // layer is not visible - ignore it
                    if (!layer['visible']) continue;
                    
                    ctx = this['screen']['getLayer'](layer['ctxlayer']);
                    ctx.clearRect(0, 0, vp[2], vp[3]);
                    
                    ctx.drawImage(this.backbuffer[i], -vp[0], -vp[1], vp[2], vp[3], 0, 0, vp[2], vp[3]);
                }
        }
        
        // this.pos[0] = this['screen']['viewport'][0] + 2*((~~(Math.random()*10)%3) - 1);
        // this.pos[1] = this['screen']['viewport'][1] + 2*((~~(Math.random()*10)%3) - 1);

        // this['screen']['move'](this.pos[0], this.pos[1]);
    };
    
    TiledMapStage.prototype.prerender = function() {
        var i = 0,                                      // {number}     layer id
            layer,                                      // {object}     reference for layer
            layerscount =  this.tmap['layers'].length,  // {number}     count of layers
            data,                                       // {TypedArray} reference for layer data
            j,                                          // {number}     itterator for layer data
            datalength,                                 // {number}     layer data length
            idx,                                        // {number}     tile index
            tileset,                                    // {number}     tileset for tile with index @idx
            tsidx,                                      // {number}     tileset index
            img,                                        // {Image}      tileset image
            scr,                                        // {TypedArray} pre-processed valued for tiles
            ctx;                                        // {Object}     Canvas2DContext reference
            
//        this.screen.clear();
        
        // viewport array structure: [left, top, width, height, visible]
//        var vp = this['screen']['viewport'];
        
//        width = this.tmap
        
        for (; i < layerscount; ++i) {
            layer = this.tmap['layers'][i];
            
            // ignore object and image layers
            if (layer['type'] !== 'tilelayer') continue;
            
            // layer is not visible - ignore it
            if (!layer['visible']) continue;
            
            // get layer data and itterate through it for rendering
            data = layer['data'];
            // get pre-processed values
            scr = layer['screen'];
            
            datalength = data.length;

//            ctx = this['screen']['getLayer'](i);
            this.backbuffer[i] = document.createElement('canvas');
            this.backbuffer[i].width = this.tmap['mapwidth'];
            this.backbuffer[i].height = this.tmap['mapheight'];
            ctx = this.backbuffer[i].getContext('2d');
            
//            renderFunction(buffer.getContext('2d'));
//            return buffer;

//            this['screen']['clear'](i);
            
            for (j = 0; j < datalength; ++j) {
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
                                scr[j*5+3] + this.tmap['mapwidth']/2, scr[j*5+4],                         // position on screen
                                tileset['tilewidth'], tileset['tileheight']);   // dimension on screen
            }
            
//            break;
        }
        
    };

    TGE['TiledMapStage'] = TiledMapStage;
})(window, TiledGameEngine);