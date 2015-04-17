/*! TiledGameEngine v0.0.6 - 17th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
/** History:
 *  Who             When            What    Status  Description
 *  @elvariongh     23 Mar, 2015    #3      Fixed   Replaced direct text insertion with document fragment
 */
(function(w, TGE) {
    /**
     * @constructor
     * @param {string|undefined}       tag          css query for screen HTML-element
     * @param {number|undefined}       height       screen height, 320px by default
     * @param {number|undefined}       width        screen width, 200px by default
     */
    function ViewPort(tag, width, height) {
        // set default values, if any
        if (!tag) tag = '#viewport';
        if (!height) height = 320;
        if (!width) width = 200;
        
        this.ctx = [];
        this.domViewport = undefined;
        
        this.boundingBox = new Int32Array([-width, -height, width, height]);

        // viewport data storage [left, top, width, height, visible]
        this['viewport'] = new Int32Array([0, 0, width, height, false]);
        
        // viewport DnD structure [startX, startY, dragging, dx, dy, pressed]
        this.dnd = new Int32Array([0, 0, 0, 0, 0, 0]);
        
        this['layers'] = 0;

        this.dWidth = window.innerWidth - width;
        this.dHeight = window.innerHeight - height;

        // store viewport reference and set initial css styles
        this.domViewport = document.querySelector(tag);
        this.domViewport.style.cssText = 'position: absolute; left: 50%; margin-left:-'+width/2+'px; top: 100px; display:none;';
//        this.domViewport.style.cssText = 'position:fixed; left: 0px; top:0px; display:none;';

//        var clrect = this.domViewport.getClientRects();
        
        this.offsetX  = 0;// clrect[0].left;
        this.offsetY  = 0;// clrect[0].top;
        
        // desktop only events: resize, mousedown, mouseup, mousemove
        window.addEventListener('resize',                   throttle(this.onResize, 64, this), true);
        this.domViewport.addEventListener('mousedown',      throttle(this.onMouseDown,  16, this), true);
        this.domViewport.addEventListener('mouseup',        throttle(this.onMouseUp,    16, this), true);
        this.domViewport.addEventListener('mousemove',      throttle(this.onMouseMove,  32, this), true);
        this.domViewport.addEventListener('mouseout',       throttle(this.onMouseUp,    16, this), true);
        this.domViewport.addEventListener('mouseclick',     throttle(this.onMouseClick, 16, this), true);
        this.domViewport.addEventListener('contextmenu',    throttle(this.onMouseClick2,16, this), true);
        
        document.addEventListener('keydown', this.onKeyDown.bind(this), true);
        
        // touch events
        if (TGE['Device'] && TGE['Device']['touch']) {
            this.touchHistory = [];
            this.domViewport.addEventListener("touchstart",     throttle(this.touchHandler, 16, this), true);
            this.domViewport.addEventListener("touchmove",      throttle(this.touchHandler, 16, this), true);
            this.domViewport.addEventListener("touchend",       throttle(this.touchHandler, 16, this), true);
            this.domViewport.addEventListener("touchcancel",    throttle(this.touchHandler, 16, this), true);
        }
        
        if (TGE['Device'] && TGE['Device']['mobile']) {
            // disable page zoom on mobiles
            var n = document.createDocumentFragment();
            n.textContent = '<meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, height=device-height, target-densitydpi=device-dpi" />';
            document.getElementsByTagName('head')[0].appendChild(n);
        }
        
        // create canvas elements inside container
        this['addLayer'](2);
        
        setTimeout((function f() {         
            var clrect = this.domViewport.getClientRects();
            if (clrect.length) {
                this.offsetX  = clrect[0].left;
                this.offsetY  = clrect[0].top;
            }
        }).bind(this), 0);
        
        this.profiling = 0;
    };
    
    ViewPort.prototype.touchHandler = function(e) {
        // stop default event processing
        e.preventDefault();
        
        // get touch event
        var touch = e.changedTouches[0],
            type = e.type;
        
        // add this event to the touch history
        this.touchHistory[this.touchHistory.length] = e.type;
        
        // analyze event sequences
        if (this.touchHistory.length > 3) {
            this.touchHistory.shift();
        }
        
        var h = this.touchHistory;
        var l = h.length;
        if (l > 1) {
            if (h[l-1] === "touchend") {
                if (h[l-2] === "touchstart" || (l === 3 && h[l-3] === "touchstart")) {
                    type = "tap";
                }			
            } else if (h[l-1] === "touchmove") {
                if (h[l-2] === "touchstart") { // ignore that event
                    return;
                }
            }
        }

        // simulate mouse events
        var simulatedEvent = document.createEvent("MouseEvent");
            simulatedEvent.initMouseEvent({
            touchstart: "mousedown",
            touchmove: "mousemove",
            touchend: "mouseup",
            tap: "mouseclick"
        }[type], true, true, window, 1,
            touch.screenX, touch.screenY,
            touch.clientX, touch.clientY, false,
            false, false, false, 0, null);

        touch.target.dispatchEvent(simulatedEvent);
    };

    ViewPort.prototype.onKeyDown = function(e) {
        switch (e.which) {
            // case 192: /* ~ */ {
                // if (this.profiling) console.profileEnd();
                // else console.profile();
                
                // this.profiling ^= 1;
            // } break;
            
            // case 33 /* PageUp */: {
                // this.dnd[3] = -8;
                // this.dnd[4] = 0;
            // } break;
            // case 34 /* PageDown */: {
                // this.dnd[3] = 8;
                // this.dnd[4] = 0;
            // } break;
            // case 35 /* End */: {
                // this.dnd[3] = 0;
                // this.dnd[4] = 8;
            // } break;
            // case 36 /* Home */: {
                // this.dnd[3] = 0;
                // this.dnd[4] = -8;
            // } break;
            // case 37 /* Left */: {
                // // this.dnd[3] = -2;
                // // this.dnd[4] = 0;
            // } break;
            // case 38 /* Up */: {
                // // this.dnd[4] = -2;
                // // this.dnd[3] = 0;
            // } break;
            // case 39 /* Right */: {
                // // this.dnd[3] = 2;
                // // this.dnd[4] = 0;
            // } break;
            // case 40 /* Down */: {
                // // this.dnd[4] = 2;
                // // this.dnd[3] = 0;
            // } break;
            // case 97 /* Num 1 */: {
                // // this.dnd[4] = 2;
                // // this.dnd[3] = -2;
            // } break;
            // case 99 /* Num 3 */: {
                // // this.dnd[4] = 2;
                // // this.dnd[3] = 2;
            // } break;
            // case 105 /* Num 9 */: {
                // // this.dnd[4] = -2;
                // // this.dnd[3] = 2;
            // } break;
            // case 103 /* Num 7 */: {
                // // this.dnd[4] = -2;
                // // this.dnd[3] = -2;
            // } break;
            case 37 /* Left */:
            case 38 /* Up */:
            case 39 /* Right */:
            case 40 /* Down */: {
                TGE['bus']['notify']('keypresses', e.which);
            } break;
            case 93 /* Context Menu */: {
                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                return;
            } break;
            default: {
                console.log(e.which);
                return;
            } break;
        }

        // update viewport coordinates
        // if (this['viewport'][0] + this.dnd[3]                       >= this.boundingBox[0] &&
            // this['viewport'][0] + this['viewport'][2] + this.dnd[3] <= this.boundingBox[2]) {
            // this['viewport'][0] += this.dnd[3];
        // } else {
            // this.dnd[3] = 0;
        // }
        
        // if (this['viewport'][1] + this.dnd[4]                       >= this.boundingBox[1] &&
            // this['viewport'][1] + this['viewport'][3] + this.dnd[4] <= this.boundingBox[3]) {
            // this['viewport'][1] += this.dnd[4];
        // } else this.dnd[4] = 0;

        // if (this.dnd[3] || this.dnd[4]) {
            // // notify all subscribers
            // TGE['bus']['notify']('onviewportmove');
        // }
    };
    
    ViewPort.prototype.onMouseClick2 = function(e) {
        // stop event propagation
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
    }
    
    ViewPort.prototype.onMouseClick = function(e) {
        // stop event propagation
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        TGE['bus']['notify']('click', {x: e.clientX - this.offsetX, y: e.clientY - this.offsetY, which: e.which});
    }
    
    // mouse down handler - start dragging
    ViewPort.prototype.onMouseDown = function(e) {
        // stop event propagation
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();

        // store initial mouse position
        this.dnd[0] = e.clientX - this.offsetX;
        this.dnd[1] = e.clientY - this.offsetY;
        this.dnd[2] = false;
        this.dnd[5] = true;
    };
    
    // mouse up and mouse out handler - stop dragging
    ViewPort.prototype.onMouseUp = function(e) {
        // stop event propagation
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        
        
        // stop dragging
        if (this.dnd[2]) {
            this.dnd[5] = false;
            
            this.dnd[2] = false;
            this.dnd[3] = e.clientX - this.dnd[0] - this.offsetX;
            this.dnd[4] = e.clientY - this.dnd[1] - this.offsetY;
            
            // if mouse didn't changed its position - stop processing
            if (!this.dnd[3] && !this.dnd[4]) return;

            // update viewport coordinates
            if ((this['viewport'][0] + this.dnd[3] >= this.boundingBox[0] &&
                this['viewport'][0] + this['viewport'][2] + this.dnd[3] <= this.boundingBox[2])) {
                this['viewport'][0] += this.dnd[3];
            } else {
                this.dnd[3] = 0;
            }
            
            if ((this['viewport'][1] + this.dnd[4] >= this.boundingBox[1] &&
                this['viewport'][1] + this['viewport'][3] + this.dnd[4] <= this.boundingBox[3])) {
                this['viewport'][1] += this.dnd[4];
            } else this.dnd[4] = 0;

            if (this.dnd[3] || this.dnd[4]) {
                // notify all subscribers
                TGE['bus']['notify']('onviewportmove');
            }
        } else {
            if (this.dnd[5]) {
                // simulate mouse events
                var simulatedEvent = document.createEvent("MouseEvent");
                    simulatedEvent.initMouseEvent(
                    "mouseclick",       // type
                    true,               // canBubble
                    true,               // cancelable
                    this.domViewport,   // view
                    1,                  // detail
                    e.screenX,          // screenX
                    e.screenY,          // screenY
                    e.clientX,          // clientX
                    e.clientY,          // clientY
                    false,              // ctrlKey
                    false,              // altKey
                    false,              // shiftKey
                    false,              // metaKey
                    e.which,            // button
                    null);              // relatedTarget

                e.target.dispatchEvent(simulatedEvent);
            }
            this.dnd[5] = false;
        }
    };
    
    // mouse move handler - drag
    ViewPort.prototype.onMouseMove = function(e) {
        // stop event propagation
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        // calculate mouse position difference
        this.dnd[3] = e.clientX - this.dnd[0] - this.offsetX;
        this.dnd[4] = e.clientY - this.dnd[1] - this.offsetY;
        
        // if mouse didn't changed its position - stop processing
        if (!this.dnd[3] && !this.dnd[4]) return;

        if (this.dnd[5]) {
            this.dnd[2] = true;
            // update viewport coordinates
            if ((this['viewport'][0] + this.dnd[3] >= this.boundingBox[0] &&
                this['viewport'][0] + this['viewport'][2] + this.dnd[3] <= this.boundingBox[2])) {
                this['viewport'][0] += this.dnd[3];
            } else {
                this.dnd[3] = 0;
            }
            
            if ((this['viewport'][1] + this.dnd[4] >= this.boundingBox[1] &&
                this['viewport'][1] + this['viewport'][3] + this.dnd[4] <= this.boundingBox[3])) {
                this['viewport'][1] += this.dnd[4];
            } else this.dnd[4] = 0;

            if (this.dnd[3] || this.dnd[4]) {
                // notify all subscribers
                TGE['bus']['notify']('onviewportmove');
            }
        } else {
            TGE['bus']['notify']('mousemove', {x: e.clientX - this.offsetX, y: e.clientY - this.offsetY});
        }
        
        // store new initial mouse position
        this.dnd[0] = e.clientX - this.offsetX;
        this.dnd[1] = e.clientY - this.offsetY;
    };
    
    // resize event handler
    ViewPort.prototype.onResize = function(e) {
        if (!document.fullscreenEnabled) {
        
            this['resize'](e.target.innerWidth - this.dWidth, e.target.innerHeight - this.dHeight);

            var clrect = this.domViewport.getClientRects();
            this.offsetX  = clrect[0].left;
            this.offsetY  = clrect[0].top;
        } else {
            this['resize'](e.target.innerWidth, e.target.innerHeight);
            this.offsetX = this.offsetY = 0;
        }
//        this['resize'](e.target.innerWidth, e.target.innerHeight);
    };
    
    // resize canvas and viewport
    ViewPort.prototype['resize'] = function(width, height) {
        for (var l = this.ctx.length; l--;) {
            this.ctx[l].canvas.width = this.ctx[l].width = width;
            this.ctx[l].canvas.height = this.ctx[l].height = height;
        }
        
        this['viewport'][2] = width;
        this['viewport'][3] = height;
        
        this.domViewport.style.width = width + 'px';
        this.domViewport.style.height = height + 'px';
        this.domViewport.style.marginLeft = '-'+width/2 + 'px';

        if (TGE['bus']) {
            TGE['bus']['notify']('onviewportresize');
        }
    };
    
    // move view port
    ViewPort.prototype['move'] = function(x, y) {
        // update viewport coordinates
        this['viewport'][0] = x;
        this['viewport'][1] = y;
        
        // notify all subscribers
        TGE['bus']['notify']('onviewportmove');
    };

    // show/hide view port
    ViewPort.prototype['show'] = function(visible) {
        if (visible != this['viewport'][4]) {
            // make changes only if it differ from current state
            this.domViewport.style.display = visible ? 'block' : 'none';
            
            if (visible) {
                setTimeout((function f() {         
                    var clrect = this.domViewport.getClientRects();
                    this.offsetX  = clrect[0].left;
                    this.offsetY  = clrect[0].top;
                }).bind(this), 0);
            }
        }
        
        this['viewport'][4] = visible;
    };


    // fadeIn/fadeOut view port
    ViewPort.prototype['fade'] = function(visible) {
        if (visible != this['viewport'][4]) {
        
            if (visible) { // fade in
//                this.domViewport.style.display = 'block';
//                this.domViewport.style.opacity = 0;
                
//                var el = this.domViewport;
                var self = this;
                
                (function fadeIn() {
                    var val = parseFloat(self.ctx[0].canvas.style.opacity);
                    if (isNaN(val)) val = 0;
                    
                    if (val === 0) {
                        for (var l = self.ctx.length; l--;) {
                            self.ctx[l].canvas.style.display = 'block';
                        }
                    }
                    
                    if (!((val += .05) > 1)) {
//                        el.style.opacity = val;
                        for (var l = self.ctx.length; l--;) {
                            self.ctx[l].canvas.style.opacity = val;
                        }
                        requestAnimationFrame(fadeIn);
                    } else {
                        TGE['bus']['notify']('screenAnimationEnd', {visible: true});
                    }
                })();
            } else {
//                this.domViewport.style.display = 'block';
//                this.domViewport.style.opacity = 1;
                
//                var el = this.domViewport;
                var self = this;

                (function fadeOut() {
                    var val = parseFloat(self.ctx[0].canvas.style.opacity);
                    if (isNaN(val)) val = 1;
                    
                    if ((val -= .05) < 0) {
                        for (var l = self.ctx.length; l--;) {
                            self.ctx[l].canvas.style.display = 'none';
                        }
                        TGE['bus']['notify']('screenAnimationEnd', {visible: false});
                    } else {
                        for (var l = self.ctx.length; l--;) {
                            self.ctx[l].canvas.style.opacity = val;
                        }
                        requestAnimationFrame(fadeOut);
                    }
                })();
            }
        
        }

        this['viewport'][4] = visible;
    };
    
    // get canvas context for layer.
    // @param {number}  layer   Layer number (0 for bottom layer)
    ViewPort.prototype['getLayer'] = function(layer) {
        if (this.ctx.length > layer)
            return this.ctx[layer];

        return undefined;
    };
    
    // add new canvas layer
    ViewPort.prototype['addLayer'] = function(count) {
        count = count || 1;
        var t = this.domViewport.innerHTML, i = this['layers'];
        
        while(count--) {
            
//            t += '<canvas style="position:fixed; left: 0px; top: 0px; z-index: '+(i)+';" id="_tgelr'+(i)+'"></canvas>';
            t += '<canvas style="position:absolute; left: 0px; top: 0px; z-index: '+(i)+';" id="_tgelr'+(i)+'"></canvas>';
            
            ++i;
        }

        this.domViewport.innerHTML = t;
        
        var l = i;//this.ctx.length;
        i = 0;
            
        for (; i < l; ++i) {
            this.ctx[i] = document.getElementById('_tgelr'+i);
            this.ctx[i] = this.ctx[i].getContext('2d')
            
        }
        
        this['layers'] = l;
        
        // set initial viewport size
        this['resize'](this['viewport'][2], this['viewport'][3]);
    };
    
    // remove canvas layer (-s)
    ViewPort.prototype['remLayer'] = function(count) {
        count = count || 1;

        var i = this['layers'],
            t = this.domViewport.innerHTML.split('</canvas>');

        for (i = t.length; i--;) {
            if (t[i].length === 0) {
                delete t[i];
                t.splice(i, 1)
//                ++i;
            }
        }
        
        i = this['layers'];
        
        for (;i--;) {
            delete this.ctx[i];
        }

        i = this['layers'];
        while (count--) {
            t.pop();
            --i;
        }
        
        t = t.join('</canvas>');
        
        this.domViewport.innerHTML = t;

        this.ctx.length = i;
        this['layers'] = i;

        for (i = 0; i < this['layers']; ++i) {
            this.ctx[i] = document.getElementById('_tgelr'+i);
            this.ctx[i] = this.ctx[i].getContext('2d')
            
        }
        
        // set initial viewport size
        this['resize'](this['viewport'][2], this['viewport'][3]);
    };

    // clear specified layer/all layers
    // @param {number|undefined}    layer   layer id
    ViewPort.prototype['clear'] = function(layer) {
        if (layer === undefined) {
            for (var l = this.ctx.length; l--;) {
                this.ctx[l].clearRect(0, 0, this['viewport'][2], this['viewport'][3]);
            }
        } else {
            var ctx = this['getLayer'](layer);
            if (ctx) {
                ctx.clearRect(0, 0, this['viewport'][2], this['viewport'][3]);
            }
        }
    };

    // set background color for whole scene
    ViewPort.prototype['setBGColor'] = function(color) {
        this.domViewport['style']['backgroundColor'] = color;
    };
    
    ViewPort.prototype['setBoundingBox'] = function(left, top, right, bottom) {
        this.boundingBox[0] = +left;
        this.boundingBox[1] = +top;
        this.boundingBox[2] = +right;
        this.boundingBox[3] = +bottom;
        
        var x = this.viewport[0], y = this.viewport[1];
        if (this.viewport[0] < this.boundingBox[0]) x = this.boundingBox[0];
        if (this.viewport[1] < this.boundingBox[1]) y = this.boundingBox[1];
        
        this.move(x, y);
    };
    
    /**
     * Lock the screen orientation, if possible
     * @param   {string}    val     Screen orientation value. Possible values:
     *                              any                 The devices is able to be locked in any orientation it can assume
     *                              natural             The device is in its natural orientation. For a smartphone this 
     *                                                  usually means in its primary portrait mode (with the buttons in 
     *                                                  direction of the ground).
     *                              portrait            see #portrait-primary
     *                              landscape           see #landscape-primary
     *                              portrait-primary    The orientation is in the primary portrait mode with the buttons 
     *                                                  at the bottom.
     *                              portrait-secondary  The orientation is in the secondary portrait mode with the buttons 
     *                                                  at the top (the device is down under)
     *                              landscape-primary   The orientation is in the primary landscape mode with the buttons 
     *                                                  at the right.
     *                              landscape-secondary The orientation is in the secondary landscape mode with the buttons at the left.
     */
    ViewPort.prototype['lockOrientation'] = function(val) {
        if (TGE['Device'] && TGE['Device']['orientation']) {
            TGE['Device']['orientationLock'](val);
        }
    }
    
    /**
     * Release a previously set lock orientation
     */
    ViewPort.prototype['unlockOrientation'] = function() {
        if (TGE['Device'] && TGE['Device']['orientation']) {
            TGE['Device']['orientationUnlock']();
        }
    }

    ViewPort.prototype['fullscreen'] = function() {
        if (document.fullscreenEnabled) {
            ducument.exitFullscreen();
        } else {
            this.domViewport.requestFullscreen();
        }
    }
    
    TGE['ViewPort'] = ViewPort;
})(window, TiledGameEngine);