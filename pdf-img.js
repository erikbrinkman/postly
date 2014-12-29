/* Javascript file to find all image tags referencing pdfs and replace them
 * with canvases with the rendered pdfs thanks to pdf.js */
'use strict';

(function () {
  
  /* Takes a DOM element and replaces it with a canvas element with
   * identicalstyle */
  function replaceElementWithCanvas(elem) {
    var canvas = document.createElement("canvas");
    canvas.height = 0;
    canvas.width = 0;
    [].forEach.call(elem.attributes, function(att) {
      canvas.setAttribute(att.name, att.value);
    });
    elem.parentNode.insertBefore(canvas, elem);
    elem.parentNode.removeChild(elem);
    return canvas;
  }

  /* Computes the appropriate scale for a pdf and a canvas. The scale is the
   * appropriate ratio between pdf size and canvas size ignoring any dimensions
   * that are zero. NaN is returned if both height and width are nonzero and
   * they don't match the pdf page one aspect ratio */
  function computeScale(page, canvas) {
    var scale = 1;
    var measure = page.getViewport(scale);
    var props = window.getComputedStyle(canvas, null);
    var height = parseInt(props.getPropertyValue("height"));
    var width = parseInt(props.getPropertyValue("width"));
    
    // FIXME Test that this works as intended
    if (height == 0) {
      scale = width / measure.width;
    } else {
      scale = height / measure.height;
      if (width != 0 && width != scale * measure.width) {
        console.error("Can't properly size canvas for", img,
                      ", either one of its dimensions wasn't zero, or it",
                      "didn't have the same aspect ratio as the first page");
        return NaN;
      }
    }
    return scale;
  }
  
  /* Renders a pdf page on a canvas at a given scale */
  function renderPageOnCanvas(page, canvas, scale) {
    var viewport = page.getViewport(scale);
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    page.render({
      canvasContext: canvas.getContext("2d"),
      viewport: viewport
    });
  }

  /* On page load, finds every image that is trying to load a pdf and instead
   * replaces it with a canvas that has the first page of the pdf rendered onto
   * it */
  document.addEventListener("DOMContentLoaded", function(event) { 
    [].forEach.call(document.querySelectorAll('img[src$=".pdf"]'), function(img) {
      PDFJS.getDocument(img.getAttribute("src")).then( function(pdf) {
        pdf.getPage(1).then( function(page) {
          var canvas = replaceElementWithCanvas(img);
          var scale = computeScale(page, canvas);
          renderPageOnCanvas(page, canvas, scale);
        });
      });
    });
  });

}());
