/**
 * Scrollissimo touch adapter
 * @author frux
 */
(function(global){
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

            S._on(document.body, 'touchstart', function(e){
                velocity = 0;
                if(e.targetTouches.length === 1){
                    lastScrollTop = e.touches[0].clientY;
                    lastDelta = 0;
                }
            });

            S._on(document.body, 'touchmove', function(e){
                if(e.targetTouches.length === 1){
                    var delta = lastScrollTop - (lastScrollTop = e.touches[0].clientY);

                    if((lastDelta * (lastDelta = delta)) >= 0){
                        if(Math.abs(lastScrollTime - (lastScrollTime = +new Date)) > 200){
                            startTime = lastScrollTime;
                        }else{
                            distance += delta;
                        }
                        scrollBy(delta * S.Touch.scrollStrength);

                        e.preventDefault();
                        return false;
                    }
                }
            });

            S._on(document.body, 'touchend', function(e){
                if(Math.abs(lastScrollTime - (lastScrollTime = +new Date)) < 200){
                    var interval = (lastScrollTime - startTime);

                    velocity = distance / interval * 10;
                    if((interval > 100) || Math.abs(distance) > 100){
                        S._requestAnimationFrame(scrollStep);
                    }
                }
                distance = 0;
                startTime = 0;
            });
        }

        function scrollStep(){
            if(Math.abs(velocity) > 1){
                velocity = (velocity * S.Touch.friction);
                scrollBy(velocity);
                S._requestAnimationFrame(scrollStep);
            }
        }
    }

    function scrollBy(scroll){
        document.body.scrollTop += Number(scroll);
    }
})(this);