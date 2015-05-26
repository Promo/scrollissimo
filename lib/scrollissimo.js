/**
 * Scrollissimo
 * Javascript plugin for smooth scroll-controlled animations
 * @version 0.3.1
 * @author frux <qdinov@yandex.ru>
 * @url https://github.com/Promo/scrollissimo
 */
(function(doc, win){
    var Queue,
        Scrollissimo = {},
        lastScroll = 0,
        windowHeight,
        docHeight,
        smoothQueues = [],
        queues = [];

    /**
     * Get scrollTop
     * @returns {Number} page's scrollTop
     */
    function getScrollTop(){
        if(typeof pageYOffset !== 'undefined'){
            //most browsers except IE before 9
            return pageYOffset;
        }else{
            var B = doc.body; //IE 'quirks'
            var D = doc.documentElement; //IE with doctype
            D = (D.clientHeight) ? D : B;
            return D.scrollTop;
        }
    }

    /**
     * Get document's height
     * @returns {Number} document's height
     */
    function getDocHeight(){
        var B = doc.body,
            D = doc.documentElement;
        return Math.max(
            B.scrollHeight, D.scrollHeight,
            B.offsetHeight, D.offsetHeight,
            B.clientHeight, D.clientHeight
        );
    }

    /**
     * Get window height
     * @returns {Number} window height
     */
    function getWindowHeight(){
        return isNaN(win.innerHeight) ? win.clientHeight : win.innerHeight;
    }

    /* requestAnimationFrame polyfill */
    (function(){
        var vendors = ['ms', 'moz', 'webkit', 'o'],
            max = vendors.length, x;

        if(!win.requestAnimationFrame){
            for(x = 0; x < max && !win.requestAnimationFrame; x += 1){
                win._rAF = win[vendors[x]+'RequestAnimationFrame'] && win[vendors[x]+'RequestAnimationFrame'];
            }
            !win._rAF && (win._rAF = function(callback){
                return setTimeout(function() { callback(); }, 1000 / 60);
            });
        }else{
            win._rAF = win.requestAnimationFrame;
        }
    })();

    /**
     * Get intersection of custom numbers ranges
     * @param f {Number}
     * @param t {Number}
     * @param s {Number}
     * @param e {Number}
     * @returns {{from: Number, to: Number}|undefined}
     */
    Scrollissimo._getIntersection = function(f, t, s, e){
        var start = Math.min(s, e),
            end = Math.max(s, e),
            from = f,
            to = t,
            n1,
            n2;

        if(start <= from && end >= from){
            n1 = from;
            n2 = Math.min(end, to);
        }else if(end >= to && start <= to){
            n1 = Math.max(start, from);
            n2 = Math.min(end, to);
        }else if(start >= from && end <= to){
            n1 = start;
            n2 = end;
        }else return;

        return (s < e ? {from: n1, to: n2} : {from: n2, to: n1});
    };

    /**
     * Converts pixels in percents related to a document's height
     * @param px {Number|String} Value in pixels
     * @param documentHeight {Number|undefined} Document's height in pixels
     * @depends getDocumentHeight
     * @returns {Number} Value in percents
     */
    Scrollissimo._toPercents = function(px, documentHeight){
        documentHeight = documentHeight || docHeight || getDocHeight();

        //if is string
        if(typeof px === 'string'){
            //if in percents
            if(px.substr(-1, 1) === '%'){
                return parseFloat(px) / 100;
                //if in pixels
            }else if(px.substr(-2, 2) === 'px'){
                return (parseFloat(px) / documentHeight);
            }
            //otherwise parse as percents
            return parseFloat(px) / documentHeight;

            //else if it isn't even a number
        }else if(!isNaN(px)){
            return (px / documentHeight);
        }
    };

    /**
     * Queue class
     * @param timeline {TimelineLite|TimelineMax} Greensock timeline
     * @param params {Object} Queue params
     * @param maxSpeed {Number|undefined} Max speed
     * @private
     * @constructor
     */
    Queue = function(timeline, start, maxSpeed){
        if(timeline){
            this.params = {};

            this.params.start = Scrollissimo._toPercents(start || 0);
            this.params.duration = Scrollissimo._toPercents(timeline.duration() || 0);

            this.timeline = timeline;

            if(!isNaN(maxSpeed)){
                this._maxSpeed = maxSpeed * 0.001;
                this._smoother = new Queue.Smoother(this, this._maxSpeed);
            }
        }
    };

    /**
     * Get intersection of queue and scroll
     * @param lastProgress {Number}
     * @param progress {Number}
     * @returns {{from: Number, to: Number}|undefined}
     */
    Queue.prototype.getIntersection = function(lastProgress, progress){
        return Scrollissimo._getIntersection(this.params.start, this.params.start + this.params.duration, lastProgress, progress);
    };

    /**
     * Render specified progress of animation
     * @param progress {Number} Progress (0..1)
     * @returns {Queue}
     */
    Queue.prototype.render = function(progress){
        var tweenProgress = Math.round((progress - this.params.start) / this.params.duration * 1000) / 1000,
            timelineProgress = this.timeline.duration() * tweenProgress;
        this.timeline.seek(timelineProgress);
        return this;
    };

    /**
     * Queue smoother class
     * @param queue {S.Queue} Queue to smooth
     * @param maxSpeed {Number} Max percents of page's height animation can play on one requestAnimationFrame tick
     * @constructor
     */
    Queue.Smoother = function(queue, maxSpeed){
        this.status = 'idle';
        this.animateFrom = 0;
        this.animateTo = 0;
        this.maxSpeed = +maxSpeed;
        this.queue = queue;
    };

    /**
     * Render specified progress of current queue's animations
     * @param lastProgress {Number} Last progress value
     * @param progress {Number} Current progress value
     */
    Queue.Smoother.prototype.smooth = function(lastProgress, progress){
        var intersection = this.queue.getIntersection(lastProgress, progress);

        //Check if current scrolling intersects this queue
        if(intersection){
            //set finish value
            this.animateTo = intersection.to;
            //if Smoother is not ran run it
            if(this.status === 'idle'){
                //set playing status
                this.status = 'busy';
                //tick
                this.id = win._rAF(this.step.bind(this));
            }
            return this;
        }
    };

    /**
     * Smoother's tick function
     */
    Queue.Smoother.prototype.step = function(){
        var delta = this.animateTo - this.animateFrom;

        if(Math.abs(delta) > this.maxSpeed){
            this.queue.render(this.animateFrom += this.maxSpeed * (delta > 0 ? 1 : -1));
            win._rAF(this.step.bind(this));
        }else{
            this.queue.render(this.animateTo);
            this.status = 'idle';
            this.animateFrom = this.animateTo;
        }
    };

    /**
     * Add timeline queue
     * @param timeline {TimelineLite|TimelineMax} Greensock timeline
     * @param params {Object} Queue params
     * @param maxSpeed {Number|undefined} Max speed
     * @returns {Scrollissimo}
     */
    Scrollissimo.add = function(timeline, start, maxSpeed){
        if(!isNaN(maxSpeed)){
            smoothQueues.push(new Queue(timeline, start, maxSpeed));
        }else{
            queues.push(new Queue(timeline, start, maxSpeed));
        }
    };


    /**
     * Render all animation queues
     * @private
     */
    Scrollissimo._render = (function(progress){
        //for each animation's queues
        queues.forEach(function(queue){
            queue.render(progress);
        });

        smoothQueues.forEach(function(queue){
            queue._smoother.smooth(Scrollissimo._lastProgress, progress);
        });

        Scrollissimo._lastProgress = progress;
    }).bind(Scrollissimo);


    Scrollissimo._lastProgress = 0;

    Scrollissimo._catch = function(customScrollTop){
        var scrollTop = ( isNaN(customScrollTop) ? getScrollTop() : customScrollTop), //calculate current scroll
            progress = scrollTop / (docHeight - windowHeight); //calculate current scroll progress

        this._render(progress);

        //remember current progress value
        lastScroll = scrollTop;
    };

    /**
     * Trigger Scrollissimo
     * @param customScrollTop {Number|undefined} Custom scrollTop value
     * @returns {Scrollissimo}
     */
    Scrollissimo.knock = function(customScrollTop){
        this._catch(customScrollTop);
        isNaN(customScrollTop) && setTimeout(this._catch.bind(this), 100);
    };


    Scrollissimo.isTouchMode = ('ontouchstart' in win);

    win.addEventListener('load', function(){
        docHeight = getDocHeight();
        windowHeight = getWindowHeight();
    });

    if((module||{}).exports){
        module.exports = Scrollissimo;
    }else{
        win.Scrollissimo = Scrollissimo;
    }

})(document, window);