/**
 * Scrollissimo
 * Javascript plugin for scroll animation
 * @author frux
 */

(function(global){
    var Scrollissimo = {},
        lastScroll = 0,
        windowHeight = Scrollissimo._getWinHeight,
        smoothQueues = [],
        queues = [],
        docHeight,
        getScrollTop,
        setCSS;

    /* requestAnimationFrame polyfill */
    (function(){
        var lastTime = 0,
            vendors = ['ms', 'moz', 'webkit', 'o'],
            max = vendors.length, x,
            // Feature check for performance (high-resolution timers)
            hasPerformance = !!(global.performance && global.performance.now);


        if(!global.requestAnimationFrame){
            for(x = 0; x < max && !global.requestAnimationFrame; x += 1){
                console.log(x, max);
                Scrollissimo._requestAnimationFrame = global[vendors[x]+'RequestAnimationFrame'] && global[vendors[x]+'RequestAnimationFrame'].bind(global);
            }
            if(!Scrollissimo._requestAnimationFrame){
                Scrollissimo._requestAnimationFrame = (function(callback){
                    var currTime = new Date().getTime();
                    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                    var id = global.setTimeout(function() { callback(currTime + timeToCall); },
                        timeToCall);
                    lastTime = currTime + timeToCall;
                    return id;
                }).bind(global);
            }
        }else{
            Scrollissimo._requestAnimationFrame = global.requestAnimationFrame.bind(global);
        }

        // Add new wrapper for browsers that don't have performance
        if(!hasPerformance){
            // Store reference to existing rAF and initial startTime
            var rAF = Scrollissimo._requestAnimationFrame,
                startTime = +new Date;

            // Override window rAF to include wrapped callback
            Scrollissimo._requestAnimationFrame = function(callback, element){
                // Wrap the given callback to pass in performance timestamp
                var wrapped = function(timestamp){
                    // Get performance-style timestamp
                    var performanceTimestamp = (timestamp < 1e12) ? timestamp : timestamp - startTime;

                    return callback(performanceTimestamp);
                };

                // Call original rAF with wrapped callback
                rAF(wrapped, element);
            }
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
    function getIntersection(f, t, s, e){
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
            n2 = start;
        }else return;

        return (s < e ? {from: n1, to: n2} : {from: n2, to: n1});
    }

    /**
     * addEventListener and attachEvent wrapper
     * @param obj {Object} Event target
     * @param event {String} Event name
     * @param fn {Function} Event handler
     * @private
     */
    Scrollissimo._on = function(obj, event, fn){
        if(obj.addEventListener){
            obj.addEventListener(event, fn, false);
        }else{
            obj.attachEvent("on" + event, fn);
        }
    };

    /**
     * Calculate document's height
     * @returns {Number} Height of document
     */
    Scrollissimo._getDocHeight = function(){
        var documentElement = document.documentElement || {},
            documentBody = document.body || {};
        return Math.max(
            documentBody.scrollHeight, documentElement.scrollHeight,
            documentBody.offsetHeight, documentElement.offsetHeight,
            documentBody.clientHeight, documentElement.clientHeight
        );
    };

    /**
     * Calculate window's height
     * @returns {Number} Height of window
     */
    Scrollissimo._getWinHeight = function(){
        return Number(global.innerHeight) || Number(global.clientHeight);
    };

    /**
     * Calculate current scrolling value for a bottom edge of window
     * @returns {Number} Length of scrolled area in pixels
     */
    if('pageYOffset' in window){
        getScrollTop = function(){
            return (window.pageYOffset || 0) - (document.clientTop || 0);
        };
    }else{
        getScrollTop = function(){
            return (document.scrollTop || 0) - (document.clientTop || 0);
        };
    }

    //if jQuery included use $.fn.css to set properties
    if(global.jQuery){
        setCSS = function(target, property, value){
            $(target).css(property, value);
        }

        //else use standard element.style.setProperty
    }else{
        setCSS = function(target, property, value){
            target.style.setProperty(property, value);
        }
    }

    /**
     * Converts pixels in percents related to a document's height
     * @param px {Number|String} Value in pixels
     * * @param documentHeight {Number|undefined} Document's height in pixels
     * @depends getDocumentHeight
     * @returns {Number} Value in percents
     */
    function toPercents(px, documentHeight){
        documentHeight = documentHeight || docHeight || Scrollissimo._getDocHeight();

        //if is string
        if(typeof px === 'string'){
            //if in percents
            if(px.substr(-1, 1) === '%'){
                return parseInt(px) / 100;
                //if in pixels
            }else if(px.substr(-2, 2) === 'px'){
                return (parseInt(px) / documentHeight);
            }
            //otherwise parse as percents
            return parseInt(px) / documentHeight;

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
        if(typeof animation === 'object'){
            var p = {};

            //process animation params
            p.property = animation.property;
            p.from = animation.from || 0;
            p.to = animation.to || 0;
            p.prefix = animation.prefix || '';
            p.suffix = animation.suffix || '';
            p.duration = toPercents(animation.duration) || 0;

            if(animation.target.jquery){
                if(animation.target.length > 1){
                    p.target = animation.target.get();
                }else{
                    p.target = animation.target.get(0);
                }
            }else{
                p.target = animation.target;
            }

            //if start is not specified set it to the end of queue
            if(typeof (p.start = toPercents(animation.start)) === 'undefined'){
                p.start = queue.end;
            }

            p.queue = queue;

            return {
                animator: null,
                target: animation.target,
                sourceParams: animation, //remember source params
                params : p, //processed params
                render: tweenRender.bind(this,
                    p.start,
                    p.duration,
                    (animation.func || function(progress){
                        if(this.length){
                            this.forEach(function(target){
                                setCSS(target, p.property, p.prefix + (p.from + (p.to - p.from) * (progress)) + p.suffix);
                            });
                        }else{
                            setCSS(this, p.property, p.prefix + (p.from + (p.to - p.from) * (progress)) + p.suffix);
                        }
                    }).bind(p.target)
                ),
                recalc: function(docHeight){
                    docHeight = docHeight || Scrollissimo._getDocHeight();

                    this.params.duration = toPercents(this.sourceParams.duration || '', docHeight);
                    if(typeof (this.sourceParams.start) === 'undefined'){
                        this.params.start = toPercents(this.sourceParams.start, docHeight)
                    }
                },
                /**
                 * Get intersection of custom numbers range and animation duration range
                 * @param lastProgress {Number}
                 * @param progress {Number}
                 * @returns {{from: Number, to: Number}|undefined}
                 */
                getIntersection: function(lastProgress, progress){
                    return getIntersection(this.params.start, (this.params.start + this.params.duration), lastProgress, progress);
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

        if (tweenProgress > 0 && tweenProgress < 1){
            render(tweenProgress);
        }else if (tweenProgress >= 1){
            render(1);
        }else if (tweenProgress <= 0){
            render(0);
        }
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
            //total duration of  this queue's animations
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

            this.sort(function(a, b){
                return a.params.duration - b.params.duration;
            });

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
            return getIntersection(this.start, this.end, lastProgress, progress);
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
                S._requestAnimationFrame(this.step.bind(this));
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
                    S._requestAnimationFrame(this.step.bind(this));
                }
                this.id = S._requestAnimationFrame(this.step.bind(this));
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
        var scrollTop = ( isNaN(customScrollTop) ? getScrollTop() : customScrollTop), //calculate current scroll
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
    Scrollissimo._on(window, 'resize', function(){

        //calculate new window height
        windowHeight = Scrollissimo._getWinHeight();

        //calculate new document height
        docHeight = Scrollissimo._getDocHeight();

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

    Scrollissimo.isTouchMode = ('ontouchstart' in window);

    Scrollissimo._on(window, 'load', function(){
        docHeight = Scrollissimo._getDocHeight();
        windowHeight = Scrollissimo._getWinHeight();
    });

    global.Scrollissimo = Scrollissimo;
})(this);