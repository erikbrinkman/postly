"use strict";
window.addEventListener("load", () => {
    document.querySelector("#poster").contentWindow.addEventListener("load", () => {

        // Poster Document
        var pdoc = document.querySelector("#poster").contentDocument;

        // Close drawer when icon is clicked
        document.querySelector("#close-drawer")
            .addEventListener("click", e => document.querySelector(".mdl-layout__drawer").classList.remove("is-visible"));

        // New poster 
        function newPoster() {
            // TODO Ideally this html is loaded once, but I can't figure out make
            // new reliably wait on loadend event if triggered
            var loadNew = new XMLHttpRequest();
            loadNew.open('GET', 'new.html');
            loadNew.addEventListener('loadend', () => {
                loadPoster(loadNew.responseText, 'postly');
            });
            loadNew.send();
        }

        // New poster button
        document.querySelector("#new").addEventListener("click", e => {
            if (confirm("Do you want to delete the current poster?")) {
                newPoster();
            }
        });

        // Handle actual file load
        // Content is a string of the content, name is the file name
        function loadPoster(content, name) {
            var nodes = new DOMParser().parseFromString(content,  "text/html");

            // Add global instrumentation
            var firstHead = nodes.head.childNodes[0];
            var iconFont = document.createElement("link");
            iconFont.classList.add("postly--instrumentation");
            iconFont.href = "//fonts.googleapis.com/icon?family=Material+Icons";
            iconFont.rel = "stylesheet";
            nodes.head.insertBefore(iconFont, firstHead);
            var instrumentationStyle = document.createElement("link");
            instrumentationStyle.classList.add("postly--instrumentation");
            instrumentationStyle.href = "instrumentation.css";
            instrumentationStyle.rel = "stylesheet";
            nodes.head.insertBefore(instrumentationStyle, firstHead);

            // TODO There may be a more efficient way to move the objects
            // rather than converting to and from a string
            pdoc.documentElement.innerHTML = nodes.documentElement.innerHTML;

            // Add title and author instrumentation

            // Add element level instrumentation
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
            var instrumentations = clone.querySelectorAll(".postly--instrumentation");
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

        // About button
        document.querySelector("#about").addEventListener("click", e => open("//github.com/erikbrinkman/postly"));

        /*-------------------
         * Dragging Handlers
         *-------------------
         *
         * Due to some idiosyncrasies with chrome, this takes the dragged div,
         * elevates it to z = 2, then places overlays at z = 1 for all of the
         * columns. A copy of the div is made which moves around to indicate
         * the new position, or moved if within the same column.
         */

        var draggingBox = null,
            dummyBox = null;

        function dragBoxStart(evt) {
            draggingBox = evt.target.parentNode.parentNode.parentNode;
            dummyBox = draggingBox.cloneNode(true);

            draggingBox.classList.add("postly--dragging");
            dummyBox.classList.add("postly--dummy-box");
            
            evt.dataTransfer.setData("text/html", draggingBox.outerHTML);
            evt.dataTransfer.effectAllowed = "move";
            evt.dataTransfer.setDragImage(draggingBox, 0, 0);

            draggingBox.addEventListener("dragenter", dragBoxEnter);
            var columns = pdoc.getElementsByClassName("postly--column");
            for (var i = 0; i < columns.length; i++) {
                var overlay = document.createElement("div");
                overlay.classList.add("postly--column-overlay");
                columns[i].insertBefore(overlay, columns[i].childNodes[0]);

                overlay.addEventListener("dragenter", dragColumnOverlayEnter);
                overlay.addEventListener("dragover", dragColumnOverlayOver);
            }
        }

        function dragBoxEnd(evt) {
            var newColumn = dummyBox.parentNode;
            if (newColumn) {
                newColumn.insertBefore(draggingBox, dummyBox);
                newColumn.removeChild(dummyBox);
            }
            draggingBox.removeEventListener("dragenter", dragBoxEnter);
            draggingBox.classList.remove("postly--dragging", "postly--dummy-box");

            var overlays = pdoc.querySelectorAll(".postly--column-overlay");
            for (var i = 0; i < overlays.length; i++) {
                overlays[i].parentNode.removeChild(overlays[i]);
            }
        }

        function dragColumnOverlayEnter(evt) {
            var column = evt.target.parentNode;
            if (column === draggingBox.parentNode) {
                if (dummyBox.parentNode) {
                    dummyBox.parentNode.removeChild(dummyBox);
                }
                draggingBox.classList.add("postly--dummy-box");
            } else {
                draggingBox.classList.remove("postly--dummy-box");
                column.appendChild(dummyBox);
            }
        }

        function dragBoxEnter(evt) {
            if (dummyBox.parentNode) {
                dummyBox.parentNode.removeChild(dummyBox);
            }
            draggingBox.classList.add("postly--dummy-box");
        }

        function dragColumnOverlayOver(evt) {
            var column = evt.target.parentNode,
                divs = column.childNodes,
                currentBeforeOrAfter = -1,
                dummyDiv = null,
                closestDiv = null,
                closestDist = Infinity,
                closestBeforeOrAfter = -1;
            for (var i = 0; i < divs.length; i++) {
                if (divs[i].nodeType == 1 && divs[i].classList.contains("postly--box")) {
                    var rect = divs[i].getBoundingClientRect();
                    var dist = Math.min(Math.abs(rect.top - evt.clientY), Math.abs(rect.bottom - evt.clientY));
                    if (divs[i].classList.contains("postly--dummy-box")) {
                        currentBeforeOrAfter = 0;
                        dummyDiv = divs[i];
                    } else if (currentBeforeOrAfter === 0) {
                        currentBeforeOrAfter = 1;
                    }

                    if (dist < closestDist) {
                        closestDist = dist;
                        closestDiv = divs[i];
                        closestBeforeOrAfter = currentBeforeOrAfter;
                    }
                }
            }
            if (closestBeforeOrAfter > 0) {
                column.insertBefore(dummyDiv, closestDiv.nextSibling);
            } else if (closestBeforeOrAfter < 0) {
                column.insertBefore(dummyDiv, closestDiv);
            }
        }

        /*----------------------------
         * Instrumentation for Editing
         *-----------------------------
         */

        var converter = new showdown.Converter({
            noHeaderId: true,
            headerLevelStart: 4,
            tables: true
        });

        function renderTitleSource(source) {
            var render = source.parentNode.querySelector(".postly--box-title");
            source.setAttribute("value", source.value);
            render.innerHTML = "";
            render.appendChild(document.createTextNode(source.value));
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, render]);
            source.style.display = "none";
        }

        function renderSource(source) {
            var value = source.value;
            // TODO Intercept images here to load
            var render = source.parentNode.querySelector(".postly--box-content-render");
            source.innerHTML = "";
            source.appendChild(document.createTextNode(value));
            render.innerHTML = converter.makeHtml(value);
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, render]);
            source.style.display = "none";
        }

        // Function that adds instrumentation to a box
        function addBoxInstrumentation(box) {
            var interactionBox = document.createElement("div");
            interactionBox.classList.add("postly--box-interaction", "postly--instrumentation");

            var spacer = document.createElement("div");
            interactionBox.appendChild(spacer);
            spacer.classList.add("postly--box-interaction-spacer");

            var dragHandle = document.createElement("i");
            interactionBox.appendChild(dragHandle);
            dragHandle.classList.add("material-icons", "postly--drag-handle");
            dragHandle.draggable = true;
            dragHandle.addEventListener("dragstart", dragBoxStart);
            dragHandle.addEventListener("dragend", dragBoxEnd);
            dragHandle.appendChild(document.createTextNode("drag_handle"));

            var titleSource = box.querySelector(".postly--box-title-source");
            titleSource.addEventListener("focusout", e => renderTitleSource(titleSource));
            titleSource.addEventListener("keypress", e => {
                if (e.keyIdentifier === "Enter") {
                    titleSource.blur();
                }
            });
            renderTitleSource(titleSource);

            var editHandle = document.createElement("i");
            interactionBox.appendChild(editHandle);
            editHandle.classList.add("material-icons", "postly--edit-handle");
            editHandle.addEventListener("click", e => {
                titleSource.style.display = "block";
                titleSource.focus();
            });
            editHandle.appendChild(document.createTextNode("mode_edit"));

            var deleteHandle = document.createElement("i");
            interactionBox.appendChild(deleteHandle);
            deleteHandle.classList.add("material-icons", "postly--delete-handle");
            deleteHandle.addEventListener("click", e => {
                if (confirm("Do you wish to delete this box?")) {
                    box.parentNode.removeChild(box);
                }
            });
            deleteHandle.appendChild(document.createTextNode("delete"));

            var headerDiv = box.querySelector(".postly--box-header");
            headerDiv.insertBefore(interactionBox, headerDiv.childNodes[0]);

            var source = box.querySelector(".postly--box-content-source");
            source.addEventListener("keypress", e => {
                if (e.keyIdentifier === "Enter" && e.shiftKey) {
                    e.preventDefault();
                    source.blur(); // Causes focus out render, prevents double render
                }
            });
            source.addEventListener("focusout", e => renderSource(source));
            renderSource(source);

            var contentEditOverlay = document.createElement("div");
            contentEditOverlay.classList.add("postly--content-edit-overlay", "postly--instrumentation");
            contentEditOverlay.addEventListener("click", e => {
                source.style.display = "block";
                source.focus();
            });
            var edit = document.createElement("i");
            contentEditOverlay.appendChild(edit);
            edit.classList.add("material-icons", "postly--content-edit-icon");
            edit.appendChild(document.createTextNode("mode_edit"));
            var content = box.querySelector(".postly--box-content");
            content.insertBefore(contentEditOverlay, content.childNodes[0]);
        }

        // Add event listener for "add box" button
        document.querySelector("#add-element").addEventListener("click", e => {
            var box = document.createElement("div");
            box.classList.add("postly--box");

            var headerDiv = document.createElement("div");
            box.appendChild(headerDiv);
            headerDiv.classList.add("postly--box-header");

            var headerSource = document.createElement("input");
            headerDiv.appendChild(headerSource);
            headerSource.classList.add("postly--box-title-source");
            headerSource.value = "Click to add box title";
            var header = document.createElement("h3");
            headerDiv.appendChild(header);
            header.classList.add("postly--box-title");
            header.appendChild(document.createTextNode("Box Title"));

            var content = document.createElement("div");
            box.appendChild(content);
            content.classList.add("postly--box-content");
            var source = document.createElement("textarea");
            content.appendChild(source);
            source.classList.add("postly--box-content-source");
            source.appendChild(document.createTextNode("Click to edit box markdown"));
            var render = document.createElement("div");
            content.appendChild(render);
            render.classList.add("postly--box-content-render");

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
