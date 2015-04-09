/**
 * Scrollissimo touch adapter
 * @author frux
 */
(function(global, $){
    var lastScrollTop = 0,
        lastDelta = 0,
        startTime = 0,
        lastScrollTime = 0,
        distance = 0,
        velocity = 0,
        S = global.Scrollissimo;
    if(S){
        if(S.isTouchMode){
            S.Touch = {
                scrollStrength: 1,
                friction: .9
            };

            $('body').touchstart(function(e){
                velocity = 0;
                if(e.targetTouches.length === 1){
                    lastScrollTop = e.touches[0].clientY;
                    lastDelta = 0;
                }
            })
                .touchmove(function(e){
                    if(e.targetTouches.length === 1){
                        var delta = lastScrollTop - (lastScrollTop = e.touches[0].clientY);

                        if((lastDelta * (lastDelta = delta)) >= 0){
                            if(Math.abs(lastScrollTime - (lastScrollTime = +new Date)) > 100){
                                startTime = lastScrollTime;
                                distance = 0;
                            }else{
                                if(distance * delta < 0){
                                    distance = 0;
                                }
                                distance += delta;
                            }
                            global.scrollBy(0, delta * S.Touch.scrollStrength);

                            e.preventDefault();
                            return false;
                        }
                    }
                })
                .touchend(function(){
                    if(Math.abs(lastScrollTime - (lastScrollTime = +new Date)) < 100){
                        var interval = (lastScrollTime - startTime);

                        velocity = distance / interval * 100;

                        S._requestAnimationFrame(scrollStep);
                    }
                    distance = 0;
                    startTime = 0;
                });
        }

        function scrollStep(){
            if(Math.abs(velocity) > 10){
                velocity = (velocity * S.Touch.friction);
                global.scrollBy(0, velocity);
                S._requestAnimationFrame(scrollStep);
            }
        }
    }

    // @deprecated
    function scrollBy(scroll){
        document.body.scrollTop += Number(scroll);
    }
})(this, jQuery);