/*! TiledGameEngine v0.0.2 - 18th Mar 2015 | https://github.com/elvariongh/tiledgameengine */
(function (w) {
    "use strict";

    var fpsmt = undefined,

        rAF = 0,                   // reference for RequestAnimationFrame
        ttu = 0,                   // TimeToUpdate - time (in ms) till next update
        utime = 0,                 // Last update time

        initialized = false,       // Flag to store init state
        running = false,           // Flag to store runloop state

        stages = {},               // key:value dictionary of game stages
        forceRedraw = false;       // if set to TRUE - stage will be redrawn forcibly

    /**
     * TiledGameEngine main class
     * @constructor
     */
    function TGE() {
        this.activeStage = undefined;   // Current active stage name
        
        this['debug'] = true;
    }

    /**
     * Initialize the TGE
     * @this {TGE}
     * @export
     */
    TGE.prototype['init'] = function () {
        if (initialized) return;
        
        initialized = true;
        this.frame = this.frame.bind(this);

        TGE['bus'] = new TGE['PubSub']();

        TGE['bus']['subscribe']('invalidateStage', this.onInvalidateStage.bind(this));
        
        if (this['debug']) {
            fpsmt = (typeof FPSMeter !== undefined) ? new FPSMeter(document.getElementById('viewport'), {'graph': 1, 'heat': 1, 'theme': 'transparent'}) : undefined;
//            fpsmt = (typeof FPSMeter !== undefined) ? new FPSMeter() : undefined;
        }
        
        this.fpsmt = fpsmt;
    }

    /**
     * Handler for the message from stage
     * @this {TGE}
     * @private
     */
    TGE.prototype.onInvalidateStage = function(key, value) {
        if (this.activeStage) {
            if (this.activeStage['name'] === value) {
                forceRedraw = true;
            }
        }
    }

    /**
     * Start the game loop
     * @this {TGE}
     */
    TGE.prototype['start'] = function () {
        if (!initialized) return;

        if (!running) {
            rAF = w.requestAnimationFrame(this.frame);
        }

        running = true;
    }

    /**
     * Stop the game loop
     * @this {TGE}
     */
    TGE.prototype['stop'] = function() {
        if (running) {
            if (rAF) {
                w.cancelAnimationFrame(rAF);
            }
        }

        rAF = 0;
        running = false;
        
        if (this.activeStage) {
            this.activeStage['deactivate']();

            this.activeStage = undefined;
        }
    }

    /**
     * Game loop body
     * @param {number}  time     frame timestamp
     * @this {TGE}
     */
    TGE.prototype.frame = function(time) {
        if (fpsmt) fpsmt['tickStart']();
        var dt = ~~(time - utime);

        if (ttu - dt > 0 && !forceRedraw) {
            // nothing to update yet
            rAF = w.requestAnimationFrame(this.frame);

            if (fpsmt) fpsmt['tick']();
            return;
        }

        // store last update time
        utime = time;

        // update and render the stage
        ttu = this.updateFrame(dt, time);
        this.renderFrame();

        // request next frame update
        rAF = w.requestAnimationFrame(this.frame);
        if (fpsmt) fpsmt['tick']();
    }

    /**
     * Called internally from game loop body to update current stage
     * @param {number}  dt      time difference from last update
     * @param {number}  t       RAF timestamp
     * @return {number}         Return time difference (in ms) to next update
     * @private
     * @this {TGE}
     */
    TGE.prototype.updateFrame = function(dt, t) {
        if (this.activeStage) {
            return this.activeStage['update'](dt, ~~(t));
        }

        return ~~(1000/60);
    }

    /**
     * Called internally from game loop body to render current stage
     * @private
     * @this {TGE}
     */
    TGE.prototype.renderFrame = function() {
        if (this.activeStage) {
            // redraw canvas only if required
            if (this.activeStage['redraw'] || forceRedraw) {
                this.activeStage['render']();
            }
        }

        forceRedraw = false;
    }

    /**
     * Add stage to the contrainer
     * @param {string}  name    Stage name
     * @param {Stage}   stage   Stage object
     * @this {TGE}
     * @export
     */
    TGE.prototype['addStage'] = function(name, stage) {
        if (!stages[name]) {
            stages[name] = stage;
            return true;
        }

        return false;
    }

    /**
     * Get reference to the specified stage
     * @param {string}  name        Stage name
     * @return {Stage|undefined}    Returns Stage objects or undefined, if specified stage not found
     * @export
     */
    TGE.prototype['getStage'] = function(name) {
        if (!stages[name]) return undefined;

        return stages[name];
    }

    /**
     * Deactivate current stage and switch to the specified one
     * @param {string}      name    New stage name
     * @return {boolean}    TRUE on success
     * @this {TGE}
     * @export
     */
    TGE.prototype['activateStage'] = function (name) {
        if (this.activeStage) {
            this.activeStage['deactivate']();

            this.activeStage = undefined;
        }
        
        if (fpsmt) {
            fpsmt.destroy();
        }

        if (stages[name]) {
            this.activeStage = stages[name];

            this.activeStage['activate']();

            this.activeStage['redraw'] = true;
        }

        if (fpsmt) {
            fpsmt = new FPSMeter(document.getElementById('viewport'), {'graph': 1, 'heat': 1, 'theme': 'transparent'});
        }

        return this.activeStage !== undefined;
    }

    TGE['bus'] = undefined;

    w['TiledGameEngine'] = TGE;

})(window);
