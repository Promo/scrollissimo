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
        getScrollTop,
        setCSSProperty;

    function addEvent(obj, type, fn){
        if(obj.addEventListener){
            obj.addEventListener(type, fn, false);
        }else{
            obj.attachEvent("on" + type, obj[type + fn]);
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
     * Smoother
     */
    (function(S){
        var lastProgress = 0;

        S.Smoother = {
            smoothFrom: 0,
            smoothTo: 0,
            maxSpeed: 0.005,
            status: 'idle',
            makeSmoothy: function(progress){
                if(this.status === 'idle'){
                    this.run(progress);
                }else{
                    this.smoothTo = progress;
                }
            },

            run: function(progress){
                this.status = 'playing';
                this.smoothTo = progress;
                requestAnimationFrame(this.step.bind(this));
            },

            render: function(progress){
                smoothQueues.forEach(function(queue){
                    var max = queue.length, i,
                        tween,
                        intersection;
                    for(i = 0; i < max; i++){
                        tween = queue[i];
                        intersection = tween.getIntersection(lastProgress, progress);
                        if(intersection){
                            tween.render(progress);
                            break;
                        }
                    }
                });

                lastProgress = progress;
            },

            step: function(){
                var delta = this.smoothTo - this.smoothFrom,
                    absDelta = Math.abs(delta);
                if(absDelta > this.maxSpeed){
                    this.smoothFrom += this.maxSpeed * (delta < 0 ? -1 : 1);
                    this.render(this.smoothFrom);
                    requestAnimationFrame(this.step.bind(this));
                }else{
                    this.render(this.smoothTo);
                    this.smoothFrom = this.smoothTo;
                    this.status = 'idle';
                }
            }
        };
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

    addEvent(window, 'resize', function(event){
        windowHeight = Number(window.innerHeight) || window.innerHeight;
        docHeight = getDocumentHeight();
        queues.forEach(function(queue){
            queue.forEach(function(tween){
                tween.recalc(docHeight);
            });
        });
        smoothQueues.forEach(function(queue){
            queue.forEach(function(tween){
                tween.recalc(docHeight);
            });
        });
    });

    addEvent(window, 'scroll', function(event){
        scrollCatcher.call(S);
        setTimeout(scrollCatcher.bind(S), 100);
    });

    function scrollCatcher(){
        var scrollTop = getScrollTop(), //calculate current scroll
            progress = scrollTop / (docHeight - windowHeight); //calculate current scroll progress

        if(scrollTop !== lastScroll){
            //render animations with smooth effect
            this.Smoother.makeSmoothy(progress);

            //render all other animations
            this.render(progress);
        }
        lastScroll = scrollTop;
        //requestAnimationFrame(scrollCatcher.bind(this));
    }

    //requestAnimationFrame(scrollCatcher.bind(S));

    (callback || function(){}).call(S);
    return S;
}