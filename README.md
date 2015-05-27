# Scrollissimo
Javascript plugin for smooth scroll-controlled animations

[![Build Status][travis-image]][travis-url]

Scrollissimo can animate Greensock's tweens and timelines on user's scroll.

## Get started

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

To support touch devices you also need to include touch adapter:

```html
    <script src="scrollissimo/dist/scrollissimo.touch.min.js"></script>
```

Then we must trigger Scrollissimo on each scroll event:

```html
<script>
    $(document).ready(function(){
        $(window).scroll(function(){
            Scrollissimo.knock();
        });
    });
</script>
```

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

Now we will animate Divy's width. At the begining of page its width will be equal to 50px. And as we scroll its width will be grow up to 300px after we have scrolled for 500 pixels.
The first let's create Grensock's tween.

```js
var divyTween = TweenLite.to(document.getElementById('divy'), 500, { width: 300, paused: true });
```

**NOTE**: Your tween must be paused. You can make it easily by specifing  ```paused: true``` or creating tween by constructor ```new TweenLite()```.

Then we need to add this tween to Scrollissimo.

```js
Scrollissimo.add(divyTween, 0);
```

The second argument is start scroll value in pixels.

That is all you need to do to make a simple animation. Result you may see [here](https://jsfiddle.net/7d9kxpe1/2/).

## Changelog
 * v0.3.3:
     * Autopausing of tweens and timelines. Now you don't have to pause it manually.
 * v0.3.2:
    * Hotfix
 * v0.3.1:
    * CommonJS support
 * v0.3.0:
    * Now Scrollissimo is powered by [Greensock](http://greensock.com/). Animate your Greensock's tweens and timelines by scrolling. Enjoy of it's smoothness!
 * v0.2.0:
    * Support of relative start values
 * v0.1.0:
    * jQuery now is required
    * ```maxSpeed``` parameter now is a multiplier (1 equals standard maximal speed and approximately equals 0.001 old value)
    * ```Scrollissimo.knock``` now takes optional parameter. It forces scrollTop value for Scrollissimo.
    
[travis-url]: http://travis-ci.org/Promo/scrollissimo
[travis-image]: http://img.shields.io/travis/Promo/scrollissimo.svg?branch=master&style=flat