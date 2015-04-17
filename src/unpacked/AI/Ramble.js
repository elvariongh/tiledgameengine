/*! TiledGameEngine v0.0.6 - 17th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
(function(w, TGE) {
    "use strict";
    
    var _ents = [];
    
    var states = {die: 'die', critdie: 'critdie', stance: 'stance'};
    
    function Ramble() {
        // syntax: ramble(guard_zone_name, idle_timeout)
        // if idle_timeout is not set - default value is 10 seconds
        // if guard_zone_name is not set - whole map is taken by default.
        // if guard_zone_name is set, but not found on the map - entity will not move anywhere
    };
    
    /**
     *  Bind entity instance with this AI pattern
     *  @param  {Entity}    ent     Entity to be binded
     *  @param  {Array}     args    Initialization arguments
     *  @return {Boolean}   TRUE on success, FALSE otherwise
     */
    Ramble.bind = function(ent, args) {
        if (!ent.setPath || !ent['mobile']) {
            // Entity should be able to accept path and should be movable
            return false;
        }
        
        if (!args) args = [];
        
        // 1st argument is zone name
        if (args[0]) {
            // walking zone is set - find it on map and get bounding box
            var obj = ent.map.getObjectByName(args[0]);
            if (!obj) {
                // no object with given name found - full map will be used
                args[0] = undefined;
            } else {
                if (!obj['polyline'] && !obj['ellipse'] && !obj['polygon']) {
                    // only rectangle zones acceptable now
                    args[0] = new Uint16Array([ ent.map.px2tx(obj.x),           // x
                                                ent.map.py2ty(obj.y),           // y
                                                ent.map.px2tx(obj.width),       // width
                                                ent.map.py2ty(obj.height)]);    // height
                }
            }
        }
        
        if (!args[0]) {
            // by default - full map is ramble area
            args[0] = new Uint16Array([ 0,                  // x
                                        0,                  // y
                                        ent.map.width,      // width
                                        ent.map.height]);   // height
        }
        
        // 2nd argument is idle time. 15 seconds by default
        args[1] = +args[1];
        if (isNaN(args[1])) args[1] = 15;
        
        // bind entity and subscribe to required events
        _ents[ent['id']] = {    args:       args,
                                sidState:   ent['bus']['subscribe']('entityChangeState',    onEntityChangeState),
                                sidPath:    ent['bus']['subscribe']('entityFinishPath',     onEntityFinishPath),
                                idle:       false};
        
        return true;
    };
    
    // Event handlers
    function onEntityChangeState(key, ent) {
        // If entity changes its animation state to the stance - select new target cell
        if (ent.state === states.stance) {
            selectTargetCell(ent);
        }
    };

    function onEntityFinishPath(key, ent) {
        // move entity to the idle mode for a time. Take some rest
        _ents[ent['id']].idle = true;
    };
    
    // Ramble logic
    function selectTargetCell(ent) {
        if (ent.state === states.die || ent.state === states.critdie) {
            // Entity has died
            return;
        }
        
        if (_ents[ent['id']].idle) {
            // Entity is resting - change its state to the active in some seconds
            setTimeout(function() { _ents[ent['id']].idle = false; selectTargetCell(ent);}, ~~(Math.random() * _ents[ent['id']].args[1]) * 1000);
            return;
        }
        
        var args = _ents[ent['id']].args;
        
        if (!(args[0] instanceof Uint16Array)) {
            // no area defined
            return;
        }
        
        // select random cell in specified area
        var x = args[0][0],
            y = args[0][1],
            w = args[0][2],
            h = args[0][3],
            tx = ent.x,
            ty = ent.y,
            t = 0,
            p;

        while (ent.x === tx && ent.y === ty) {
            tx = x + ~~(Math.random() * w) % w;
            ty = y + ~~(Math.random() * h) % h;
            
            if (ent.map.isObstacle(tx, ty)) {
                tx = ent.x; ty = ent.y;
            }
            
            if (++t > 20) {
                // failed to find new position in 20 iterations
                break;
            }
        }
        
        if (tx !== ent.x || ty !== ent.y) {
            // new target cell found - get path to it
            p = ent.map.getPath(ent.x, ent.y, tx, ty, true);
            if (p) ent.map.setEntityPath(ent, p);
        } 
        
        if (!p) {
            // failed to find new position or path - try again later
            setTimeout(function() { selectTargetCell(ent);}, 1000);
        }
    };
    
    // Register AI pattern in AI factory
    TGE.AI.register('Ramble', Ramble);
})(window, TiledGameEngine);