/*! TiledGameEngine v0.0.1 - 10th Mar 2015 | https://github.com/elvariongh/tiledgameengine */
(function(w, TGE) {
    /**
     * Construct LoadingStage instance 
     * @constructor
     * @extends Stage
     * @param {Assets|null|undefined}   assetManager        Reference to the TiledGameEngine.Assets instance or null
     * @param {Screen|undefined}        [screen=undefined]  Reference to the #Screen object
     * @param {boolean|undefined}       [autostart=true]    Indicates should assets loading be started on stage activation
     * @param {number|undefined}        [stages=1]          Count of loading stages
     */
    function LoadingStage(assetManager, screen, autostart, stages) {
        TiledGameEngine['Stage'].call(this, 'LoadingStage', assetManager, screen);

        this['am'] = this['am'] ? this['am'] : new TiledGameEngine['Assets']();
        
        this.stages = stages || 1;
        this.currentStage = 1;
        
        this.progress = 0;
        this.autostart = autostart !== undefined ? autostart : true;
        
        this.status = {};
        
        this.fnDone = this.fnDone.bind(this);
        this.fnProgress = this.fnProgress.bind(this);
        
        this.fullRender = true;
    };
    
    // super-class inheritance
    LoadingStage.prototype = Object.create(TGE['Stage'].prototype);
    
    LoadingStage.prototype['setStage'] = function(stage) {
        this.currentStage = Math.max(stage, this.stages);
        console.log(this.currentStage, stage, this.stages);
    }
    
    /**
     * Request new asset from server
     * @param {string}      name    Asset file name
     * @this {LoadingStage}
     */
    LoadingStage.prototype['request'] = function(name) {
        if (Array.isArray(name)) {
            for (var l = name.length; l--; ) {
                this['am']['request'](name[l]);
                
                this.status[name[l]] = 0;
            }
        } else {
            this['am']['request'](name);
            this.status[name] = 0;
        }
    };
    
    /**
     * Initiates assets loading
     * @this {LoadingStage}
     */
    LoadingStage.prototype['start'] = function() {
        this.status['total'] = this['am']['total']();
        
        this['am']['download']( this.fnDone, this.fnProgress );
        
        this.progress = 0;
        
        for (var k in this.status) {
            if (k === 'total') continue;
            
            this.progress += this.status[k];
        }
        
//        this.progress = ~~(this.progress / this.status['total'] / this.stages + this.currentStage * (100 / this.stages));
        this.progress = ~~(this.progress / this.status['total'] / this.stages + (this.currentStage - 1)* (100 / this.stages));

        if (!this['screen']) return;
        
        // clear screen
        this['screen']['clear']();

        // set CTX properties once
        var ctx = this['screen']['getLayer'](1);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        
        ctx = this['screen']['getLayer'](2);
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';

        this['redraw'] = true;
        this.fullRender = true;
        TiledGameEngine['bus']['notify']('invalidateStage', this['name']);
    };
    
    LoadingStage.prototype['onViewportResize'] = function(key, value) {
        TiledGameEngine['Stage'].prototype['onViewportResize'].call(this);
        
        // set CTX properties once
        var ctx = this['screen']['getLayer'](1);
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        
        ctx = this['screen']['getLayer'](2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        
        // mark stage for redraw
        this['redraw'] = true;
        this.fullRender = true;
        TiledGameEngine['bus']['notify']('invalidateStage', this['name']);
    };
    
    LoadingStage.prototype['onViewportMove'] = function(key, value) {
        // ignore Viewport moving
//        this.redraw = true;

//        TGE.bus.notify('invalidateStage', this.name);
    };
    
    /**
     * Callback function for all assets loaded
     * @this {LoadingStage}
     */
    LoadingStage.prototype.fnDone = function() {
        this.progress = ~~(100 * this.currentStage / this.stages);
        
        TiledGameEngine['bus']['notify']('assetsLoaded');

        // mark stage for redraw
        this['redraw'] = true;
    };
    
    /**
     * Callback function for asset loadeding progress
     * @param {string}  name    asset name
     * @param {number}  p       loading progress on specified asset
     * @this {LoadingStage}
     */
    LoadingStage.prototype.fnProgress = function(name, p) {
        this.progress = 0;
        
        for (var k in this.status) {
            if (k === 'total') continue;
            
            if (k === name) {
                this.status[k] = p;
            }
            
            this.progress += this.status[k];
        }
        
//        this.progress = ~~(this.progress / this.status['total']);
        this.progress = ~~(this.progress / this.status['total'] / this.stages + (this.currentStage - 1)* (100 / this.stages));

        // mark stage for redraw
        this['redraw'] = true;
    };
    
    /**
     * Activate stage. If autostart is switched on - assets loading will start
     */
    LoadingStage.prototype['activate'] = function() {
        TiledGameEngine['Stage'].prototype['activate'].call(this);

        this.activeStage = 1;
        
        if (this['screen']['layers'] < 3) {
            this['screen']['addLayer'](3 - this['screen']['layers']);
        }

        if (this.autostart) {
            this['start']();
        }

        this.fullRender = true;
    };
/*    
    LoadingStage.prototype.deactivate = function() {
        TGE.bus.unsubscribe('onViewportResize', this.sidResize);
        TGE.bus.unsubscribe('onViewportMove', this.sidMove);
        this.sidResize = this.sidMove = -1;

        // mark stage as up to date - no redraw needed
        this.redraw = false;
    };
*/
    /**
     * Update routine for the LoadingStage. It is not required more than twice per 
     * second to update progress information
     * @param {number}  dt      time difference from last update
     * @return {number}         Return time difference (in ms) to next update
     */
    LoadingStage.prototype['update'] = function(dt) {
        if (this.progress < 100) {
            // mark stage as invalid - redraw required
            this['redraw'] = true;

            return 500; // 2 FPS is enough for the loading stage
        } else {
            return 1000; // 1 FPS is enough for idle stage
        }
    };

    /**
     * Show progress information to user
     */
    LoadingStage.prototype['render'] = function() {
        // mark stage as up to date - no redraw needed
        this.redraw = false;

        if (!this['screen'] || !this['active']) return;

        // viewport array structure: [left, top, width, height, visible]
        var vp = this['screen']['viewport'],
            ctx;
        
        if (this.fullRender) {
            ctx = this['screen']['getLayer'](0);
            
            ctx.clearRect(0, 0, vp[2], vp[3]);

            ctx.save();
            ctx.translate(vp[2]/2 - 93, vp[3]/2-125);
            ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(186.25,0);ctx.lineTo(186.25,250);ctx.lineTo(0,250);ctx.closePath();
            ctx.clip();
            ctx.scale(1.25,1.25);
            ctx.lineCap = 'butt';
            ctx.lineJoin = 'miter';
            ctx.miterLimit = 4;
            ctx.save();
            ctx.restore();
            
            ctx.save();
            ctx.translate(0,200);
            ctx.scale(0.1,-0.1);
            
            // TOP
            ctx.save();
            ctx.fillStyle = "rgba(29, 57, 101, 1)";
            ctx.strokeStyle = "rgba(29, 57, 101, .75)";
            ctx.beginPath();

            ctx.moveTo(1089,1909);
            ctx.bezierCurveTo(1070,1882,1062,1879,1030,1882);
            ctx.lineTo(992,1885);ctx.lineTo(981,1835);
            ctx.bezierCurveTo(975,1808,968,1776,965,1765);ctx.bezierCurveTo(960,1748,967,1740,1011,1721);ctx.bezierCurveTo(1077,1691,1135,1633,1166,1567);
            ctx.bezierCurveTo(1201,1490,1199,1473,1148,1459);ctx.bezierCurveTo(1038,1430,872,1453,745,1517);ctx.bezierCurveTo(715,1532,675,1543,647,1543);
            ctx.lineTo(598,1545);ctx.lineTo(662,1485);
            ctx.bezierCurveTo(738,1413,841,1357,946,1330);ctx.bezierCurveTo(1076,1297,1320,1309,1340,1350);ctx.bezierCurveTo(1344,1358,1352,1378,1356,1394);
            ctx.bezierCurveTo(1363,1417,1373,1426,1400,1433);ctx.bezierCurveTo(1419,1438,1439,1445,1444,1450);ctx.bezierCurveTo(1449,1455,1447,1488,1440,1527);
            ctx.bezierCurveTo(1421,1638,1424,1633,1376,1627);ctx.bezierCurveTo(1353,1624,1330,1624,1324,1628);ctx.bezierCurveTo(1312,1636,1230,1756,1230,1765);
            ctx.bezierCurveTo(1230,1769,1239,1785,1251,1801);ctx.bezierCurveTo(1262,1817,1269,1837,1266,1845);ctx.bezierCurveTo(1260,1862,1142,1940,1123,1940);
            ctx.bezierCurveTo(1117,1940,1101,1926,1089,1909);

            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // LEFT
            ctx.save();
            ctx.fillStyle = "rgba(236, 143, 41, 1)";
            ctx.strokeStyle = "rgba(236, 143, 41, 0.75)";
            ctx.beginPath();
            ctx.moveTo(197,1677);
            ctx.bezierCurveTo(165,1649,140,1618,140,1610);ctx.bezierCurveTo(140,1602,149,1584,160,1570);ctx.bezierCurveTo(186,1537,185,1530,151,1462);
            ctx.bezierCurveTo(115,1390,99,1376,63,1384);ctx.bezierCurveTo(48,1387,30,1387,24,1382);ctx.bezierCurveTo(8,1372,-2,1216,12,1202);
            ctx.bezierCurveTo(19,1195,39,1190,57,1190);ctx.bezierCurveTo(94,1190,98,1184,129,1092);ctx.bezierCurveTo(152,1024,148,1000,110,980);
            ctx.bezierCurveTo(84,966,85,948,111,924);ctx.bezierCurveTo(131,906,132,906,143,925);ctx.bezierCurveTo(179,991,263,1029,333,1012);
            ctx.lineTo(373,1001);ctx.lineTo(337,1038);
            ctx.bezierCurveTo(282,1095,256,1161,256,1250);ctx.bezierCurveTo(255,1306,261,1337,277,1371);ctx.bezierCurveTo(300,1422,365,1500,385,1500);
            ctx.bezierCurveTo(403,1500,475,1419,498,1373);ctx.bezierCurveTo(542,1287,555,1222,554,1080);ctx.bezierCurveTo(553,996,547,917,537,871);
            ctx.bezierCurveTo(528,830,522,795,524,792);ctx.bezierCurveTo(527,790,542,812,559,842);ctx.bezierCurveTo(641,983,670,1185,631,1340);
            ctx.bezierCurveTo(603,1452,542,1576,479,1644);
            ctx.lineTo(429,1699);ctx.lineTo(389,1685);
            ctx.bezierCurveTo(345,1669,327,1674,298,1709);ctx.bezierCurveTo(288,1721,275,1730,268,1730);ctx.bezierCurveTo(261,1730,229,1706,197,1677);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            
            
            // RIGHT
            ctx.save();
            ctx.fillStyle = "rgba(78, 126, 40, 1)";
            ctx.strokeStyle = "rgba(78, 126, 40, 0.75)";
            ctx.beginPath();
            ctx.moveTo(1142,1269);ctx.bezierCurveTo(881,1225,661,1032,586,781);
            ctx.lineTo(570,726);ctx.lineTo(606,697);ctx.bezierCurveTo(640,668,641,666,635,615);
            ctx.lineTo(628,562);ctx.lineTo(711,535);ctx.bezierCurveTo(802,504,795,503,832,570);
            ctx.lineTo(850,601);ctx.lineTo(931,598);
            ctx.bezierCurveTo(1011,595,1014,594,1030,565);ctx.bezierCurveTo(1039,549,1054,534,1062,532);ctx.bezierCurveTo(1082,528,1220,597,1220,611);
            ctx.bezierCurveTo(1220,616,1213,635,1204,651);ctx.bezierCurveTo(1189,680,1190,683,1214,719);ctx.bezierCurveTo(1228,739,1255,771,1274,789);
            ctx.bezierCurveTo(1306,820,1311,822,1341,811);ctx.bezierCurveTo(1358,805,1377,800,1382,800);ctx.bezierCurveTo(1391,800,1425,870,1418,874);
            ctx.bezierCurveTo(1416,875,1395,885,1371,895);ctx.bezierCurveTo(1319,918,1281,971,1273,1029);ctx.bezierCurveTo(1269,1058,1263,1070,1251,1070);
            ctx.bezierCurveTo(1223,1070,1214,1057,1202,1000);ctx.bezierCurveTo(1170,858,1045,757,900,756);ctx.bezierCurveTo(864,756,818,762,797,769);
            ctx.bezierCurveTo(762,781,759,785,765,809);ctx.bezierCurveTo(777,858,827,955,867,1006);ctx.bezierCurveTo(944,1102,1087,1192,1247,1246);
            ctx.bezierCurveTo(1290,1260,1327,1274,1329,1276);ctx.bezierCurveTo(1337,1283,1196,1278,1142,1269);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            
            
            // T
            ctx.fillStyle = "rgba(29, 57, 101, 1)";
            ctx.strokeStyle = "rgba(29, 57, 101, 0.75)";
            ctx.beginPath();
            ctx.save();
  
            ctx.rect(20, 430, 310, -90);
            ctx.rect(120,340, 110, -240);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
            

            ctx.restore();
            
            // G
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(580,407);
            ctx.bezierCurveTo(530,374,509,331,509,265);ctx.bezierCurveTo(509,200,532,146,573,116);ctx.bezierCurveTo(614,86,749,86,800,116);
            ctx.bezierCurveTo(835,136,835,137,838,213);ctx.lineTo(841,290);ctx.lineTo(760,290);ctx.lineTo(680,290);ctx.lineTo(680,250);
            ctx.bezierCurveTo(680,211,681,210,715,210);ctx.bezierCurveTo(756,210,760,198,725,182);ctx.bezierCurveTo(688,165,663,167,640,190);
            ctx.bezierCurveTo(615,215,613,295,636,328);ctx.bezierCurveTo(654,354,696,357,721,334);ctx.bezierCurveTo(735,321,750,319,789,325);
            ctx.bezierCurveTo(851,333,854,348,806,396);ctx.bezierCurveTo(773,429,770,430,692,430);ctx.bezierCurveTo(627,430,607,426,580,407);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            
            // E
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(1050,265);ctx.lineTo(1050,100);ctx.lineTo(1190,100);ctx.lineTo(1330,100);ctx.lineTo(1330,140);ctx.lineTo(1330,180);
            ctx.lineTo(1240,180);ctx.bezierCurveTo(1151,180,1150,180,1150,205);ctx.bezierCurveTo(1150,230,1151,230,1230,230);ctx.lineTo(1310,230);
            ctx.lineTo(1310,270);ctx.lineTo(1310,310);ctx.lineTo(1230,310);ctx.bezierCurveTo(1157,310,1150,312,1150,330);
            ctx.bezierCurveTo(1150,348,1157,350,1235,350);ctx.lineTo(1320,350);ctx.lineTo(1320,390);ctx.lineTo(1320,430);ctx.lineTo(1185,430);
            ctx.lineTo(1050,430);ctx.lineTo(1050,265);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();

//            ctx.save();
            ctx.rect(360, 100, 100, 90);
            ctx.rect(890, 100, 100, 90);
            ctx.rect(1370, 100, 100, 90);

            ctx.fill();
            ctx.stroke();
//            ctx.restore();

            // ctx.save();
            // ctx.strokeStyle = "rgba(29, 57, 101, 1)";
// //            ctx.fillStyle = "rgba(29, 57, 101, 0.05)";
            // ctx.beginPath();
            // ctx.rect(0, 0, 1480, 1950);
            // ctx.closePath();
            // ctx.stroke();
  // //          ctx.fill();
            // ctx.restore();

            ctx.restore();
            ctx.restore();

            ctx = this['screen']['getLayer'](1);
            ctx.clearRect(vp[2]/2 - 90, vp[3]/2 + 100 + 30, 180, 20, 20);
            ctx.roundRect(vp[2]/2 - 90, vp[3]/2 + 100 + 30, 180, 20, 20).stroke();
        }
        
        ctx = this['screen']['getLayer'](2);
        ctx.clearRect(vp[2]/2 - 90, vp[3]/2 + 100 + 30, 180, 20, 20);

        // render progress bar
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
        ctx.lineWidth = 1;
        ctx.roundRect(vp[2]/2 - 90, vp[3]/2 + 100 + 30, 180 * this.progress / 100, 20, 20).fill();
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.fillText(this.progress + '% Loaded', vp[2]/2, vp[3]/2 + 100 + 40, 180-40);
        
        this.fullRender = false;
    };
   
    TGE['LoadingStage'] = LoadingStage;
})(window, TiledGameEngine);