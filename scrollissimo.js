/* requestAnimationFrame polyfill */
(function(){
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x){
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame']
        || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
    if(!window.requestAnimationFrame){
        window.requestAnimationFrame = function(callback, element){
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function(){
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if (!window.cancelAnimationFrame){
        window.cancelAnimationFrame = function(id){
            clearTimeout(id);
        };
    }
}());

/**
 * Scrollissimo initialization
 * @param callback {Function} Initialization end's callback
 * @returns {Scrollissimo} Scrollissimo object
 * @Singletone
 */
function Scrollissimo(callback){
    var S = {}, //S is for singletone :)
        docHeight = getDocumentHeight() || 0,
        windowHeight = Number(window.innerHeight) || window.innerHeight,
        smoothQueues = [], //all animations with smooth effect
        queues = [], //all other animations queues
        lastScroll = 0; //TODO: Remove this

    /**
     * Calculate document's height
     * @returns {Number} Height of document
     */
    function getDocumentHeight(){
        return Math.max(
            document.body.scrollHeight, document.documentElement.scrollHeight,
            document.body.offsetHeight, document.documentElement.offsetHeight,
            document.body.clientHeight, document.documentElement.clientHeight
        );
    }

    /**
     * Calculate current scrolling value for a bottom edge of window
     * @returns {Number} Length of scrolled area in pixels
     */
    function getScrollTop(){
        return (window.pageYOffset || document.scrollTop || 0) - (document.clientTop || 0);
    }

    /**
     * Converts pixels in percents related to a document's height
     * @param px {Number|String} Value in pixels
     * @depends getDocumentHeight
     * @returns {Number} Value in percents
     */
    function px2percents(px){
        return parseInt(px) / getDocumentHeight();
    }

    /**
     * Configure render function for animating specified property
     * @param target {HTMLElement} Target of animation
     * @param params {Object} Object contains animation params
     * @returns {Function} Animation render function
     */
    function makeTween(target, params){
        return function(progress){

            //calculate local progress for current animation
            var tweenProgress = (progress - params.start) / params.duration;


            //if animation is playing
            if(tweenProgress > 0 && tweenProgress < 1){
                target.style[params.property] = params.prefix + (params.from + (params.to - params.from) * (tweenProgress)) + params.suffix;

            //if animation is already finished
            }else if(tweenProgress >= 1){
                target.style[params.property] = params.prefix + params.to + params.suffix;

            //if animation is not started yet
            }else if(tweenProgress <= 0){
                target.style[params.property] = params.prefix + params.from + params.suffix;
            }
        };
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
     * @param params {Object} Object contains animation params
     * @returns {Scrolissimo.Queue|undefined}
     */
    S.Queue.prototype.then = function(target, params){
        var tween;
        params = params || {};

        params.property = params.property || '';
        params.prefix =   params.prefix   || '';
        params.suffix =   params.suffix   || '';
        params.from =     !isNaN(params.from) && params.from;
        params.to =       !isNaN(params.to)   && params.to;

        //start parameter might be specified as a string ('100px' or '100%')
        if(typeof params.start === 'string'){

            //if start parameter specified in pixels
            if(params.start.substr(-1) === '%'){
                params.start = parseInt(params.start) / 100;

            //if start parameter specified in percents
            }else if(params.start.substr(-2) === 'px'){
                params.start = px2percents(params.start);

            //if unit is not specified unit sets percents by default
            }else{
                params.start = px2percents(params.start);
            }

        //if start parameter is not specified it puts to the end of this animation's queue
        }else if(isNaN(params.start)){
            params.start = this.endTime;

            //increase total duration of this animation's queue
            this.endTime += params.duration;
        }

        //if duration specified
        if(typeof params.duration === 'string'){

            //if duration specified in percents
            if(params.duration.substr(-1) === '%'){
                params.duration = parseInt(params.duration) / 100;
            }else if(params.duration.substr(-2) === 'px'){
                params.duration = px2percents(params.duration);
            }else{
                params.duration = px2percents(params.duration);
            }
        }else if(isNaN(params.duration)) return;

        //make a render function
        tween = makeTween(target, params);

        //if tween made successfully
        if(typeof tween === 'function'){
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
        var scroll = 0,
            lastScroll = 0,
            smoothStatus = 'stoped',
            smoothStart,
            smoothSpeed;

        S.Smoother = function(scrollTop){
            var delta = scrollTop - lastScroll;

            scroll = scrollTop;

            if(smoothStatus !== 'playing' && lastScroll !== scrollTop){
                smoothSpeed = 3 * Math.abs(delta) + 1;
                S.Smoother.run();
            }
        };

        S.Smoother.run = (function(delta){
            smoothStatus = 'playing';
            requestAnimationFrame((function(time){ this.step(time, true); }).bind(this));
        }).bind(S.Smoother);

        S.Smoother.step = (function(time, firstTime){
            var smoothProgress = (firstTime ? (smoothStart = time) && 0 : (time - smoothStart) / smoothSpeed),
                progress = ((lastScroll + (scroll - lastScroll) * smoothProgress) / (docHeight - windowHeight));

            if(smoothProgress < 1){
                this.render(progress);
                requestAnimationFrame(this.step);
            }else{
                this.render(progress);
                smoothStatus = 'stopped';
                lastScroll = getScrollTop();
            }
        }).bind(S.Smoother);

        S.Smoother.render = (function(progress){
            smoothQueues.forEach(function(queue){
                queue.forEach(function(tween){
                    tween(progress);
                });
            });
        }).bind(S.Smoother);
    })(S);

    /**
     * Create new queue and add animation to the beginning
     * @param target {HTMLElement} Target of animation
     * @param params {Object} Object contains animation's params
     * @param smooth {Boolean} Add smooth effect to this queue's animations
     * return {Scrollissimo.Queue}
     */
    S.add = (function(target, params, smooth){
        var newQueue;

        //create new Queue and add animtion to the beginning
        newQueue = new this.Queue().then(target, params);

        //add new queue to all queues
        (smooth ? smoothQueues : queues).push(newQueue);

        return newQueue;
    }).bind(S);

    S.render = (function(progress){
        //for each animation's queues
        queues.forEach(function(queue){

            //and for each animation of each queue
            queue.forEach(function(tween){

                //render current state related to a current scroll progress
                tween(progress);
            });
        });
    }).bind(S);

    window.addEventListener('scroll', (function(){
        var scrollTop = getScrollTop(), //calculate current scroll
            progress = Math.ceil(scrollTop / (docHeight - windowHeight) * 100) / 100; //calculate current scroll progress

        //render animations with smooth effect
        this.Smoother(scrollTop);

        //render all other animations
        this.render(progress);

        //remember current scroll value
        lastScroll = scrollTop; //TODO: Remove this
    }).bind(S));

    (callback || function(){}).call(S);
    return S;
}

window.onload = function(){
    //initialize Scrollissimo
    var scrollissimo = Scrollissimo(function(){

        //create new queue with animation of scroll indicator
        this.add(document.getElementById('indicator'), {
            property: 'width', //animate width
            prefix: '',
            from: 0, //from 0...
            to: 100, //...to 100...
            suffix: '%', //...percents
            start: '0%', //start at the beginning of page
            duration: '100%' //finish at the end of page
        });

        //create new queue with animation of header's background
        this.add(document.getElementById('header'), {
            property: 'background-position', //animate background's position
            prefix: 'right -', //X value is constant and always equal 'right' and minus for Y value
            from: 0, //from 0...
            to: 400, //...to 400..
            suffix: 'px', //..pixels
            start: '0%', //start at the beginning of page
            duration: '884px' //finish after 884 pixels
        }, true);
    });
};