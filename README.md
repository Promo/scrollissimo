# Scrollissimo
Javascript plugin for smooth scroll-controlled animations

## Get started

The first step you need is to include jQuery and Scrollissimo to your page:

```html
    <script src="jquery.min.js"></script>
    <script src="scrollissimo.min.js"></script>
```

To support touch devices you also need to include touch adapter:

```html
    <script src="scrollissimo.touch.min.js"></script>
```

Then we will trigger Scrollissimo at each scroll event:

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
    height: 50px;
    width: 50px;
    background: red;
}
```

Now we will animate Divy's width. At the begining of page its width will be equal to 50px. And as we scroll its width will be grow up to 300px after we have scrolled for 10% of page's height.

```js
Scrollissimo.add({
    target: $('#Divy'),
    property: 'width',
    from: 50,
    to: 300,
    suffix: 'px',
    start: '0',
    duration: '10%'
});
```

That is all you need to do to make a simple animation. Result you may see [here](https://jsfiddle.net/1ff5Lv9x/2/).
##PercentPixel units
PercentPixel units used to specify tween's parameters such as ```start```, ```duration``` and also custom ```scrollTop``` value in a ```.knock()``` method.

PercentPixel parameters may be specified as:
 * percentage of total page's height: ```'54%'```
 * pixel's quantity: ```'1000px'``` or ```'1000'``` or ```1000```

## Changelog
 * v0.1.0:
    * jQuery now is required
    * ```maxSpeed``` parameter now is a multiplier (1 equals standard maximal speed and approximately equals 0.001 old value)
    * ```Scrollissimo.knock``` now takes optional parameter. It forces scrollTop value for Scrollissimo.
