"use strict";
window.addEventListener("load", () => {

    var fdocument = document.getElementById("poster").contentDocument;
    document.getElementById("add-element").addEventListener('click', e => {
        var div = fdocument.createElement("div");
        div.style.width = "100%";
        div.style.height = "2em";
        div.style.margin = "1em 0";
        div.style.backgroundColor = "black";
        fdocument.body.appendChild(div);
    });

});
