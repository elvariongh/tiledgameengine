/*! TiledGameEngine v0.0.1 - 10th Mar 2015 | https://github.com/elvariongh/tiledgameengine */
(function(TGE) {
    "use strict";

    /**
     * @constructor
     */
    function TiledMap(assetManager, asset) {
        this['asset'] = asset;
        
        this['assetsManager'] = assetManager;
        
        this['ready'] = false;
        
        this['layers'] = [];
        this['layerscnt'] = 0;
        this['entitiesLayer'] = 0;
        
        this['tilesets'] = []
        
        this['tilewidth'] = 64;
        this['tileheight'] = 32;
        this['bgcolor'] = '#000';
        
        this['objects'] = [];
    };
    
    TiledMap.prototype['parse'] = function () {
        if (this['ready']) {
            TGE['bus']['notify']('tmxMapParsed');
            
            return true;
        }
    
        if (!this['assetsManager']) return false;
        
        var json = this['assetsManager'].get(this['asset']),
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

            delete item['imageheight'];
            delete item['imagewidth'];
        }
        
        json['tilesets'] = arr;
        
        TGE['bus']['notify']('tmxMapParseProgress', 1);

        // compress layer data and remove server-side and development layers
        arr = json['layers'];
        
        m = arr.length;
        i = 0;
        
        var animatedTiles = [];
        
        for (;i < m;++i) {
            item = arr[i];
            
            if (item['type'] === 'tilelayer') {
                // compress regular JS array to typed array for memory usage optimization and further processing speed
                // 16-bit value is enought for tile id. I doubt there will be a map with more than 64K different tiles
                item['data'] = new Uint16Array(item['data']);
                
                item['screen'] = new Int16Array(item['data'].length*5);
                
                if (item['properties']) {
                    // check, if this layer need to be rendered
                    if (item['properties']['render']) {
                        if (item['properties']['render'] === '0' ||
                            item['properties']['render'] === 'false') {
                            
                            item['properties']['render'] = 0;
                            item['visible'] = 0;
                            continue;
                        }
                    }
                    
                    // check, if this layer need to be rendered in separate canvas
                    if (item['properties']['mergeWithLayer']) {
                        if (item['properties']['mergeWithLayer'] === item['name']) {
                            item['ctxlayer'] = lcnt++;
                        } else {
                            for (j = 0; j < m; j++) {
                                if (arr[j]['name'] === item['properties']['mergeWithLayer']) {
                                    item['ctxlayer'] = j;
                                    break;
                                }
                            }
                        }
                    } else {
                        item['ctxlayer'] = lcnt++;
                    }
                } else {
                    item['properties'] = {};
                    item['ctxlayer'] = lcnt++;
                }
                
                item['properties']['render'] = 1;
                
                item['tilewidth'] = json['tilewidth'];
                item['tileheight'] = json['tileheight'];
                
                // pre-process tileset id for each tile
                data = item['data'];
                l = data.length;
                for (j = 0; j < l; ++j) {
                    idx = data[j];
                    if (!idx) continue;
                    
                    tsidx = json['tilesets'].length;
                    
                    for (;tsidx--;) {
                        tileset = json['tilesets'][tsidx];
                        
                        if (idx >= tileset['firstgid'] && idx <= tileset['lastgid']) break;
                    }
                    
                    // no tileset found for that layer - hide layer and make next itteration
                    if (tsidx < 0) {
                        item['visible'] = 0;
                        continue;
                    }
                    
                    if (tileset['tilewidth'] > item['tilewidth']) item['tilewidth'] = tileset['tilewidth'];
                    if (tileset['tileheight'] > item['tileheight']) item['tileheight'] = tileset['tileheight'];
                    
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
                    
                    item['screen'][j*5+0] = tsidx;
                    item['screen'][j*5+1] = imgx;
                    item['screen'][j*5+2] = imgy;
                    item['screen'][j*5+3] = scrx;
                    item['screen'][j*5+4] = scry;
                    
                    // check if tile is animated
                    if (tileset['tiles']) { 
                        // this tileset has animated tiles
                        if (tileset['tiles'][idx]) {
                            // current tileset is animated tile - create tile enitity data
                            animatedTiles[animatedTiles.length] = { 'type': 'tile',
                                                                    'layer': i,
                                                                    'id': j,
                                                                    'x': tx,
                                                                    'y': ty };
                        }
                    }
                }
            }
        }
        json['layers'] = arr;

        TGE['bus']['notify']('tmxMapParseProgress', 2);

        // store references for map data
        this['layers'] = json['layers'];
        this['tilesets'] = json['tilesets'];

        this['tilewidth'] = +json['tilewidth'];
        this['tileheight'] = +json['tileheight'];
        
        this['mapwidth'] = this['tilewidth']*json['width'];
        this['mapheight'] = this['tileheight']*json['height'];
        
        this['bgcolor'] = json['backgroundcolor'];
        
        this['layerscnt'] = lcnt;
        
        this['width'] = +json['width'];
        this['height'] = +json['height'];
        
        TGE['bus']['notify']('tmxMapParseProgress', 3);
        
        // create entities from tilelayer
        if (animatedTiles.length > 0) {
            for (i = 0, m = animatedTiles.length; i < m; ++i) {
                var obj = TGE.EntitiesFactory.create(animatedTiles[i], this['assetsManager'], this);
                if (obj) {
                    this['objects'][this['objects'].length] = obj;
                }
            }
            
            this['entitiesLayer'] = lcnt++;
            this['layerscnt'] = lcnt;
        }

        TGE['bus']['notify']('tmxMapParseProgress', 4);

        // sorting entities
        this['objects'] = this['objects'].sort(function(a, b) { return a['z'] - b['z']; });
        
        TGE['bus']['notify']('tmxMapParseProgress', 5);

        this['ready'] = 1;
        
        TGE['bus']['notify']('tmxMapParsed');
        
        return true;
    };
    
    TiledMap.prototype['getAssets'] = function getAssets() {
        var json = this['assetsManager'].get(this['asset']);
        
        if (!json) return [];
        
        // get tile sets images
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
        
        // get units images
        var layer, obj, j;
        i = json['layers'].length;
        for (; i--;) {
            layer = json['layers'][i];
            
            if (layer['type'] === 'objectgroup') {
                j = layer['objects'].length;
                
                for (; j--;){
                    obj = layer['objects'][j];
                    
                    if (obj['type'] === 'unit') {
                        if (obj['properties']) {
                            if (obj['properties']['img'] && obj['properties']['inf']) {
                                imgs[imgs.length] = obj['properties']['img'];
                                imgs[imgs.length] = obj['properties']['inf'];
                            }
                        }
                    }
                }
            }
        }
        
        return imgs;
    };
    
    TGE['TiledMap'] = TiledMap;

})(TiledGameEngine);