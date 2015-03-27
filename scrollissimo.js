/* requestAnimationFrame polyfill */
(function(global){
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !global.requestAnimationFrame; ++x){
        global.requestAnimationFrame = global[vendors[x]+'RequestAnimationFrame'];
        global.cancelAnimationFrame = global[vendors[x]+'CancelAnimationFrame']
        || global[vendors[x]+'CancelRequestAnimationFrame'];
    }
    if(!global.requestAnimationFrame){
        global.requestAnimationFrame = function(callback){
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = global.setTimeout(function(){
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if (!global.cancelAnimationFrame){
        global.cancelAnimationFrame = function(id){
            clearTimeout(id);
        };
    }
}(this));


/**
 * Scrollissimo initialization
 * @param callback {Function} Initialization end's callback
 * @returns {Scrollissimo} Scrollissimo object
 * @Singletone
 */
function Scrollissimo(callback){
    var S = {}, //S is for Scrollissimo
        lastScroll = 0, //to check if document was scrolled
        docHeight = getDocumentHeight() || 0, //document height
        windowHeight = Number(window.innerHeight) || window.innerHeight, //window height
        smoothQueues = [], //all animations with smooth effect
        queues = [], //all other animations queues
        getScrollTop,
        setCSSProperty;

    /**
     * addEventListener polyfill
     * @param obj {Object} Event target
     * @param eventName {String} Event name
     * @param fn {Function} Event handler
     */
    function addEvent(obj, eventName, fn){
        if(obj.addEventListener){
            obj.addEventListener(eventName, fn, false);
        }else{
            obj.attachEvent("on" + eventName, obj[eventName + fn]);
        }
    }

    /**
     * Calculate document's height
     * @returns {Number} Height of document
     */
    function getDocumentHeight(){
        var documentElement = document.documentElement,
            documentBody = document.body;
        return Math.max(
            documentBody.scrollHeight, documentElement.scrollHeight,
            documentBody.offsetHeight, documentElement.offsetHeight,
            documentBody.clientHeight, documentElement.clientHeight
        );
    }

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
    if(window.jQuery){
        setCSSProperty = function(target, property, value){
            $(target).css(property, value);
        }

        //else use standard element.style.setProperty
    }else{
        setCSSProperty = function(target, property, value){
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
        documentHeight = documentHeight || docHeight;

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
            return parseInt(px) / getDocumentHeight();

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
                render: animation.function || function(progress){

                    //calculate local progress for current animation
                    var tweenProgress = (progress - this.params.start) / this.params.duration;

                    //if animation is playing
                    if (tweenProgress > 0 && tweenProgress < 1){
                        setCSSProperty(animation.target, this.params.property, this.params.prefix + (this.params.from + (this.params.to - this.params.from) * (tweenProgress)) + this.params.suffix);

                        //if animation is already finished
                    }else if (tweenProgress >= 1){
                        setCSSProperty(animation.target, this.params.property, this.params.prefix + this.params.to + this.params.suffix);

                        //if animation is not started yet
                    }else if (tweenProgress <= 0){
                        setCSSProperty(animation.target, this.params.property, this.params.prefix + this.params.from + this.params.suffix);
                    }
                },
                recalc: function(docHeight){
                    docHeight = docHeight || getDocumentHeight();

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
     * Animation queue class
     * @extends Array
     * @namespace S
     * @constructor
     */
    S.Queue = function(maxSpeed){
        //total duration of  this queue's animations
        this.start = 0;
        this.end = 0;

        !isNaN(maxSpeed) && (this.smoother = new S.Queue.Smoother(this, maxSpeed));
    };

    //queue actually is extended array
    S.Queue.prototype = Array.prototype.slice.call(Array.prototype);

    /**
     * Add animation to the queue
     * @param animations {Object|Array} Animation object or array of animation objects
     * @returns {S.Queue|undefined}
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
            requestAnimationFrame(this.step.bind(this));
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
                requestAnimationFrame(this.step.bind(this));
            }
            this.id = requestAnimationFrame(this.step.bind(this));
            return this;
        };

        /**
         * Smoothly run each tween
         */
        S.Queue.Smoother.smooth = (function(progress){
            var self = this;
            smoothQueues.forEach(function(queue){
                queue.forEach(function(tween){
                    var intersection = tween.getIntersection.call(tween, lastProgress, progress);

                    if(intersection && (intersection.from !== intersection.to)){
                        if((!tween.animator && (tween.animator = new self.Animator(tween))) || tween.animator.status !== 'playing'){
                            tween.animator.animateTo = intersection.to;
                            tween.animator.run();
                        }else{
                            tween.animator.animateTo = intersection.to;
                        }
                    }
                });
            });

            lastProgress = progress;
        }).bind(S.Smoother);
    };

    /**
     * Create new queue and add animation(s) to the beginning
     * @param animations {Object|Array} Target of animation or array of animations
     * return {S.Queue}
     */
    S.add = (function(animations, maxSpeed){
        var newQueue;

        //if specified one animation instead of array wrp it by array
        animations = animations || [];

        //create new Queue and add animtion to the beginning
        newQueue = new this.Queue(maxSpeed).add(animations);

        //add new queue to all queues
        (maxSpeed ? smoothQueues : queues).push(newQueue);

        return newQueue;
    }).bind(S);

    S.render = (function(progress){
        //for each animation's queues
        queues.forEach(function(queue){

            //and for each animation of each queue
            queue.forEach(function(tween){

                //render current state related to a current scroll progress
                tween.render(progress);
            });
        });

        smoothQueues.forEach(function(queue){
            queue.smoother.smooth(S.lastProgress, progress);
        });

        S.lastProgress= progress;
    }).bind(S);

    S.lastProgress = 0;

    //every time window will be resized
    addEvent(window, 'resize', function(){

        //calculate new window height
        windowHeight = Number(window.innerHeight) || window.innerHeight;

        //calculate new document height
        docHeight = getDocumentHeight();

        //run recalculate method of each tween
        queues.forEach(function(queue){
            queue.forEach(function(tween){
                tween.recalc(docHeight);
                console.log(tween);
            });
        });
        //...for smooth queues too
        smoothQueues.forEach(function(queue){
            queue.forEach(function(tween){
                tween.recalc(docHeight);
                console.log(tween);
            });
        });
    });

    addEvent(window, 'scroll', function(){
        scrollCatcher.call(S);
        setTimeout(function(){ scrollCatcher.call(S) }, 100);
    });

    function scrollCatcher(){

        var scrollTop = getScrollTop(), //calculate current scroll
            progress = scrollTop / (docHeight - windowHeight); //calculate current scroll progress

        //if it's not a fake calling
        if(scrollTop !== lastScroll){
            //render animations
            this.render(progress);
        }

        //remember current progress value
        lastScroll = scrollTop;
    }

    (callback || function(){}).call(S);
    return S;
}