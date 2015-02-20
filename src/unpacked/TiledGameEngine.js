(function(w) {

    var _fps = (typeof FPSMeter !== undefined) ? new FPSMeter({'graph':1, 'heat': 1, 'theme': 'transparent'}) : undefined;

    var rAF = 0;                   // reference for RequestAnimationFrame
    var ttu = 0;                   // TimeToUpdate - time (in ms) till next update
    var utime = 0;                  // Last update time

    var initialized = false;       // Flag to store init state
    var running = false;           // Flag to store runloop state
        
    var stages = {};               // key:value dictionary of game stages
    var forceRedraw = false;       // if set to TRUE - stage will be redrawn forcibly
    
    /**
     * TiledGameEngine main class
     * @constructor
     */
    function TGE() {
        "use strict";

        this.activeStage = undefined;   // Current active stage name
    };

    /**
     * Initialize the TGE
     * @this {TGE}
     * @export
     */
    TGE.prototype['init'] = function () {
        "use strict";
        initialized = true;
        this.frame = this.frame.bind(this);
        
        TGE['bus'] = new TGE['PubSub']();
        
        TGE['bus']['subscribe']('invalidateStage', this.onInvalidateStage.bind(this));
    };
    
    /**
     * Handler for the message from stage
     * @this {TGE}
     * @private
     */
    TGE.prototype.onInvalidateStage = function(key, value) {
        "use strict";
        if (this.activeStage) {
            if (this.activeStage['name'] === value) {
                forceRedraw = true;
            }
        }
    };

    /**
     * Start the game loop
     * @this {TGE}
     */
    TGE.prototype['start'] = function () {
        "use strict";
        if (!initialized) return;

        if (!running) {
            rAF = w.requestAnimationFrame(this.frame);
        }

        running = true;
    };

    /**
     * Stop the game loop
     * @this {TGE}
     */
    TGE.prototype['stop'] = function() {
        "use strict";
        if (running) {
            if (rAF) {
                w.cancelAnimationFrame(rAF);
            }
        }

        rAF = 0;
        running = false;
    };

    /**
     * Game loop body
     * @param {number}  time     frame timestamp
     * @this {TGE}
     */
    TGE.prototype.frame = function(time) {
        "use strict";
        var dt = time - utime;

        if (ttu - dt > 0 && !forceRedraw) {
            // nothing to update yet
            rAF = w.requestAnimationFrame(this.frame);

            return;
        }

        // store last update time
        utime = time;
        
        // update and render the stage
        ttu = this.updateFrame(dt);
        this.renderFrame();

        // request next frame update
        rAF = w.requestAnimationFrame(this.frame);
    };

    /**
     * Called internally from game loop body to update current stage
     * @param {number}  dt      time difference from last update
     * @return {number}         Return time difference (in ms) to next update
     * @private
     * @this {TGE}
     */
    TGE.prototype.updateFrame = function(dt) {
        "use strict";
        if (this.activeStage) {
            return this.activeStage['update'](dt);
        }

        return ~~(1000/60);
    };

    /**
     * Called internally from game loop body to render current stage
     * @private
     * @this {TGE}
     */
    TGE.prototype.renderFrame = function() {
        "use strict";
        if (_fps) _fps['tickStart']();
        if (this.activeStage) {
            // redraw canvas only if required
            if (this.activeStage['redraw'] || forceRedraw) {
                this.activeStage['render']();
            }
        }
        
        forceRedraw = false;
        if (_fps) _fps['tick']();
    };
    
    /**
     * Add stage to the contrainer
     * @param {string}  name    Stage name
     * @param {Stage}   stage   Stage object
     * @this {TGE}
     * @export
     */
    TGE.prototype['addStage'] = function(name, stage) {
        "use strict";
        if (!stages[name]) {
            stages[name] = stage;
            return true;
        }
        
        return false;
    };
    
    /**
     * Get reference to the specified stage
     * @param {string}  name        Stage name
     * @return {Stage|undefined}    Returns Stage objects or undefined, if specified stage not found
     * @export
     */
    TGE.prototype['getStage'] = function(name) {
        "use strict";
        if (!stages[name]) return undefined;
        
        return stages[name];
    };
    
    /**
     * Deactivate current stage and switch to the specified one
     * @param {string}      name    New stage name
     * @return {boolean}    TRUE on success
     * @this {TGE}
     * @export
     */
    TGE.prototype['activateStage'] = function (name) {
        "use strict";
        if (this.activeStage) {
            this.activeStage['deactivate']();
            
            this.activeStage = undefined;
        }
        
        if (stages[name]) {
            this.activeStage = stages[name];

            this.activeStage['activate']();
            
            this.activeStage['redraw'] = true;
        }
        
        return this.activeStage !== undefined;
    };
    
    TGE['bus'] = undefined;

    w['TiledGameEngine'] = TGE;

})(window);
