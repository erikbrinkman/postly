"use strict";
window.addEventListener("load", () => {
    document.querySelector("#poster").contentWindow.addEventListener("load", () => {

        // Poster Document
        var pdoc = document.querySelector("#poster").contentDocument;

        /*----------------------------------
         * Configuration of save, load, etc
         *----------------------------------
         */

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
            var title = pdoc.querySelector(".postly--title");
            renderInline(title);
            addEditOverlay(title, "input", renderInline);
            var authors = pdoc.querySelector(".postly--authors");
            renderInline(authors);
            addEditOverlay(authors, "input", renderInline);

            // Add element level instrumentation
            var boxes = pdoc.querySelectorAll(".postly--box");
            for (var i = 0; i < boxes.length; i++) {
                addBoxInstrumentation(boxes[i]);
            }

            // Adjust css sidebar
            document.querySelector("#num-columns").value = pdoc.querySelectorAll(".postly--column").length;
        }

        // TODO Add drag and drop support: https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications#Selecting_files_using_drag_and_drop
        // Load button
        document.querySelector("#load").addEventListener("click", e => {
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
        document.querySelector("#save").addEventListener("click", e => {
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
        document.querySelector("#print").addEventListener("click", e => document.getElementById("poster").contentWindow.print());

        // About button
        document.querySelector("#about").addEventListener("click", e => open("//github.com/erikbrinkman/postly"));

        /*-----------------------------
         * Synchronization with sidebar
         *------------------------------
         */

        var numColumns = document.querySelector("#num-columns");
        numColumns.addEventListener("input", e => {
            var change = numColumns.value - pdoc.querySelectorAll(".postly--column").length;
            if (change > 0) {
                var content = pdoc.querySelector(".postly--content");
                for (var i = 0; i < change; i++) {
                    var div = document.createElement("div");
                    div.classList.add("postly--column");
                    content.appendChild(div);
                }
            } else if (change < 0) {
                var boxesToMove = pdoc.querySelectorAll(
                    ".postly--column:nth-last-child(-n+" + (-change) + ") .postly--box");
                var destinationColumn = pdoc.querySelector(
                    ".postly--column:nth-last-child(" + (-change + 1) +")");
                for (var i = 0; i < boxesToMove.length; i++) {
                    destinationColumn.appendChild(boxesToMove[i]);
                }
                
                var columnsToRemove = pdoc.querySelectorAll(
                    ".postly--column:nth-last-child(-n+" + (-change) + ")");
                for (var i = 0; i < columnsToRemove.length; i++) {
                    columnsToRemove[i].parentNode.removeChild(columnsToRemove[i]);
                }
            }
        });

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
         *
         * In general, each editable element has an extra attribute "source".
         * This contains the unadulterated text that may be edited to be
         * rendered. This text is usually piped through a markdown renderer and
         * then MathJax in order to produce the final result.
         */

        function renderInline(element) {
            element.innerHTML = "";
            element.appendChild(document.createTextNode(element.getAttribute("source")));
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
        }

        var converter = new showdown.Converter({
            noHeaderId: true,
            headerLevelStart: 4,
            tables: true
        });

        function renderMultiline(element) {
            // TODO Intercept images here to load
            element.innerHTML = converter.makeHtml(element.getAttribute("source"));
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, element]);
        }

        function genericEditHandle(element, type, callback, acceptEnter) {
            var sourceEdit = document.createElement(type);

            sourceEdit.classList.add("postly--source-edit", "postly--instrumentation");
            sourceEdit.value = element.getAttribute("source");

            sourceEdit.addEventListener("focusout", e => {
                element.setAttribute("source", sourceEdit.value || "[Empty Text]");
                sourceEdit.parentNode.removeChild(sourceEdit);
                callback(element);
            });
            sourceEdit.addEventListener("keypress", e => {
                if (e.keyIdentifier === "Enter" && (!acceptEnter || e.shiftKey)) {
                    sourceEdit.blur();
                }
            });

            element.appendChild(sourceEdit);
            sourceEdit.focus();
        }

        function addEditOverlay(element, type, callback, acceptEnter) {
            var editOverlay = document.createElement("div");
            editOverlay.classList.add("postly--edit-overlay", "postly--instrumentation");
            editOverlay.addEventListener("click", e => {
                element.removeChild(editOverlay);
                genericEditHandle(element, type, elem => {
                    callback(element);
                    addEditOverlay(element, type, callback, acceptEnter);
                }, acceptEnter);
            });

            var edit = document.createElement("i");
            edit.classList.add("material-icons");
            edit.appendChild(document.createTextNode("mode_edit"));
            editOverlay.appendChild(edit);

            element.appendChild(editOverlay);
        }

        // Function that adds instrumentation to a box
        function addBoxInstrumentation(box) {
            // Instrument Header
            var interactionBox = document.createElement("div");
            interactionBox.classList.add("postly--box-interaction", "postly--instrumentation");

            var spacer = document.createElement("div");
            spacer.classList.add("postly--box-interaction-spacer");
            interactionBox.appendChild(spacer);

            var dragHandle = document.createElement("i");
            dragHandle.classList.add("material-icons", "postly--drag-handle", "postly--box-interaction-icon");
            dragHandle.draggable = true;
            dragHandle.addEventListener("dragstart", dragBoxStart);
            dragHandle.addEventListener("dragend", dragBoxEnd);
            dragHandle.appendChild(document.createTextNode("drag_handle"));
            interactionBox.appendChild(dragHandle);

            var title = box.querySelector(".postly--box-title");
            renderInline(title);

            var editHandle = document.createElement("i");
            editHandle.classList.add("material-icons", "postly--edit-handle", "postly--box-interaction-icon");
            editHandle.addEventListener("click", e => genericEditHandle(title, "input", renderInline));
            editHandle.appendChild(document.createTextNode("mode_edit"));
            interactionBox.appendChild(editHandle);

            var deleteHandle = document.createElement("i");
            deleteHandle.classList.add("material-icons", "postly--delete-handle", "postly--box-interaction-icon");
            deleteHandle.addEventListener("click", e => {
                if (confirm("Do you wish to delete this box?")) {
                    box.parentNode.removeChild(box);
                }
            });
            deleteHandle.appendChild(document.createTextNode("delete"));
            interactionBox.appendChild(deleteHandle);

            var headerDiv = box.querySelector(".postly--box-header");
            headerDiv.insertBefore(interactionBox, headerDiv.childNodes[0]);

            // Instrument Body
            var content = box.querySelector(".postly--box-content");
            renderMultiline(content);
            addEditOverlay(content, "textarea", renderMultiline, true);
        }

        // Add event listener for "add box" button
        document.querySelector("#add-element").addEventListener("click", e => {
            var box = document.createElement("div");
            box.classList.add("postly--box");

            var headerDiv = document.createElement("div");
            headerDiv.classList.add("postly--box-header");
            box.appendChild(headerDiv);

            var header = document.createElement("h3");
            header.classList.add("postly--box-title");
            header.setAttribute("source", "Box Title");
            headerDiv.appendChild(header);

            var content = document.createElement("div");
            content.classList.add("postly--box-content");
            content.setAttribute("source", "Box Content");
            box.appendChild(content);

            // Add instrumentation
            addBoxInstrumentation(box);

            // Currently adds to end of last column
            pdoc.querySelector(".postly--column:last-child").appendChild(box);
        });


        // Load blank poster at beginning
        newPoster();
    });
});
