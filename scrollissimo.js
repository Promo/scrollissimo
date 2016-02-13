'use strict';
/**
 * Scrollissimo
 * Javascript plugin for smooth scroll-controlled animations
 * @version 0.6.0
 * @author frux <qdinov@yandex.ru>
 * @url https:// github.com/Promo/scrollissimo
 */

/* global window, document */

// array of not smoothed animations
let queues = [],

	// array of smoothed animations
	smoothQueues = [],

	// disable triggering. It's needed to prevent start scroll position animating
	disableKnock = true,

	// previous trigger scroll value
	previousScrollTop = 0,
	Queue;

export var enableSmoothing = true;
export const _isTouchMode = ('ontouchstart' in window),
	_test = {
		_setRenderFunc: function(newRenderFunc){
			Queue.prototype._render = newRenderFunc;
		},

		_getIntersection: getIntersection
	};

/**
 * Get intersection of two custom number ranges
 * @param from1 {number}
 * @param to1 {number}
 * @param from2 {number}
 * @param to2 {number}
 * @returns {{from: number, to: number}|undefined}
 */
function getIntersection(from1, to1, from2, to2){
	const f2 = Math.min(from2, to2),
		t2 = Math.max(from2, to2),
		f1 = from1,
		t1 = to1;

	var n1,
		n2;

	if(f2 <= f1 && t2 >= f1){
		n1 = f1;
		n2 = Math.min(t2, t1);
	}else if(t2 >= t1 && f2 <= t1){
		n1 = Math.max(f2, f1);
		n2 = Math.min(t2, t1);
	}else if(f2 >= f1 && t2 <= t1){
		n1 = f2;
		n2 = t2;
	}else{
		return;
	}

	return (from2 < to2 ? {from: n1, to: n2} : {from: n2, to: n1});
}

/**
 * Queue class
 * @param timeline {TimelineLite|TimelineMax} Greensock timeline
 * @param start {Object} Timeline start value in pixels
 * @param maxSpeed {number|undefined} Max speed. Must be specified to enable smoothing.
 * @private
 * @constructor
 */
Queue = function(timeline, start, maxSpeed){
	if(timeline){
		// convert start and duration to percents
		this.params = {
			start: start || 0,
			duration: timeline.duration() || 0
		};

		// pause timeline to prevent autoplaying
		this.timeline = timeline.pause();

		// if maximal speed specified
		if(!isNaN(maxSpeed)){
			// convert it to seconds
			this._maxSpeed = maxSpeed;

			// create smoother
			this._smoother = new Queue.Smoother(this, this._maxSpeed);
		}
	}
};

/**
 * Get intersection of queue and scroll
 * @param previousScrollTop {number}
 * @param scrollTop {number}
 * @returns {{from: number, to: number}|undefined}
 */
Queue.prototype.getIntersection = function(previousScrollTop, scrollTop){
	return getIntersection(this.params.start, this.params.start + this.timeline.duration() * this.timeline.timeScale(), previousScrollTop, scrollTop);
};

/**
 * Render specified progress of animation
 * @param scrollTop {number} scrollTop
 * @returns {Queue}
 */
Queue.prototype.render = function(scrollTop){
	// convert progress of page scrolling to progress of this tween
	let tweenProgress = Math.round((scrollTop - this.params.start) / this.timeline.duration() * this.timeline.timeScale() * 1000) / 1000;

	if(tweenProgress < 0){
		tweenProgress = 0;
	}

	if(tweenProgress > 1){
		tweenProgress = 1;
	}

	// jump to calculated progress
	this.timeline.progress(tweenProgress);

	return this;
};

/**
 * Queue smoother class
 * @param queue {Queue} Queue to smooth
 * @param maxSpeed {number} Max percents of page's height animation can play on one requestAnimationFrame tick
 * @constructor
 */
Queue.Smoother = function(queue, maxSpeed){
	// current state of this Smoother 'busy' or 'idle'
	this.status = 'idle';

	// finish value tween must be played to
	this.animateTo = 0;

	// maximal speed of tween playing
	this.maxSpeed = Number(maxSpeed);

	// queue this smoother relates to
	this.queue = queue;
};

/**
 * Render specified progress of current queue's animations
 * @param previousScrollTop {number} Previous scrollTop value
 * @param scrollTop {number} Current scrollTop value
 */
Queue.Smoother.prototype.smooth = function(previousScrollTop, scrollTop){
	// does current scroll intersects with this queue?
	const intersection = this.queue.getIntersection(previousScrollTop, scrollTop);

	// if it does...
	if(intersection){
		// replace finish value by current scroll value
		this.animateTo = intersection.to;

		// if start value is not defined set start scrolling value
		this.animateFrom = this.animateFrom || intersection.from;

		// if Smoother is idle we need to run it
		if(this.status === 'idle'){
			// set playing status
			this.status = 'busy';

			// tick
			this.id = window.requestAnimationFrame(this.step.bind(this));
		}

		return this;
	}
};

/**
 * Smoother's tick function
 */
Queue.Smoother.prototype.step = function(){
	// calculate diff between the start and the end of tween playing
	const delta = this.animateTo - this.animateFrom;

	// if absolute value of this difference is more than maximal speed
	if(Math.abs(delta) > this.maxSpeed){
		// jump by maximal speed value instead of delta and render it
		this.queue.render(this.animateFrom += this.maxSpeed * (delta > 0 ? 1 : -1));

		// run next tick
		window.requestAnimationFrame(this.step.bind(this));
	}else{
		// render finish frame
		this.queue.render(this.animateTo);

		// set status to 'idle'
		this.status = 'idle';

		// set start value to current value
		this.animateFrom = this.animateTo;
	}
};

/**
 * Add timeline to a queue
 * @param timeline {TimelineLite|TimelineMax|TweenLite|TweenMax} Greensock timeline
 * @param start {Object} Timeline start value
 * @param maxSpeed {number|undefined} Max speed
 * @returns {Scrollissimo}
 */
export function add(timeline, start, maxSpeed){
	// if maximal speed is specified
	if(!isNaN(maxSpeed)){
		// add this queue to smooth queues
		smoothQueues.push(new Queue(timeline, start, maxSpeed));
	}else{
		// else place it to usual queues
		queues.push(new Queue(timeline, start, maxSpeed));
	}

	return this;
}

/**
 * Render all animation queues
 * @param scrollTop {number} current scrollTop
 * @param enableSmoothing {boolean}
 * @private
 */
function _render(scrollTop, enableSmoothing){
	// for each not smoothed queue
	queues.forEach(queue => {
		// just render current scroll progress
		queue.render(scrollTop);
	});

	// for each smoothed queue
	smoothQueues.forEach(queue => {
		// if smoothing is not disabled
		if(enableSmoothing){
			// run smoother
			queue._smoother.smooth(previousScrollTop, scrollTop);
		}else{
			// else just render current scroll progress
			queue.render(scrollTop);
		}
	});
}

/**
 * Catch and handle scrolling
 * @param customScrollTop {number|undefined} Custom scroll value. Default: current scroll value.
 * @private
 */
function _catch(customScrollTop){
	// calculate current scroll
	const scrollTop = (isNaN(customScrollTop) ? window.pageYOffset : customScrollTop);

	_render(scrollTop, enableSmoothing);

	// remember current progress value
	previousScrollTop = scrollTop;
}

/**
	 * Trigger Scrollissimo
	 * @param customScrollTop {Number|undefined} Custom scrollTop value
	 */
export function knock(customScrollTop){
	if(!disableKnock){
		_catch(customScrollTop);
		if(isNaN(customScrollTop)){
			setTimeout(_catch, 10);
		}
	}
}

/* Scrollissimo will be initialized then window will be loaded.
   Also Scrollissimo will try to catch first scroll movement (first 10 scroll values) to define if you need a smoothing */
document.addEventListener('DOMContentLoaded', function(){
	// array first 10 scroll values will be written in
	let wheelStack = [],

		// remember timestamp
		spectateStartTime = Number(new Date()),
		stepwiseDetector;

	// Render start scroll position instead of animating it
	setTimeout(() => {
		// get start scroll value
		var startScrollTop = window.pageYOffset;

		// remember start scroll position as a previous
		previousScrollTop = startScrollTop;

		// render start progress
		_render(startScrollTop, false);

		// allow to handle all next knocks
		disableKnock = false;
	}, 100);

	// if it's not a touch device
	if(!_isTouchMode){
		// function which will collect 10 values of first scroll movement to define if you need a smoothing
		stepwiseDetector = function(e){
			let bigStepDetected = false,
				i;

			// if all is done
			if(wheelStack.length === 5){
				// remove this scroll handler
				window.removeEventListener('wheel', stepwiseDetector);
			}

			// remember this value
			wheelStack.push(e.deltaY);

			if((Number(new Date()) - spectateStartTime <= 400)){
				if(wheelStack.length === 5){
					for(i = 0; i < 5; i++){
						if((Math.abs(wheelStack[i])) > 100){
							bigStepDetected = true;
							break;
						}
					}

					// define disable smoothing or not
					enableSmoothing = bigStepDetected;
				}
			}else{
				// reset scroll values and timer
				spectateStartTime = Number(new Date());
				wheelStack = [];
			}
		};

		window.addEventListener('wheel', stepwiseDetector);
	}else{
		enableSmoothing = false;
	}
});
