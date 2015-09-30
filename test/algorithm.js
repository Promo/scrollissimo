/* global describe, it, global */

//'use strict';

var should = require('should');
describe('Algorithm', function(){

    var Scrollissimo,
        docHeight = 2000,

        //Greensock mock
        testTimeline = {
            progress: function(progress){
                return this;
            },
            duration: function(){
                return docHeight;
            },
            pause: function(){
                return this;
            },
            timeScale: function(){
                return 1;
            }
        },
        testResult = [],

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
            innerHeight: 926,
            pageYOffset: 0
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
        },

        //Scroll mock
        testScrollTopData = [
            {
                data: [ 4,44,192,456,748,1074 ],
                result: [ 8,82,162,242,322,358,438,518,598,678,758,838,918,998,1078,1158,1238,1318,1398,1478,1558,1638 ],
                maxSpeed: 80
            }
        ];

    // document mock
    global.document = document;
    // window mock
    global.window = window;

    Scrollissimo = require('../lib/scrollissimo');

    Scrollissimo._test._setRenderFunc(function(scrollTop){
        testResult.push(scrollTop);
    });

    window.addEventListener('load', function(){
        it('Initialization', function(done){
            should.exist(Scrollissimo);
            done();
        });

        it('Values', function(done){

            testScrollTopData.forEach(function(data){
                Scrollissimo.add(testTimeline, 0, data.maxSpeed / 0.001 / docHeight);

                var timer = setInterval(function(){
                    var scrollTop = data.data.shift();
                    if(!isNaN(scrollTop)){
                        Scrollissimo.knock(scrollTop);
                    }else{
                        clearInterval(timer);
                        testResult.forEach(function(resultValue, i){
                            if(i > 1 && i < (testResult.length - 1)){
                                (resultValue - testResult[i - 1]).should.be.below(data.maxSpeed + 1);
                            }else{
                                should.type('number');
                            }
                        });
                        done();
                    }
                }, 100);
            });
        });
    });

    window.load();
});