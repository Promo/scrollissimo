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
        global.requestAnimationFrame = function(callback, element){
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
        documentElement = document.documentElement,
        documentBody = document.body,
        getScrollTop,
        setCSSProperty;

    /**
     * Calculate document's height
     * @returns {Number} Height of document
     */
    function getDocumentHeight(){
        return Math.max(
            documentBody.scrollHeight, documentElement.scrollHeight,
            documentBody.offsetHeight, documentElement.offsetHeight,
            documentBody.clientHeight, documentElement.clientHeight
        );
    }

    /**
     * Calculate current scrolling value for a bottom edge of window
     * @returns {Number} Length of scrolled area in pixels
     */
    function getScrollTop(){
        if('pageYOffset' in window){
            getScrollTop = function(){
                return (window.pageYOffset || 0) - (document.clientTop || 0);
            };
        }else{
            getScrollTop = function(){
                return (document.scrollTop || 0) - (document.clientTop || 0);
            };
        }
        return getScrollTop();
    }

    if(window.jQuery){
        setCSSProperty = function(target, property, value){
            $(target).css(property, value);
        }
    }else{
        setCSSProperty = function(target, property, value){
            target.style.setProperty(property, value);
        }
    }


    /**
     * Converts pixels in percents related to a document's height
     * @param px {Number|String} Value in pixels
     * @depends getDocumentHeight
     * @returns {Number} Value in percents
     */
    function toPercents(px, documentHeight){
        documentHeight = documentHeight || docHeight;

        //if
        if(typeof px === 'string'){
            if(px.substr(-1, 1) === '%'){
                return parseInt(px) / 100;
            }else if(px.substr(-2, 2) === 'px'){
                return (parseInt(px) / documentHeight);
            }
            return parseInt(px) / getDocumentHeight();
        }else if(!isNaN(px)){
            return (px / documentHeight);
        }
    }

    /**
     * Configure render function for animating specified property
     * @param target {HTMLElement} Target of animation
     * @param params {Object} Object containing animation params
     * @param queue {Queue} Queue this animation will be added to
     * @returns {Object} Object containing Animation's params and render function
     */
    function makeTween(target, params, queue){
        if(typeof params === 'object'){
            var p = {};

            //process animation params
            p.property = params.property;
            p.from = params.from || 0;
            p.to = params.to || 0;
            p.prefix = params.prefix || '';
            p.suffix = params.suffix || '';
            p.duration = toPercents(params.duration) || 0;
            p.maxSpeed = parseFloat(params.maxSpeed);
            //if start is not specified set it to the end of queue
            if(typeof (p.start = toPercents(params.start)) === 'undefined'){
                p.start = queue.endTime;
                queue.endTime += p.duration;
            }
            p.queue = queue;

            return {
                animator: null,
                sourceParams: params, //remember source params
                params : p, //processed params
                render: function(progress){

                    //calculate local progress for current animation
                    var tweenProgress = (progress - this.params.start) / this.params.duration;

                    //if animation is playing
                    if (tweenProgress > 0 && tweenProgress < 1){
                        setCSSProperty(target, this.params.property, this.params.prefix + (this.params.from + (this.params.to - this.params.from) * (tweenProgress)) + this.params.suffix);

                        //if animation is already finished
                    }else if (tweenProgress >= 1){
                        setCSSProperty(target, this.params.property, this.params.prefix + this.params.to + this.params.suffix);

                        //if animation is not started yet
                    }else if (tweenProgress <= 0){
                        setCSSProperty(target, this.params.property, this.params.prefix + this.params.from + this.params.suffix);
                    }
                },
                recalc: function(docHeight){
                    var p = {};

                    docHeight = docHeight || getDocumentHeight();

                    p.from = this.sourceParams.from || 0;
                    p.to = this.sourceParams.to || 0;
                    p.prefix = this.sourceParams.prefix || '';
                    p.suffix = this.sourceParams.suffix || '';
                    p.duration = toPercents(this.sourceParams.duration || '', docHeight);
                    if(typeof (p.start = toPercents(this.sourceParams.start, docHeight)) === 'undefined'){
                        p.start = queue.endTime;
                        queue.endTime += p.duration;
                    }

                    this.params = p;
                },
                /**
                 * Get intersection of custom numbers range and animation duration range
                 * @param lastProgress {Number}
                 * @param progress {Number}
                 * @returns {{from: Number, to: Number}}
                 */
                getIntersection: function(lastProgress, progress){
                    var start = Math.min(lastProgress, progress),
                        end = Math.max(lastProgress, progress),
                        from = this.params.start,
                        to = this.params.start + this.params.duration,
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

                    return (lastProgress < progress ? {from: n1, to: n2} : {from: n2, to: n1});
                }
            }
        }
    }

    /**
     * Animation queue class
     * @extends Array
     * @namespace Scrollissimo
     * @constructor
     */
    S.Queue = function(){
        //total duration of  this queue's animations
        this.endTime = 0;
    };

    //queue actually is extended array
    S.Queue.prototype = Array.prototype.slice.call(Array.prototype);

    /**
     * Add animation to the queue
     * @param target {HTMLElement} Target of animation
     * @param params {Object} Object containing animation params
     * @returns {Scrollissimo.Queue|undefined}
     */
    S.Queue.prototype.then = function(target, params){
        var tween = makeTween(target, params, this);

        //if tween made successfully
        if(typeof tween === 'object'){
            this.push(tween);
        }

        //return for chaining
        return this;
    };

    /**
     * Smooth effect for Scrollissimo
     * @namespace Scrollissimo
     */
    (function(S){
        var lastProgress = 0;

        /**
         * Render smooth scroll animation
         * @param progress {Number} Current progress
         * @param scrollTop {Number} scrollTop value
         */
        S.Smoother = function(progress){
            S.Smoother.smooth(progress);
        };

        /**
         * Animation controlling class
         * @param tween {Object} Tween object
         * @constructor
         */
        S.Smoother.Animator = function(tween){
            this.status = 'stopped';
            this.animateFrom = 0;
            this.animateTo = 0;
            this.tween = tween;
        };

        /**
         * Smoothing step function
         */
        S.Smoother.Animator.prototype.step = function(){
            var delta = this.animateTo - this.animateFrom,
                absDelta = Math.abs(delta),
                maxSpeed = this.tween.params.maxSpeed;

            if(absDelta > maxSpeed){
                delta = (delta > 0 ? maxSpeed : -maxSpeed);
                absDelta = Math.abs(delta);
            }

            this.animateFrom += delta;

            this.tween.render.call(this.tween, this.animateFrom);

            if(absDelta > 0){
                requestAnimationFrame(this.step.bind(this));
            }else{
                this.status = 'stopped';
            }
        };

        /**
         * Run smoothing
         * @returns {S.Smoother.Animator}
         */
        S.Smoother.Animator.prototype.run = function(){
            this.status = 'playing';
            if(this.id){
                cancelAnimationFrame(this.id);
            }
            this.id = requestAnimationFrame(this.step.bind(this));
            return this;
        };

        /**
         * Smoothly run each tween
         */
        S.Smoother.smooth = (function(progress){
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
    })(S);

    /**
     * Create new queue and add animation to the beginning
     * @param target {HTMLElement} Target of animation
     * @param params {Object} Object containing animation's params
     * @param smooth {Boolean} Add smooth effect to this queue's animations
     * return {Scrollissimo.Queue}
     */
    S.add = (function(target, params){
        var newQueue;

        //create new Queue and add animtion to the beginning
        newQueue = new this.Queue().then(target, params);

        //add new queue to all queues
        (params.maxSpeed ? smoothQueues : queues).push(newQueue);

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
    }).bind(S);

    window.addEventListener('scroll', (function(){
        //TODO: remove this shit
    }).bind(S));


    function scrollCatcher(){
        var scrollTop = getScrollTop(), //calculate current scroll
            progress = scrollTop / (docHeight - windowHeight); //calculate current scroll progress

        if(scrollTop !== lastScroll){
            //render animations with smooth effect
            this.Smoother(progress);

            //render all other animations
            this.render(progress);
        }
        lastScroll = scrollTop;
        requestAnimationFrame(scrollCatcher.bind(this));
    }

    requestAnimationFrame(scrollCatcher.bind(S));

    (callback || function(){}).call(S);
    return S;
}