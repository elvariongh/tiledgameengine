/*! TiledGameEngine v0.0.6 - 17th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
(function(w, TGE) {
    "use strict";
    
    var _ents = [];
    
    var _areas = {};
    
    var states = {die: 'die', critdie: 'critdie', stance: 'stance'};
    
    var guardStates = {guards: 0, resting: 1, worried: 2, fighting: 3};
    
    var sidTrespassing = -1;
    
    function Guard() {
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
    Guard.bind = function(ent, args) {
        if (!ent.setPath) return false;
        
//        ent['_aidx'] = _ents.length;
        
        if (!args) args = [];
        
        var areaName = undefined;
        
        if (args[0]) {
            var obj = ent.map.getObjectByName(args[0]);
            if (!obj) {
                // no object with given name found
                args[0] = undefined;
            } else {
                areaName = args[0];
                
                if (!obj['polyline'] && !obj['ellipse'] && !obj['polygon']) {
                    args[0] = new Uint16Array([ ent.map.px2tx(obj.x),           // x
                                                ent.map.py2ty(obj.y),           // y
                                                ent.map.px2tx(obj.width),       // width
                                                ent.map.py2ty(obj.height)]);    // height
                }
            }
        } else {
            // by default - full map is ramble area
            args[0] = new Uint16Array([ 0,                  // x
                                        0,                  // y
                                        ent.map.width,      // width
                                        ent.map.height]);   // height
        }
        
        args[1] = +args[1];
        if (isNaN(args[1])) args[1] = 10;
        
        _ents[ent['id']] = {    args:       args,
                                sidState:   ent['bus']['subscribe']('entityChangeState',    onEntityChangeState),
                                sidPath:    ent['bus']['subscribe']('entityFinishPath',     onEntityFinishPath),
                                areaName:   areaName,
                                entity:     ent,
                                enemy:      [],
                                state:      guardStates.guards};

        if (areaName) {
            if (sidTrespassing < 0) {
                sidTrespassing = TGE['bus']['subscribe']('mapTrespassing',       onMapTrespassing);
            }
            
            if (!_areas[areaName]) _areas[areaName] = [];
            _areas[areaName][ent['id']] = 1;
        }
        return true;
    };
    
    // Event handlers
    function onEntityChangeState(key, ent) {
        if (ent.state === states.stance) {
            if (_ents[ent['id']].state === guardStates.guards || _ents[ent['id']].state === guardStates.resting) {
                selectTargetCell(ent);
            } else if (_ents[ent['id']].state === guardStates.worried) {
//                ent.pushBehavior([{action: ent.behaviorActions.state, state: 'swing'}]);
//                console.log(key, ent.name, ent.id);

                for (var i = 0, l = _ents[ent['id']].enemy.length; i < l; ++i) {
                    var e = ent.map.getEntityById(_ents[ent['id']].enemy[i]);
                    if (!e) continue;

                    if (ent.map.getDistance(ent.x, ent.y, e.x, e.y) === 1) {
                        // close enought for attack
                        if (e.state === 'die' || e.state === 'critedie') {
                            _ents[ent['id']].state = guardStates.resting;
                        } else {
                            ent.pushBehavior([{action: ent.behaviorActions.wait, time: 500}, {action: ent.behaviorActions.swing, x: e.x, y: e.y}]);
                        }
                        break;
                    } else {
                        // too far
    //                    ent.pushBehavior([{action: ent.behaviorActions.shoot, x: e.x, y: e.y}]);
                        console.log('distance == ',ent.map.getDistance(ent.x, ent.y, e.x, e.y));
                    }
                }
            }
        }
    };

    function onEntityFinishPath(key, ent) {
        if (_ents[ent['id']].state === guardStates.guards) {
            // move entity to the idle mode for a time
            _ents[ent['id']].state = guardStates.resting;
        } else if (_ents[ent['id']].state === guardStates.worried) {
            console.log(key, ent.name, ent.id);
            var e;
            
            for (var i = 0, l = _ents[ent['id']].enemy.length; i < l; ++i) {
                e = ent.map.getEntityById(_ents[ent['id']].enemy[i]);
                if (!e) continue;

                if (ent.map.getDistance(ent.x, ent.y, e.x, e.y) === 1) {
                    // close enought for attack
                    ent.pushBehavior({action: ent.behaviorActions.swing, x: e.x, y: e.y});
                    break;
                } else {
                    // too far
//                    ent.pushBehavior([{action: ent.behaviorActions.shoot, x: e.x, y: e.y}]);
                    console.log('distance == ',ent.map.getDistance(ent.x, ent.y, e.x, e.y));
                }
            }
        }
    };
    
    function onMapTrespassing(key, val) {
        var ent = val.entity;
        var zone = val.object;
        
        // ignore event if zone is out of our guard perimetter
        if (!_areas[zone.name]) return;
        
        // entity is not in the guard team
        if (!_areas[zone.name][ent['id']]) {
            var x = ent['x'], y = ent['y'], 
                i = 0, l = _areas[zone.name].length, 
                p, g;

            // subscribe to entity events
//            ent.bus.subscribe('entityMoved');
            
            
            // move guards to the worried state
            var map = new Uint8Array(ent.map.width*ent.map.height),
                dist = [[-1, 1], 
                        [-1, 0],
                        [-1, -1],
                        [0, -1],
                        [1, -1],
                        [1, 0],
                        [1, 1],
                        [0, 1]],
                j = 0;
                        
            map[x + y * ent.map.width] = 1;
            for (j = 0; j < 8; ++j) {
                map[x + dist[j][0] + (y + dist[j][1])*ent.map.width] = ent.map.isObstacle(x + dist[j][0], y + dist[j][1]) ? 1 : 0;
            }
            
            for (; i < l; ++i) {
                if (!_areas[zone.name][i]) continue;
                
                g = _ents[i].entity;
                
                p = undefined;

                for (j = 0; j < 8; ++j) {
                    
                    if (!map[x + dist[j][0] + (y + dist[j][1])*g.map.width]) {
                        p = g.map.getPath(g.x + g.dx, g.y + g.dy, x + dist[j][0], y + dist[j][1], true);
                        
                        if (p) {
                            map[x + dist[j][0] + (y + dist[j][1])*g.map.width] = 1;
                            break;
                        }
                        
                        p = undefined;
                    }
                }
                
                if (p) {
                    g.map.setEntityPath(g, p);
                }
                
                _ents[g['id']].state = guardStates.worried;
                
                g.breakLinks();

                _ents[g['id']].enemy[ent['id']] = ent['id'];
                
//                g.bind(ent);

                var sel = TiledGameEngine.EntitiesFactory.retain('selection');
                if (sel) {
                    sel.color = 'rgba(255, 0, 0, 0.05)';
                    sel.visible = true;
                    
                    g.map.addEntity(sel);
                    g.map.moveEntity(sel, g['x'], g['y']);
                    sel.bind(g);
                } else {
                    console.warn(g.name, g.id, 'no selection');
                }
            }
            
            // monitor enemy movements
            ent.bus.subscribe('entityMoved', onEnemyMoved);
        }
    };
    
    function onEnemyMoved(key, ent) {
        console.log(key, ent);
        var i = 0, l = _ents.length, j = 0,
            id = ent['id'],
            x = ent['x'],
            y = ent['y'],
            dist = [[-1, 1], 
                    [-1, 0],
                    [-1, -1],
                    [0, -1],
                    [1, -1],
                    [1, 0],
                    [1, 1],
                    [0, 1]],
            map = new Uint8Array(ent.map.width*ent.map.height),
            p;
        
        map[x + y * ent.map.width] = 1;
        for (j = 0; j < 8; ++j) {
            map[x + dist[j][0] + (y + dist[j][1])*ent.map.width] = ent.map.isObstacle(x + dist[j][0], y + dist[j][1]) ? 1 : 0;
        }

        for (; i < l; ++i) {
            if (!_ents[i]) continue;
            
            if (!_ents[i].enemy[id]) continue;
            
            var g = _ents[i].entity;
            
            p = undefined;
            
            for (j = 0; j < 8; ++j) {
                if (!map[x + dist[j][0] + (y + dist[j][1])*g.map.width]) {
                    p = g.map.getPath(g.x+g.dx, g.y+g.dy, x + dist[j][0], y + dist[j][1], true);
                    if (p) {
                        map[x + dist[j][0] + (y + dist[j][1])*g.map.width] = 1;
                        break;
                    }
                    p = undefined;
                }
            }
/*
            if (!p) {
                p = g.map.getPath(g.x + g.dx, g.y + g.dy, ent.x, ent.y, true);
            }
*/
            if (p) {
                g.map.setEntityPath(g, p);
            }
        }
    };
    
    // Idle Logic
    function selectTargetCell(ent) {
        if (ent.state === states.die || ent.state === states.critdie) return;
        
        if (_ents[ent['id']].state === guardStates.resting) {
            setTimeout(function() { if (_ents[ent['id']].state === guardStates.resting) _ents[ent['id']].state = guardStates.guards; onEntityChangeState(null, ent);}, ~~(Math.random() * _ents[ent['id']].args[1]) * 1000);
            return;
        } else if (_ents[ent['id']].state === guardStates.worried) {
            setTimeout(function() { onEntityChangeState(null, ent); }, ~~(Math.random() * _ents[ent['id']].args[1] + 2)* 1000);
            return;
        } else if (_ents[ent['id']].state === guardStates.fighting) {
            return;
        }
        
        var args = _ents[ent['id']].args;
        
        if (!(args[0] instanceof Uint16Array)) return;
        var x = args[0][0],
            y = args[0][1],
            w = args[0][2],
            h = args[0][3],
            tx = ent.x,
            ty = ent.y,
            t = 0,
            dist = [[-1, 1], 
                    [-1, 0],
                    [-1, -1],
                    [0, -1],
                    [1, -1],
                    [1, 0],
                    [1, 1],
                    [0, 1]];

        while (ent.x === tx && ent.y === ty) {
            tx = x + ~~(Math.random() * w) % w;
            ty = y + ~~(Math.random() * h) % h;
            
            if (ent.map.isObstacle(tx, ty)) {
                tx = ent.x; ty = ent.y;
            }
            
            if (++t > 20) {
                // failed to find new position in 20 itterations
                break;
            }
        }
        
        if (tx !== ent.x || ty !== ent.y) {
            var p = ent.map.getPath(ent.x, ent.y, tx, ty, true);
            if (p) {
                ent.map.setEntityPath(ent, p);
            } else {
                // failed to find path to new position - try again later
                setTimeout(function() { selectTargetCell(ent);}, 1000);
            }
        } else {
            // failed to find new position - try again later
            setTimeout(function() { selectTargetCell(ent);}, 1000);
        }
    };
    
    TGE.AI.register('Guard', Guard);
})(window, TiledGameEngine);