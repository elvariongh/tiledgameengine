/*! TiledGameEngine v0.0.5 - 07th Apr 2015 | https://github.com/elvariongh/tiledgameengine */
(function(n, TGE) {
    "use strict";
    /**
     * @constructor
     */
    function Device() {
        this['Android'] = n.userAgent.match(/Android/i);
        this['BlackBerry'] = n.userAgent.match(/BlackBerry/i);
        this['iOS'] = n.userAgent.match(/iPhone|iPad|iPod/i);
        this['Opera'] = n.userAgent.match(/Opera Mini/i);
        this['Windows'] = n.userAgent.match(/IEMobile/i);
        
        // touch event support
        this['touch'] = (('ontouchstart' in window) || (n.MaxTouchPoints > 0) || (n.msMaxTouchPoints > 0));
        
        // orientation API support
        this['orientation'] = screen.orientation || screen.mozOrientation || screen.msOrientation || null;
        
        if (this['orientation']) {
            if (typeof this['orientation'] === 'object') {
                this['orientationLock'] =  function(v) { screen.orientation.lock(v) };
                this['orientationUnlock'] =  function(v) { screen.orientation.unlock() };
            } else {
                if (screen.mozOrientation) {
                    this['orientationLock'] =  screen.mozLockOrientation;
                    this['orientationUnlock'] =  screen.mozUnlockOrientation;
                } else if (screen.msOrientation) {
                    this['orientationLock'] =  screen.msLockOrientation;
                    this['orientationUnlock'] =  screen.msUnlockOrientation;
                } else {
                    this['orientationLock'] =  screen.lockOrientation;
                    this['orientationUnlock'] =  screen.unlockOrientation;
                }
            }
        }

        this['mobile'] = this['Android'] || this['BlackBerry'] || this['iOS'] || this['Opera'] || this['Windows'];
    }
    
    TGE['Device'] = new Device();
})(navigator, TiledGameEngine);