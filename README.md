Postly
======

An HTML / CSS / Javascript template for creating academic posters

Important
---------

There is still one fairly large flaw. For some reason chrome (on ubuntu) is
still scaling a page with absolute dimensions. In order to get the poster to
actually fit on a page I had to manually tweak the zoom. You can do this by
adding

```css
@media print {
    html, body {
        zoom: 1.15; /* or w/e is necessary */
    }
}
```

to your personal style sheet. This should allow you to print normally.

Also, currently pdfs are supported by rendering on canvas. To get full vector
support, it's recommended that you convert pdfs to svg before inclusion.

Get Started
-----------

Everything you need to create a beautiful academic poster is set up for you in
the root of this directory. Postly is developed in and for chrome, so ymmv in
other browsers. I've included all of the dependencies here so that postly can
be used offline.

The most basic poster, with minimum styling is set up in
[`index.html`](index.html). Modify this to add content to your poster. This
used the [`basic.css`](basic.css) stylesheet to provide the necessary parameters
for the poster to render. [`wolverine.css`](wolverine.css) is a more advanced
stylesheet that was used to create [this demo](demos/wolverine/index.html).

The template itself is fairly basic html, and should be easily understood with
cursory knowledge of html. Similarly there's nothing too advanced with custom
styling. Cursory knowledge of css and a look at `wolverine.css` should be
enough to modify styling on your own. The main gotcha is that some items are
necessarily sized to `100%`, and so to add a margin you may actually have to add
padding to a parent, as well as make sure the `box-sizing` is `border-box`.

To aid in development, there's a gulpfile that will set up browser
syncing. Simply run `npm install` from the root directory, and then when you
want to develop, run `gulp` (you may need to also install gulp globally). This
will open up index.html in a new window, and refresh as soon as any relevant
files are changed.

Better documentation on how to actually tweak styles and add content should be
here eventually. Until then, you can look at the demos for an example of how to
add content as well as how to style it.

Known Bugs / TODOs
------------------

* Make title editable, and have it reflect file saved to, and load it based off
  of file loaded.
* Sync CSS
* Drag and drop

* Pdfs are rendered on canvas, as such, they lose their awesome vector
  nature. Should replace this with some library that can load a pdf as an
  svg. This may be possible with an svg backend of pdf.js.
* Currently, the page is kept sized via javascript modifying the `html` `zoom`
  property. Once the @viewport tag is supported in major browsers, that may
  make a much better solution.
* Due to zoom based solution, zooming in is impossible.
* I may want to experiment with making the columns part of `flex-box` wrapping.
* Improved Documentation.
* At some point create a webapp that makes it easy to modify this with a
  gui. This will likely embed the actual page as an iframe and go from there.

Supporting Projects
-------------------

See the [licenses](licenses) folder

* Normalize.css for a set of good defaults
* MathJax for rendering equations
* Pdf.js for pdf rendering.
