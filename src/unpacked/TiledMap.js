(function(w, TGE) {
    function TiledMap(assetManager, asset) {
        this.asset = asset;
        
        this.am = assetManager;
        
        this['ready'] = false;
        
        this['layers'] = [];
        
        this['tilesets'] = []
        
        this['tilewidth'] = 64;
        this['tileheight'] = 32;
        this['bgcolor'] = '#000';
    };
    
    TiledMap.prototype['parse'] = function() {
        if (!this.am) return false;
        
        var json = this.am.get(this.asset),
            arr, item, i, j, l, m, data,
            idx,                                        // {number}     tile index
            tx, ty,                                     // {number}     tile x and tile y
            tileset,                                    // {number}     tileset for tile with index @idx
            tsidx,                                      // {number}     tileset index
            imgx, imgy,                                 // {number}     tile coordinates inside tileset image
            scrx, scry,                                 // {number}     screen coordinates
            lcnt = 0;                                   // {number}     actual number of layers to render
        
        if (!json) return false;
        
        // process tilesets for performance boost
        arr = json['tilesets'];
        i = arr.length;
        for (;i--;) {
            item = arr[i];
            item['rows'] =      ~~(item['imageheight'] / item['tileheight']);
            item['cols'] =      ~~(item['imagewidth'] / item['tilewidth']);
            item['lastgid'] =   ~~(item['firstgid'] + item['rows'] * item['cols'])-1;

//            item['image'] =     this.am.get(item['image']);
            
            delete item['imageheight'];
            delete item['imagewidth'];
        }
        
        json['tilesets'] = arr;

        // compress layer data and remove server-side and development layers
        arr = json['layers'];
        
        m = arr.length;
        i = 0;
        
        for (;i < m;++i) {
            item = arr[i];
            
            if (item['type'] === 'tilelayer') {
                // compress regular JS array to typed array for memory usage optimization and further processing speed
                // 16-bit value is enought for tile id. I doubt there will be a map with more than 64K different tiles
                item['data'] = new Uint16Array(item['data']);
                
                item['screen'] = new Int16Array(item['data'].length*5);
                
                // check, if this layer need to be rendered
                
                if (item['properties']) {
                    if (item['properties']['render']) {
                        if (item['properties']['render'] === '0' ||
                            item['properties']['render'] === 'false') {
                            
                            item['properties']['render'] = 0;
                            item['visible'] = 0;
                            continue;
                        }
                    }
                } else {
                    item['properties'] = [];
                }
                
                item['properties']['render'] = 1;
                item['ctxlayer'] = lcnt;
                
                // pre-process tileset id for each tile
                data = item['data'];
                l = data.length;
                for (j = 0; j < l; ++j) {
                    idx = data[j];
                    if (!idx) continue;
                    
                    tsidx = json['tilesets'].length;
                    
                    tileset;
                    
                    for (;tsidx--;) {
                        tileset = json['tilesets'][tsidx];
                        
                        if (idx >= tileset['firstgid'] && idx <= tileset['lastgid']) break;
                    }
                    
                    // no tilesed found for that layer - hide layer and make next itteration
                    if (tsidx < 0) {
                        item['visible'] = 0;
                        continue;
                    }
                    
                    item['screen'][j*5+0] = tsidx;
                    
                    // get tile number in this tileset
                    idx -= tileset['firstgid'];
                    
                    // find tile coordinates in the image map
                    imgx = ~~(idx % tileset['cols']) * tileset['tilewidth'];
                     imgy = ~~(idx / tileset['cols']) * tileset['tileheight'];
                    
                    // convert tile coordinates to screen coordinates
                    tx = ~~(j % item['width']);
                    ty = ~~(j / item['width']);
                    
                    scrx = (tx - ty) * json['tilewidth'] / 2;
                     scry = (tx + ty) * json['tileheight'] / 2;
                    
                    // adjust tile position, if any
                    if (tileset['tileoffset']) {
                        scrx += tileset['tileoffset']['x'];
                        scry += tileset['tileoffset']['y'];
                    }
                    
                    scry -= tileset['tileheight'];
                    scry += json['tileheight'];
                    scrx -= json['tilewidth']/2;
                    
                    item['screen'][j*5+1] = imgx;
                    item['screen'][j*5+2] = imgy;
                    item['screen'][j*5+3] = scrx;
                    item['screen'][j*5+4] = scry;
                }
                
                ++lcnt;
            }
        }
        
        json['layers'] = arr;

        // store references for map data
        this['layers'] = json['layers'];
        this['tilesets'] = json['tilesets'];

        this['tilewidth'] = +json['tilewidth'];
        this['tileheight'] = +json['tileheight'];
        
        this['mapwidth'] = this['tilewidth']*json['width'];
        this['mapheight'] = this['tileheight']*json['height'];
        
        this['bgcolor'] = json['backgroundcolor'];
        
        this['layerscnt'] = lcnt;
        
        this['ready'] = 1;
        
        TGE['bus']['notify']('tmxMapParsed');
        
        return true;
    };
    
    TiledMap.prototype['getAssets'] = function() {
        var json = this.am.get(this.asset);
        
        if (!json) return [];
        
        var tilesets = json['tilesets'], 
            imgs = [],
            tileset;
            
        var i = tilesets.length;

        for (; i--;) {
            tileset = tilesets[i];
            if (tileset['properties']['download']) {
                if (tileset['properties']['download'] === 'false' ||
                    tileset['properties']['download'] === '0') {
                    
                    // remove that tileset from memory
                    tileset = null;
                    
                    delete tilesets[i];
                    tilesets.splice(i, 1)
                    ++i;
                    continue;
                }
            }
            
            imgs[imgs.length] = tileset['image'];
        }
        
        json['tilesets'] = tilesets;
        
        return imgs;
    };
    
    TGE['TiledMap'] = TiledMap;

})(window, TiledGameEngine);