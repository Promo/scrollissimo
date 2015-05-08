/**
 * Scrollissimo
 * Javascript plugin for scroll animation
 * @version 0.2.0
 * @author frux
 */

(function(win, doc, $){
    var Scrollissimo = {},
        lastScroll = 0,
        windowHeight,
        smoothQueues = [],
        queues = [],
        docHeight,
        $win = $(win),
        $doc = $(doc);

    /* requestAnimationFrame polyfill */
    (function(){
        var vendors = ['ms', 'moz', 'webkit', 'o'],
            max = vendors.length, x;

        if(!win.requestAnimationFrame){
            for(x = 0; x < max && !win.requestAnimationFrame; x += 1){
                win._rAF = win[vendors[x]+'RequestAnimationFrame'] && win[vendors[x]+'RequestAnimationFrame'];
            }
            !win._rAF && (win._rAF = function(callback){
                return win.setTimeout(function() { callback(); }, 1000 / 60);
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
        var start = Math.min(s, e), //6
            end = Math.max(s, e), //8
            from = f, //5
            to = t, //7
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
    }

    /**
     * Converts pixels in percents related to a document's height
     * @param px {Number|String} Value in pixels
     * @param documentHeight {Number|undefined} Document's height in pixels
     * @depends getDocumentHeight
     * @returns {Number} Value in percents
     */
    Scrollissimo._toPercents = function(px, documentHeight){
        documentHeight = documentHeight || docHeight || $doc.height();

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
    }

    /**
     * Configure render function for animating specified property
     * @param animation {Object} Animation's params
     * @param queue {S.Queue} Queue this animation will be added to
     * @returns {Object} Object containing Animation's params and render function
     */
    function makeTween(animation, queue){
        if((typeof animation === 'object') && animation.target){
            var p = {};

            //process animation params
            p.property = animation.property;
            p.from = animation.from || 0;
            p.to = animation.to || 0;
            p.prefix = animation.prefix || '';
            p.suffix = animation.suffix || '';
            p.duration = Scrollissimo._toPercents(animation.duration) || 0;

            p.target = (animation.target.jquery ? animation.target : $(animation.target));

            if(animation.start){
                if(animation.start.substr(0, 1) === '-' || animation.start.substr(0, 1) === '+'){
                    p.offset = animation.start;
                    p.start = queue.end;
                }else{
                    p.start = Scrollissimo._toPercents(animation.start);
                }
            }else{
                p.start = queue.end || 0;
            }
            console.log(p.start, p.offset, p.duration);

            p.offset = Scrollissimo._toPercents(animation.offset || p.offset) || 0;

            p.start += p.offset;

            p.queue = queue;

            return {
                animator: null,
                target: p.target,
                sourceParams: animation, //remember source params
                params : p, //processed params
                render: tweenRender.bind(this,
                    p.start,
                    p.duration,
                    (animation.func || function(progress){
                        this.css(p.property, p.prefix + (p.from + (p.to - p.from) * (progress)) + p.suffix);
                    }).bind(p.target)
                ),
                recalc: function(docHeight){
                    docHeight = docHeight || $(document).height();

                    this.params.duration = Scrollissimo._toPercents(this.sourceParams.duration || '', docHeight);
                    if(typeof (this.sourceParams.start) === 'undefined'){
                        this.params.start = Scrollissimo._toPercents(this.sourceParams.start, docHeight)
                    }
                },
                /**
                 * Get intersection of custom numbers range and animation duration range
                 * @param lastProgress {Number}
                 * @param progress {Number}
                 * @returns {{from: Number, to: Number}|undefined}
                 */
                getIntersection: function(lastProgress, progress){
                    return Scrollissimo._getIntersection(this.params.start, (this.params.start + this.params.duration), lastProgress, progress);
                }
            }
        }
    }

    /**
     * Call render function throwing normalized progress value
     * @param start
     * @param duration
     * @param render
     * @param progress
     */
    function tweenRender(start, duration, render, progress){
        var tweenProgress = (progress - start) / duration;

        tweenProgress <= 0 && (tweenProgress = 0);
        tweenProgress >= 1 && (tweenProgress = 1);
        render(tweenProgress);
    }

    /**
     * Scrollissimo Queue class
     */
    (function(S){
        /**
         * Animation queue class
         * @extends Array
         * @namespace Srollissimo
         * @constructor
         */
        S.Queue = function(maxSpeed){
            //total duration of this queue's animations
            this.start = 0;
            this.end = 0;

            !isNaN(maxSpeed) && (this.smoother = new S.Queue.Smoother(this, maxSpeed * 0.001)); //0.001 is gauge of speed
        };

        //queue actually is just extended array
        S.Queue.prototype = Array.prototype.slice.call(Array.prototype);

        /**
         * Add animation to the queue
         * @param animations {Object|Array} Animation object or array of animation objects
         * @returns {Scrollissimo.Queue|undefined}
         */
        S.Queue.prototype.add = function(animations){

            if(!(animations instanceof Array)){
                if(typeof animations === 'object'){
                    animations = [animations];
                }else return;
            }

            animations.forEach((function(animation){
                var tween = makeTween(animation, this);

                if(tween){
                    this.push(tween);
                    if(this.end < tween.params.start + tween.params.duration){
                        this.end = tween.params.start + tween.params.duration;
                    }
                }
            }).bind(this));

            this.start = (this[0] && this[0].params.start) || 0;

            //return for chaining
            return this;
        };

        /**
         * Get intersection of custom numbers range and queue duration range
         * @param lastProgress {Number}
         * @param progress {Number}
         * @returns {{from: Number, to: Number}|undefined}
         */
        S.Queue.prototype.getIntersection = function(lastProgress, progress){
            return S._getIntersection(this.start, this.end, lastProgress, progress);
        };

        /**
         * Queue smoother class
         * @param queue {S.Queue} Queue to smooth
         * @param maxSpeed {Number} Max percents of page's height animation can play on one requestAnimationFrame tick
         * @constructor
         */
        S.Queue.Smoother = function(queue, maxSpeed){
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
        S.Queue.Smoother.prototype.render = function(lastProgress, progress){
            this.queue.forEach(function(tween){
                var intersection = tween.getIntersection(lastProgress, progress);
                if(intersection){
                    tween.render(intersection.to);
                }
            });
        };

        /**
         * Smoother's tick function
         */
        S.Queue.Smoother.prototype.step = function(){
            var delta = this.animateTo - this.animateFrom;

            if(Math.abs(delta) > this.maxSpeed){
                this.render(this.animateFrom, this.animateFrom += this.maxSpeed * (delta > 0 ? 1 : -1));
                win._rAF(this.step.bind(this));
            }else{
                this.render(this.animateFrom, this.animateTo);
                this.status = 'idle';
                this.animateFrom = this.animateTo;
            }
        };

        /**
         * Smooth jump from last progress value to current one
         * @param from {Number} Last progress value
         * @param to {Number} Current progress value
         */
        S.Queue.Smoother.prototype.smooth = function(from, to){
            var intersection = this.queue.getIntersection(from, to);

            //Check if current scrolling intersects this queue
            if(intersection){
                //set finish value
                this.animateTo = intersection.to;
                //if Smoother is not ran run it
                if(this.status === 'idle'){
                    //set playing status
                    this.status = 'busy';
                    //tick
                    win._rAF(this.step.bind(this));
                }
                this.id = win._rAF(this.step.bind(this));
                return this;
            }
        };
    })(Scrollissimo);

    /**
     * Render all animation queues
     * @private
     */
    Scrollissimo._render = (function(progress){

        //for each animation's queues
        queues.forEach(function(queue){

            //and for each animation of each queue
            queue.forEach(function(tween){

                //render current state related to a current scroll progress
                tween.render(progress);
            });
        });

        smoothQueues.forEach(function(queue){
            queue.smoother.smooth(Scrollissimo.lastProgress, progress);
        });

        Scrollissimo.lastProgress= progress;
    }).bind(Scrollissimo);

    Scrollissimo.lastProgress = 0;

    Scrollissimo._catch = function(customScrollTop){
        var scrollTop = ( isNaN(customScrollTop) ? $doc.scrollTop() : customScrollTop), //calculate current scroll
            progress = scrollTop / (docHeight - windowHeight); //calculate current scroll progress

        this._render(progress);

        //remember current progress value
        lastScroll = scrollTop;
    };

    /**
     * Create new queue and add animation(s) to the beginning
     * @param animations {Object|Array} Target of animation or array of animations
     * return {S.Queue}
     */
    Scrollissimo.add = (function(animations, maxSpeed){
        var newQueue;

        //if specified one animation instead of array wrp it by array
        animations = animations || [];

        //create new Queue and add animtion to the beginning
        newQueue = new this.Queue(maxSpeed).add(animations);

        //add new queue to all queues
        (maxSpeed ? smoothQueues : queues).push(newQueue);

        return newQueue;
    }).bind(Scrollissimo);

    Scrollissimo.knock = function(customScrollTop){
        this._catch(customScrollTop);
        isNaN(customScrollTop) && setTimeout(this._catch.bind(this), 100);
    };

    //every time window has been resized
    $win.resize(function(){

        //calculate new window height
        windowHeight = $win.height();

        //calculate new document height
        docHeight = $doc.height();

        //run recalculate method of each tween
        queues.forEach(function(queue){
            queue.forEach(function(tween){
                tween.recalc(docHeight);
            });
        });

        //...for smooth queues too
        smoothQueues.forEach(function(queue){
            queue.forEach(function(tween){
                tween.recalc(docHeight);
            });
        });
    });

    Scrollissimo.isTouchMode = ('ontouchstart' in win);

    $doc.ready(function(){
        docHeight = $doc.height();
        windowHeight = $win.height();
    });

    win.Scrollissimo = Scrollissimo;
})(window, document, jQuery);