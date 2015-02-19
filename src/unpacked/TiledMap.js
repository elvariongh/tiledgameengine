(function(w, TGE) {
    function TiledMap(assetManager, asset) {
        this.asset = asset;
        
        this.am = assetManager;
        
        this.ready = false;
        
        this.layers = [];
        
        this.tilesets = []
        
        this.tilewidth = 64;
        this.tileheight = 32;
        this.bgcolor = '#000';
    };
    
    TiledMap.prototype.parse = function() {
        if (!this.am) return false;
        
        var json = this.am.get(this.asset);
        
        if (!json) return false;
        
        // compress layer data and remove server-side and development layers
        var arr = json['layers'],
            item;
        
        var i = arr.length;
        
        for (;i--;) {
            item = arr[i];
            
            if (item['type'] === 'tilelayer') {
                // compress regular JS array to typed array for memory usage optimization and further processing speed
                // 16-bit value is enought for tile id. I doubt there will be a map with more than 64K different tiles
                item['data'] = new Uint16Array(item['data']);
            }
        }
        
        json['layers'] = arr;
        
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

        // store references for map data
        this.layers = json['layers'];
        this.tilesets = json['tilesets'];

        this.tilewidth = json['tilewidth'];
        this.tileheight = json['tileheight'];
        
        this.bgcolor = json['backgroundcolor'];
        
        this.ready = true;
        
        TGE.bus.notify('tmxMapParsed');
        
        return true;
    };
    
    TiledMap.prototype.getAssets = function() {
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