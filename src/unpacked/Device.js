/*! TiledGameEngine v0.0.1 - 10th Mar 2015 | https://github.com/elvariongh/tiledgameengine */
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

        this['mobile'] = this['Android'] || this['BlackBerry'] || this['iOS'] || this['Opera'] || this['Windows'];
    }
    
    TGE['Device'] = new Device();
})(navigator, TiledGameEngine);