"use strict";
window.addEventListener("load", () => {

    // Get the poster document
    function pdoc() {
        return document.getElementById("poster").contentDocument;
    }

    // Close drawer when icon is clicked
    document.getElementById("close-drawer")
        .addEventListener("click", e => document.querySelector(".mdl-layout__drawer").classList.remove("is-visible"));

    // TODO Add drag and drop support: https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications#Selecting_files_using_drag_and_drop
    // Load button
    document.getElementById("load").addEventListener("click", e => {
        var inp = document.createElement("input");
        inp.style.display = "none";
        inp.type = "file";
        inp.addEventListener("change", e => {
            var reader = new FileReader();
            reader.addEventListener("loadend", e => {
                console.log(reader.result);
                // FIXME handle result properly
                document.body.removeChild(inp);
            });
            reader.readAsText(inp.files[0]);
        });

        document.body.appendChild(inp);
        inp.click();
    });

    // Save button
    document.getElementById("save").addEventListener("click", e => {
        var blob = new Blob([pdoc().documentElement.outerHTML], {type: "text/html"});
        var url = URL.createObjectURL(blob);

        var a = document.createElement("a");
        a.style.display = "none";
        // TODO Use file name option
        a.download = document.getElementById("title").textContent + ".html";
        a.href = url;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });

    // Print button
    document.getElementById("print").addEventListener("click", e => document.getElementById("poster").contentWindow.print());

    // Changing the file name
    var title = document.getElementById("title"),
        drawerTitle = document.getElementById("drawer-title");
    title.addEventListener("input", e => {
        drawerTitle.textContent = title.textContent;
        document.title = title.textContent;
    });
    drawerTitle.addEventListener("input", e => {
        title.textContent = drawerTitle.textContent;
        document.title = drawerTitle.textContent;
    });

    // Click adds stuff FIXME
    document.getElementById("add-element").addEventListener("click", e => {
        console.error("clicked!");
    });

});
