Postly
======

An HTML / CSS / Javascript template for creating academic posters

Get Started
-----------

Everything you need to create a beautiful academic poster is set up for you in
the root of this directory. Note, I have yet to fix a major issue with
printing, so currently posters can only be saved to letter paper, and the font
size has to be tweaked a little bit. Postly is developed in and for chrome, so
ymmv in other browsers. In addition, all dependent libraries are included so
that posters can be created offline.

The most basic poster, with minimum styling is set up in
[`index.html`](index.html). Modify this to add content to your
poster. [`custom.less`](custom.less) is a less stylesheet that should be
modified to tweak the theming of your poster.

To see an example of what it's possible to create with postly, check out the
[demos](demos) folder.

To aid in deveopment, there's a gulpfile that will set up browser
sycing. Simply run `npm install` from the root directory, and then when you
want to develop, run `gulp` (you may need to also install gulp globally). This
will open up index.html in a new window, and refresh as soon as any relevant
files are changed.

Better documentation on how to actually tweak styles and add content should be
here eventually. Until then, you can look at the demos for an example of how to
add content as well as how to style it.

Known Bugs / TODOs
------------------

* Pdfs are rendered on canvas, as such, they lose their awesome vector nature. Should replace this with some library that can load a pdf as an svg
* Clean up font size setting between portrait and landscape, including a better default font-size when in portrait mode
* Fix font size / paper size when printing, because vw and vh don't work in @print
* Adjusting font size off of viewport size is a little hacky. Once the @viewport tag is supported in major browsers, that should make a much better default
* Experiment with using flex box wrapping for column support
* Documentation
* At some point create a webapp that makes it easy to modify this with a gui...

Supporting Projects
-------------------

See the [licenses](licenses) folder

* MathJax for rendering equations
* Normalize.css for a set of good defaults
* Less to support better custom styling and ease of page settings
* Pdf.js for pdf rendering.
