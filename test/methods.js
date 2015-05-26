/* global describe, it, global */

//'use strict';

var should = require('should');
describe('Methods', function(){

    var Scrollissimo,
        docHeight = 2000,

    //Greensock mock
        window = window || {
            callbacks : {
                load: []
            },
            addEventListener: function(eventName, handler){
                if(typeof handler === 'function' && this.callbacks[eventName]){
                    this.callbacks[eventName].push(handler);
                }
            },
            load: function(){
                this.callbacks['load'].forEach(function(handler){
                    handler.call(this);
                });
            },
            innerHeight: 926
        },

        document = document || {
            body: {
                scrollHeight: docHeight,
                offsetHeight: docHeight,
                clientHeight: docHeight
            },
            documentElement: {
                scrollHeight: docHeight,
                offsetHeight: docHeight,
                clientHeight: docHeight
            }
        };

    // document mock
    global.document = document;
    // window mock
    global.window = window;

    Scrollissimo = require('../lib/scrollissimo');

    window.addEventListener('load', function(){
        it('Initialization', function(done){
            should.exist(Scrollissimo);
            done();
        });

        it('_toPercents test', function(done){
            Scrollissimo._toPercents('300px').should.equal(.15, 'Converting px to percents');
            Scrollissimo._toPercents('300').should.equal(.15, 'Converting String number to percents');
            Scrollissimo._toPercents(300).should.equal(.15, 'Converting Number to percents');
            Scrollissimo._toPercents('15%').should.equal(.15, 'Converting % to percents');
            done();
        });
    });

    window.load();
});