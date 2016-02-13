/* global describe, it, global */

//'use strict';

var should = require('should');
describe('Methods', function(){

    var Scrollissimo,
        docHeight = 2000,

    //Greensock mock
        window = window || {
            callbacks: {
                load: []
            },
            addEventListener: function(eventName, handler){
                if(typeof handler === 'function' && this.callbacks[eventName]){
                    this.callbacks[eventName].push(handler);
                }
            },

            load: function(){
                this.callbacks.load.forEach(function(handler){
                    handler.call(this);
                });
            },

            innerHeight: 926
        },

        document = document || {
            body: {
                scrollHeight: docHeight,
                offsetHeight: 0.1 * docHeight,
                clientHeight: 0.3 * docHeight
            },
            documentElement: {
                scrollHeight: 0.4 * docHeight,
                offsetHeight: 0.5 * docHeight,
                clientHeight: 0.6 * docHeight
            }
        };

    // document mock
    global.document = document;

    // window mock
    global.window = window;

    Scrollissimo = require('../scrollissimo.es5');

    window.addEventListener('load', function(){
        it('_getIntersection tests', function(done){
            var intersection;

            intersection = Scrollissimo._test._getIntersection(0, 10, 2, 8);
            intersection.should.have.property('from');
            intersection.should.have.property('to');
            intersection.from.should.equal(2);
            intersection.to.should.equal(8);

            intersection = Scrollissimo._test._getIntersection(2, 8, 0, 10);
            intersection.should.have.property('from');
            intersection.should.have.property('to');
            intersection.from.should.equal(2);
            intersection.to.should.equal(8);

            intersection = Scrollissimo._test._getIntersection(0, 7, 2, 9);
            intersection.should.have.property('from');
            intersection.should.have.property('to');
            intersection.from.should.equal(2);
            intersection.to.should.equal(7);

            intersection = Scrollissimo._test._getIntersection(2, 9, 0, 7);
            intersection.should.have.property('from');
            intersection.should.have.property('to');
            intersection.from.should.equal(2);
            intersection.to.should.equal(7);

            intersection = Scrollissimo._test._getIntersection(1, 5, 5, 10);
            intersection.should.have.property('from');
            intersection.should.have.property('to');
            intersection.from.should.equal(5);
            intersection.to.should.equal(5);

            intersection = Scrollissimo._test._getIntersection(0, 0, 0, 0);
            intersection.should.have.property('from');
            intersection.should.have.property('to');
            intersection.from.should.equal(0);
            intersection.to.should.equal(0);

            intersection = Scrollissimo._test._getIntersection(0, 4, 5, 9);
            should.not.exists(intersection);

            intersection = Scrollissimo._test._getIntersection(5, 9, 0, 4);
            should.not.exists(intersection);

            done();
        });
    });

    window.load();
});
