![Scrollissimo](https://habrastorage.org/files/997/93c/cec/99793ccec1464bb594f44f569396f184.png)

[![Build Status](https://travis-ci.org/Promo/scrollissimo.svg?branch=master)](https://travis-ci.org/Promo/scrollissimo)

Javascript plugin for smooth scroll-controlled animations

Scrollissimo animates Greensock's tweens and timelines on user's scroll.

Comparing Scrollissimo and another usual plugins [here](http://promo.github.io/scrollissimo/examples/paperfly). 

## Get started

### Download

Scrollissimo is available for downloading from repository. Also npm users can install Scrollissimo by command:

```bash
npm install scrollissimo
```

### Connect
The first step you need is to include Greensock:

```html
    <script src="http://cdnjs.cloudflare.com/ajax/libs/gsap/latest/TweenLite.min.js"></script>
    <script src="http://cdnjs.cloudflare.com/ajax/libs/gsap/latest/TimelineLite.min.js"></script>
    <script src="http://cdnjs.cloudflare.com/ajax/libs/gsap/latest/plugins/CSSPlugin.min.js"></script>
```

... or just:

```html
    <script src="http://cdnjs.cloudflare.com/ajax/libs/gsap/latest/TweenMax.min.js"></script>
```

... and Scrollissimo of course:

```html
    <script src="scrollissimo/dist/scrollissimo.min.js"></script>
```

Next we will trigger scrollissimo on each scroll event:

```html
<script>
    $(document).ready(function(){
        $(window).scroll(function(){
            scrollissimo.knock();
        });
    });
</script>
```

**NOTE:** for touch devices support you must also attach scrollissimo.touch.min.js.

### Now lets animate something!
Let we have a div called *Divy*:

```html
<div id="Divy"></div>
```
```css
#Divy{
    position: fixed;
    top: 0;
    left: 0;
    
    height: 50px;
    width: 50px;
    
    background: red;
}
```

Now we will animate Divy's width. At the begining of page its width will be equal to 50px. And as we scroll its width will be grow up to 300px after we have scrolled for 1000 pixels.
The first let's create Grensock's tween.

**```TweenLite.to(element:object, durationInPixels: number, params: object);```**

more in [Greensock`s documentation](http://greensock.com/docs/#/HTML5/GSAP/TweenMax/to/)

```js
var divyTween = TweenLite.to(document.getElementById('Divy'), 1000, { width: 300 });
```

**NOTE:** As you see it\`s usual Greensock\`s Tween except of duration of animation ***must be specified in pixels not in seconds.

Then we need to add this tween to Scrollissimo.

**```scrollissimo.add(<Tween|Timeline>, <StartPixels>, <MaxSpeed>);```**

The second argument is start scroll value in pixels.
The third argument is a maximal value of changing scrollTop.

```js
scrollissimo.add(divyTween, 0, 25);
```

That is all you need to do to make a simple animation.

Animating timelines is similar to tween`s animating.
    
[travis-url]: http://travis-ci.org/Promo/scrollissimo
[travis-image]: http://img.shields.io/travis/Promo/scrollissimo.svg?branch=master
