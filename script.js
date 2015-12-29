"use strict";
window.addEventListener("load", () => {
    document.getElementById("poster").contentWindow.addEventListener("load", () => {

        var pdoc = document.getElementById("poster").contentDocument;

        // Close drawer when icon is clicked
        document.getElementById("close-drawer")
            .addEventListener("click", e => document.querySelector(".mdl-layout__drawer").classList.remove("is-visible"));

        // New poster 
        function newPoster() {
            // TODO Ideally this html is loaded once, but I can't figure out make
            // new reliably wait on loadend event if triggered
            var loadNew = new XMLHttpRequest();
            loadNew.open('GET', 'new.html');
            loadNew.addEventListener('loadend', () => {
                // TODO rewrite newPoster here
                loadPoster(loadNew.responseText, 'postly');
            });
            loadNew.send();
        }

        // New poster button
        document.getElementById("new").addEventListener("click", e => {
            // TODO Prompt about loss of work
            newPoster();
        });

        // Handle actual file load
        // Content is a string of the content, name is the file name
        function loadPoster(content, name) {
            var nodes = new DOMParser().parseFromString(content,  "text/html");

            // Add global instrumentation
            var firstHead = nodes.head.childNodes[0];
            var iconFont = nodes.createElement("link");
            iconFont.classList.add("postly--instrumentation");
            iconFont.href = "//fonts.googleapis.com/icon?family=Material+Icons";
            iconFont.rel = "stylesheet";
            nodes.head.insertBefore(iconFont, firstHead);
            var instrumentationStyle = nodes.createElement("link");
            instrumentationStyle.classList.add("postly--instrumentation");
            instrumentationStyle.href = "instrumentation.css";
            instrumentationStyle.rel = "stylesheet";
            nodes.head.insertBefore(instrumentationStyle, firstHead);
            var showdown = nodes.createElement("script");
            showdown.classList.add("postly--instrumentation");
            showdown.src = "//cdnjs.cloudflare.com/ajax/libs/showdown/1.3.0/showdown.min.js";
            nodes.head.insertBefore(showdown, firstHead);

            // TODO There may be a more efficient way to move the objects
            // rather than converting to and from a string
            pdoc.documentElement.innerHTML = nodes.documentElement.innerHTML;

            // Add element level instrumentation
            var columns = pdoc.querySelectorAll(".postly--column");
            for (var i = 0; i < columns.length; i++) {
                addColumnInstrumentation(columns[i]);
            }
            var boxes = pdoc.querySelectorAll(".postly--box");
            for (var i = 0; i < boxes.length; i++) {
                addBoxInstrumentation(boxes[i]);
            }
        }

        // TODO Add drag and drop support: https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications#Selecting_files_using_drag_and_drop
        // Load button
        document.getElementById("load").addEventListener("click", e => {
            var inp = document.createElement("input");
            inp.style.display = "none";
            inp.type = "file";
            inp.addEventListener("change", e => {
                var reader = new FileReader();
                reader.addEventListener("loadend", e => {
                    // TODO Name parsing is really fragile
                    loadPoster(reader.result, inp.files[0].name.slice(0, -5).toLowerCase());
                    document.body.removeChild(inp);
                });
                reader.readAsText(inp.files[0]);
            });

            document.body.appendChild(inp);
            inp.click();
        });

        // Save button
        document.getElementById("save").addEventListener("click", e => {
            var clone = pdoc.documentElement.cloneNode(true);
            // FIXME this doesn't remove everything
            var instrumentations = clone.getElementsByClassName("postly--instrumentation");
            for (var i = 0; i < instrumentations.length; i++) {
                instrumentations[i].parentNode.removeChild(instrumentations[i]);
            }

            var blob = new Blob([clone.outerHTML], {type: "text/html"});
            var url = URL.createObjectURL(blob);

            var a = document.createElement("a");
            a.style.display = "none";
            a.download = document.getElementById("title").textContent.toLowerCase() + ".html";
            a.href = url;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        });

        // Print button
        document.getElementById("print").addEventListener("click", e => document.getElementById("poster").contentWindow.print());

        //-------------------
        // Dragging Handlers 
        //-------------------
        var draggingBox = null;

        function dragBoxStart(evt) {
            // XXX A little fragile
            var box = evt.target.parentNode.parentNode;
            draggingBox = box;
            evt.dataTransfer.setData("text/html", box.outerHTML);
            evt.dataTransfer.effectAllowed = "move";
            evt.dataTransfer.setDragImage(box, 0, 0);
            box.classList.add("dragging");
        }

        function dragBoxEnd(evt) {
            var box = draggingBox;
            box.classList.remove("dragging");
            draggingBox = null;
        }

        function dragColumnEnter(evt) {
            if (evt.target.classList.contains("postly--column")) {
                console.log("enter", evt);
            }
        }

        function dragColumnLeave(evt) {
            if (evt.target.classList.contains("postly--column")) {
                console.log("leave", evt); 
            }
        }

        function dragColumnOver(evt) {

        }

        //--------------------
        // Add instrumentation
        //---------------------
        function addColumnInstrumentation(column) {
            column.addEventListener("dragenter", dragColumnEnter);
            column.addEventListener("dragover", dragColumnOver);
            column.addEventListener("dragleave", dragColumnLeave);
        }

        // Function that adds instrumentation to a box
        function addBoxInstrumentation(box) {
            var dragHandle = pdoc.createElement("i");
            dragHandle.classList.add("material-icons", "postly--instrumentation", "postly--drag-handle");
            dragHandle.draggable = true;
            dragHandle.addEventListener("dragstart", dragBoxStart);
            dragHandle.addEventListener("dragend", dragBoxEnd);
            dragHandle.appendChild(pdoc.createTextNode("drag_handle"));

            var deleteHandle = pdoc.createElement("i");
            deleteHandle.classList.add("material-icons", "postly--instrumentation", "postly--delete-handle");
            deleteHandle.addEventListener("click", e => box.parentNode.removeChild(box));
            deleteHandle.appendChild(pdoc.createTextNode("delete"));

            var headerDiv = box.querySelector(".postly--box-header");
            var headerTitle = headerDiv.childNodes[0];
            headerDiv.insertBefore(dragHandle, headerTitle);
            headerDiv.insertBefore(deleteHandle, headerTitle);
        }

        // Add event listener for "add box" button
        document.getElementById("add-element").addEventListener("click", e => {
            var box = pdoc.createElement("div");
            box.classList.add("postly--box");

            var headerDiv = pdoc.createElement("div");
            box.appendChild(headerDiv);
            headerDiv.classList.add("postly--box-header");

            var header = pdoc.createElement("h3");
            headerDiv.appendChild(header);
            header.classList.add("postly--box-title");
            header.appendChild(pdoc.createTextNode("Box Title"));

            var content = pdoc.createElement("div");
            box.appendChild(content);
            content.classList.add("postly--box-content");
            content.appendChild(pdoc.createTextNode("Box Content"));

            // Add instrumentation
            addBoxInstrumentation(box);

            // XXX Currently adds to end of last column
            var column = pdoc.querySelector(".postly--column:last-child");
            column.appendChild(box);
        });


        // Load blank poster at beginning
        newPoster();
    });
});
