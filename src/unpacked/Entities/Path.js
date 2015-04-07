/*! TiledGameEngine v0.0.5 - 07th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
(function(w, TGE) {
    "use strict";

    var p = [];// new Array(4);

    p[0] = new Array(7); // west
    p[0][0] = {x: -12, y: 0};
    p[0][1] = {x:   0, y: -6};
    p[0][2] = {x:   0, y: -4};
    p[0][3] = {x: +12, y: -4};
    p[0][4] = {x: +12, y: +4};
    p[0][5] = {x:   0, y: +4};
    p[0][6] = {x:   0, y: +6};
    
    p[1] = new Array(7); // north-west
    p[1][0] = {x: -12, y: -6};
    p[1][1] = {x: +8,  y: -4};
    p[1][2] = {x: +4,  y: -2};
    p[1][3] = {x: +16, y: +4};
    p[1][4] = {x: +8,  y: +8};
    p[1][5] = {x: -4,  y: +2};
    p[1][6] = {x: -8,  y: +4};
    
    p[2] = new Array(7); // north
    p[2][0] = {x:   0, y: -12};
    p[2][1] = {x:  +6, y: -4};
    p[2][2] = {x:  +4, y: -4};
    p[2][3] = {x:  +4, y: +8};
    p[2][4] = {x:  -4, y: +8};
    p[2][5] = {x:  -4, y: -4};
    p[2][6] = {x:  -6, y: -4};

    p[3] = new Array(7); // north-east
    p[3][0] = {x: +12, y: -6};
    p[3][1] = {x: +8,  y: +4};
    p[3][2] = {x: +4,  y: +2};
    p[3][3] = {x: -8,  y: +8};
    p[3][4] = {x: -16, y: +4};
    p[3][5] = {x: -4,  y: -2};
    p[3][6] = {x: -8,  y: -4};
    
    p[4] = new Array(7); // east
    p[4][0] = {x: +12, y: 0};
    p[4][1] = {x:   0, y: -6};
    p[4][2] = {x:   0, y: -4};
    p[4][3] = {x: -12, y: -4};
    p[4][4] = {x: -12, y: +4};
    p[4][5] = {x:   0, y: +4};
    p[4][6] = {x:   0, y: +6};

    p[5] = new Array(7); // south-east
    p[5][0] = {x: +12, y: +6};
    p[5][1] = {x: -8,  y: +4};
    p[5][2] = {x: -4,  y: +2};
    p[5][3] = {x: -16, y: -4};
    p[5][4] = {x: -8,  y: -8};
    p[5][5] = {x: +4,  y: -2};
    p[5][6] = {x: +8,  y: -4};
    
    p[6] = new Array(7); // south
    p[6][0] = {x:   0, y: +12};
    p[6][1] = {x:  +6, y: +4};
    p[6][2] = {x:  +4, y: +4};
    p[6][3] = {x:  +4, y: -8};
    p[6][4] = {x:  -4, y: -8};
    p[6][5] = {x:  -4, y: +4};
    p[6][6] = {x:  -6, y: +4};

    p[7] = new Array(7);  // south-west
    p[7][0] = {x: -12, y: +6};
    p[7][1] = {x: -8,  y: -4};
    p[7][2] = {x: -4,  y: -2};
    p[7][3] = {x: +8,  y: -8};
    p[7][4] = {x: +16, y: -4};
    p[7][5] = {x: +4,  y: +2};
    p[7][6] = {x: +8,  y: +4};

    function drawArrow(ctx, x, y, dir) {
        if (!p[dir]) return;
        
        ctx.beginPath();

        ctx.moveTo(p[dir][0].x+x, p[dir][0].y+y);
        
        for (var j = 0; j < 7; ++j) {
            ctx.lineTo(p[dir][j].x+x, p[dir][j].y+y);
        }
        
        ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
        ctx.fill();
        ctx.closePath();
    }

    function Path() {
        // call super-class implementation
        TGE['EntitiesFactory']['entity'].call(this);

        // cached value of entity screen position
        this.scr = undefined;
    };

    // super-class inheritance
    Path.prototype = Object.create(TGE['EntitiesFactory']['entity'].prototype);

    Path.prototype.init = function(data, assetManager, map) {
        // convert source data: screen coordinates to the tile coordinates, if any
        // data.x = data.x / map.tilewidth * 2;
        // data.y = data.y / map.tileheight;

        // call super-class implementation
        TGE['EntitiesFactory']['entity'].prototype['init'].call(this, data, assetManager, map);
    };

    Path.prototype.update = function update(dt, time, viewport) {
        this.redraw = true;
        if (!this.animation) {
            this.redraw = false;
            return 1000;
        }
        
        return 1000;
    };

    Path.prototype.render = function render(ctx, stage, viewport) {
        if (!this.visible) return;
        
        if (!this.path) return;
        
        for (var i = 0, l = this.path.length-1; i < l; ++i) {
            var s = this.path[i];
            
            var scr = stage.tile2Scr( s.x, s.y);
//            scr[0] -= viewport[0];
//            scr[1] -= viewport[1];
            scr[1] += ~~(this.map.tileheight/2);
//            this.scr = new Int32Array([scr[0] - viewport[0], scr[1] - viewport[1] + ~~(this.map.tileheight/2)]);

            var dx = this.path[i+1].x - this.path[i].x;
            var dy = this.path[i+1].y - this.path[i].y;
            var dir = 0;
            
                 if (dx === 0 && dy < 0) dir = 3;
            else if (dx === 0 && dy > 0) dir = 7;
            else if (dy === 0 && dx < 0) dir = 1;
            else if (dy === 0 && dx > 0) dir = 5;
            else if (dx > 0   && dy > 0) dir = 6;
            else if (dx < 0   && dy < 0) dir = 2;
            else if (dx > 0   && dy < 0) dir = 4;
            else dir = 0;

            drawArrow(ctx, scr[0], scr[1], dir);
        }
    };
    
    Path.prototype.setPath = function(data) {
        this.path = data.slice(0);
    };

    TGE.EntitiesFactory.register('Path', Path);
})(window, TiledGameEngine);