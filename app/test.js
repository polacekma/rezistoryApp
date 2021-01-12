
var objekty = [];
var isMouseDown = false;
var canvasWidth = 800;
var canvasHeight = 400;
// Přesun výchozích prvků
var dragOriginalx = null;
var dragOriginaly = null;

// Prvek a kabely - zatažení
var draggedObject = null;

// indikace blízkosti kurzoru
var highlightedNode = null;

var dragOffsetx = null;
var dragOffsety = null;

// Pozice myši při výchozí pozici
var dragStartx = null;
var dragStarty = null;

var blackLeadObj = null;
var redLeadObj = null;
var bBothLeadsConnected = false;

var previousSnapPosition = '';

// Prvek a kabely
var selectedObject = null;
var tentativelySelectedObject = null;
var bDraggedOutsideThreshold = false;

function nodeToStr(n) {
    return n[0] + ',' + n[1];
}

// Sondy Multimetru
var uhel_sondy = Math.PI / 12;
var delka_sondy_jehla = 40;
var sonda_sirka = 10;
var sonda_delka = 240;
function Sonda(xpos, ypos, black) {
    this.xpos = xpos;
    this.ypos = ypos;
    this.black = black;
}

//funkce pro vykreslení měřících sond
function sonda_pohyb(ctx) {
    var x = this.xpos;
    var y = this.ypos;
    ctx.save();
    // Postavení měřících sond
    ctx.translate(x, y);
    ctx.rotate(uhel_sondy);
    ctx.translate(-x, -y);
    ctx.strokeStyle = '#aaa';
    ctx.beginPath();
    ctx.moveTo(x, y);
//výpln měřících sond a jejich barva
    var lineargradient = ctx.createLinearGradient(x - 8, y, x + 8, y);
    if (this.black) {
        lineargradient.addColorStop(0, '#999');
        lineargradient.addColorStop(1, '#222');
    } else {
        lineargradient.addColorStop(0, '#d00');
        lineargradient.addColorStop(1, '#600');
    }
    ctx.fillStyle = lineargradient;
    if (this.black) {
        ctx.lineTo(x, y + delka_sondy_jehla);
        ctx.fillRect(x - sonda_sirka, y + delka_sondy_jehla, 2 * sonda_sirka, sonda_delka);
    } else {
        ctx.lineTo(x, y - delka_sondy_jehla);
        ctx.fillRect(x - sonda_sirka, y - delka_sondy_jehla - sonda_delka, 2 * sonda_sirka, sonda_delka);
    }
    ctx.stroke();
    ctx.restore();
}
function sonda_getType() {
    return 'lead';
}
function sonda_getNodes() {
    return [[this.xpos, this.ypos]];
}
function sonda_isClickInArea(x, y) {
    // oblast vodiče = obdélník zarovnaný s osou otočený o uhel_sondy.
    var dx = x - this.xpos;
    var dy = y - this.ypos;

    var tx = Math.cos(uhel_sondy) * dx + Math.sin(uhel_sondy) * dy;
    var ty = Math.sin(uhel_sondy) * dx - Math.cos(uhel_sondy) * dy;

    if (tx < -sonda_sirka || tx > sonda_sirka) {
        return false;
    }
    if (this.black) {
        return ty < -5 && ty > -(sonda_delka + delka_sondy_jehla);
    } else {
        return ty > 5 && ty < (sonda_delka + delka_sondy_jehla);
    }
}
//test připojení sondy na součástku
function sonda_isGraphElement() {
    return true;
}
function sonda_getMessage() {
    if (bBothLeadsConnected) {
        return 'Připojeno';
    } else {
        return 'Pomocí měřícíh sond zjistěte napětí na libovolných částech obvodu';
    }
}
Sonda.prototype.draw = sonda_pohyb;
Sonda.prototype.getType = sonda_getType;
Sonda.prototype.getNodes = sonda_getNodes;
Sonda.prototype.isClickInArea = sonda_isClickInArea;
Sonda.prototype.isGraphElement = sonda_isGraphElement;
Sonda.prototype.isLead = true;
Sonda.prototype.getMessage = sonda_getMessage;

// Objekt - rezistor
function Rezistor(xpos, ypos, value, template) {
    this.xpos = xpos;
    this.ypos = ypos;
    this.value = value;
    this.isTemplate = template;
}
//vykreslení rezistoru
function rezistor_vykreslení(ctx) {
    var x = this.xpos;
    var y = this.ypos;
    ctx.beginPath();
    ctx.moveTo(x + 30, y);
    ctx.lineTo(x + 30, y + 9);
    ctx.lineTo(x + 22, y + 15);
    ctx.lineTo(x + 38, y + 21);
    ctx.lineTo(x + 22, y + 27);
    ctx.lineTo(x + 38, y + 33);
    ctx.lineTo(x + 22, y + 39);
    ctx.lineTo(x + 38, y + 45);
    ctx.lineTo(x + 30, y + 51);
    ctx.lineTo(x + 30, y + 60);
    ctx.stroke();


    // if canvas API pracuje + výpis hodnoty rezistoru
    if (ctx.textBaseline) {
        ctx.font = "13pt serif";
        ctx.textBaseline = "middle";
        ctx.fillText(this.value + " \u03a9 ", x + 45, y + 30);
    }
}
function rezistor_getValue() {
    return this.value;
}
function rezistor_getType() {
    return 'rezistor';
}
function rezistor_clone(x, y) {
    return new Rezistor(x, y, 1, false);
}

function rezistor_getNodes() {
    if (this.isTemplate) {
        return [];
    } else {
        return [[this.xpos + 30, this.ypos], [this.xpos + 30, this.ypos + 60]];
    }
}
function rezistor_isClickInArea(x, y) {
    return normSquared(x - (this.xpos + 30), y - (this.ypos + 30)) < 20 * 20;
}
function rezistor_isGraphElement() {
    return !this.isTemplate;
}
function rezistor_getMessage() {
    if (!this.isTemplate) {
        return this.value + " &Omega; rezistor";
    } else {
        return "Tažením přidáš rezistor";
    }
}
Rezistor.prototype.draw = rezistor_vykreslení;
Rezistor.prototype.clone = rezistor_clone;
Rezistor.prototype.getType = rezistor_getType;
Rezistor.prototype.getValue = rezistor_getValue;
Rezistor.prototype.getNodes = rezistor_getNodes;
Rezistor.prototype.isClickInArea = rezistor_isClickInArea;
Rezistor.prototype.isGraphElement = rezistor_isGraphElement;
Rezistor.prototype.getMessage = rezistor_getMessage;

// Zdroj napětí - vykreslení a jeho parametry
function ZdrojNapeti(xpos, ypos, value, template) {
    this.xpos = xpos;
    this.ypos = ypos;
    this.value = value;
    this.isTemplate = template;
}
//funkce pro vykreslení Zdroje
function ZdrojNapeti_draw(ctx) {
    var x = this.xpos;
    var y = this.ypos;
    ctx.beginPath();
    ctx.moveTo(x + 30, y);
    ctx.lineTo(x + 30, y + 27);
    ctx.moveTo(x + 15, y + 27);
    ctx.lineTo(x + 45, y + 27);
    ctx.moveTo(x + 22, y + 33);
    ctx.lineTo(x + 38, y + 33);
    ctx.moveTo(x + 30, y + 33);
    ctx.lineTo(x + 30, y + 60);
    ctx.stroke();

    // Hodnoty zobrazené vedle značky
    if (ctx.textBaseline) {
        ctx.font = "12pt serif";
        ctx.textBaseline = "middle";
        ctx.fillText(this.value + " V", x + 45, y + 30);
    }
}
function ZdrojNapeti_getValue() {
    return this.value;
}
function ZdrojNapeti_getType() {
    return 'Zdroj Napětí';
}

function ZdrojNapeti_clone(x, y) {
    return new ZdrojNapeti(x, y, 5, false);
}

function ZdrojNapeti_getNodes() {
    if (this.isTemplate) {
        return [];
    } else {
        return [[this.xpos + 30, this.ypos + 60], [this.xpos + 30, this.ypos]];
    }
}
function ZdrojNapeti_isClickInArea(x, y) {
    return normSquared(x - (this.xpos + 30), y - (this.ypos + 30)) < 20 * 20;
}
function ZdrojNapeti_isGraphElement() {
    return !this.isTemplate;
}
function ZdrojNapeti_getMessage() {
    if (!this.isTemplate) {
        return this.value + " V source";
    } else {
        return "Drag to add a voltage source.";
    }
}
ZdrojNapeti.prototype.draw = ZdrojNapeti_draw;
ZdrojNapeti.prototype.clone = ZdrojNapeti_clone;
ZdrojNapeti.prototype.getType = ZdrojNapeti_getType;
ZdrojNapeti.prototype.getValue = ZdrojNapeti_getValue;
ZdrojNapeti.prototype.getNodes = ZdrojNapeti_getNodes;
ZdrojNapeti.prototype.isClickInArea = ZdrojNapeti_isClickInArea;
ZdrojNapeti.prototype.isGraphElement = ZdrojNapeti_isGraphElement;
ZdrojNapeti.prototype.getMessage = ZdrojNapeti_getMessage;

// Spojení / Kabely
function Kabel(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
}
function kabeldraw(ctx) {
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.stroke();
}
function kabelgetType() {
    return 'Kabel';
}
function kabelgetNodes() {
    return [[this.x1, this.y1], [this.x2, this.y2]];
}
function kabelisClickInArea(x, y) {
    var d2 = minimumDistanceSquaredToSegment(
        x, y, this.x1, this.y1, this.x2, this.y2);
    return d2 < 10 * 10;
}
function kabelisGraphElement(x, y) {
    return true;
}
function kabelgetOtherNode(n) {
    for (var nodeIndex in this.getNodes()) {
        var m = this.getNodes[nodeIndex];
        if (nodeToStr(m) != n) {
            return nodeToStr(m);
        }
    }
    return null;
}
Kabel.prototype.draw = kabeldraw;
Kabel.prototype.getType = kabelgetType;
Kabel.prototype.getNodes = kabelgetNodes;
Kabel.prototype.isClickInArea = kabelisClickInArea;
Kabel.prototype.isGraphElement = kabelisGraphElement;
Kabel.prototype.getOtherNode = kabelgetOtherNode;
Kabel.prototype.isWire = true;

// Zbarvení prvků podle zapojení

function redraw() {
    var canvas = document.getElementById('circarea');
    if (!canvas.getContext) {
        return;
    }
    var ctx = canvas.getContext('2d');

    // Clear the canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Vykreslení všech placed objekty
    for (var objIndex in objekty) {
        var obj = objekty[objIndex];
        // Vykreslené objekty jsou zelené - po vytažení černé - vybrané zčervenají
        if (obj.isTemplate) {
            ctx.lineWidth = 1.0;
            ctx.strokeStyle = "rgb(0, 160, 0)";
        } else if (obj === selectedObject) {
            ctx.lineWidth = 3.0;
            ctx.strokeStyle = "rgb(180, 0, 0)";
        } else {
            ctx.lineWidth = 1.0;
            ctx.strokeStyle = "rgb(0, 0, 0)";
        }
        obj.draw(ctx);
    }

    // Vykreslení kruhu pro zvýraznění místa spoje
    if (highlightedNode !== null) {
        ctx.beginPath();
        ctx.arc(highlightedNode[0], highlightedNode[1], 3, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
    }
}

function setCanvasDimensions(w, h) {
    document.getElementById('leadoutput').style.left = (w - 310) + 'px';
    document.getElementById('circarea').width = w;
    document.getElementById('circarea').height = h;
    canvasWidth = w;
    canvasHeight = h;
}

// Velikost pracovní plochy
function velikost_plochy() {
    setCanvasDimensions(window.innerWidth - 8, window.innerHeight - 45);

    redraw();
}

//Funkce pro přichytávání sond a ostatních objektů k nejbližšímu spoji

function findNejblizsiSondu(xpos, ypos, excludeDragged) {
    var nejblizsiPrvek = null;
    for (var objIndex in objekty) {
        var obj = objekty[objIndex];
        // Don't try to snap to a node on an object that is being moved
        if (excludeDragged && (obj === draggedObject)) {
            continue;
        }
        for (var nodeIndex in obj.getNodes()) {
            var node = obj.getNodes()[nodeIndex];
            if (normSquared(xpos - node[0], ypos - node[1]) < 10 * 10) {
                nejblizsiPrvek = node;
            }
        }
    }
    return nejblizsiPrvek;
}

// Vrati objekt, který je pod kurzorem, nebo null, pokud takový neexistuje

function findNejblizsiObjekt(xpos, ypos) {
    var nejblizsiObjekt = null;
    for (var objIndex in objekty) {
        var obj = objekty[objIndex];
        if (obj.isClickInArea(xpos, ypos)) {
            nejblizsiObjekt = obj;
        }
    }
    return nejblizsiObjekt;
}

// Vrátí název proměnné spojené s napětím.
function voltageVariable(node) {
    return 'v[' + nodeToStr(node) + ']';
}

// Simulční logika ----------------------------------

// Initialize everything.
function init() {
    velikost_plochy();

    // Umístení objekty.
    var horizLeadMargin = 75;
    var vertLeadMargin = 75;
    blackLeadObj = new Sonda(horizLeadMargin, canvasHeight - vertLeadMargin, true);
    redLeadObj = new Sonda(canvasWidth - horizLeadMargin - 30, vertLeadMargin, false);
    objekty.push(blackLeadObj);
    objekty.push(redLeadObj);

    //hodnoty zdroje a rezistoru

    objekty.push(new ZdrojNapeti(0, 0, 5, true));
    objekty.push(new Rezistor(60, 0, 1, true));


    printMessage("Ahoj!", true);

    redraw();
}

function simulateCircuit(debug) {
// Zpracujte data výkresu k přidružení souřadnic x-y k uzlům
    // prvky obvodu.

    // Určete, které uzly sousedí s kterými prvky.

    // asociativní pole mapující s řetězci uzlu na pole
    // prvky, které se dotýkají daného uzlu.


    var nodes = [];
    // prvky v poli (rezistor apod)
    var placedObjects = [];

    for (var objIndex in objekty) {
        var obj = objekty[objIndex];
        if (!obj.isGraphElement() || obj.isLead) {
            continue;
        }
        placedObjects.push(obj);
        for (var nodeIndex in obj.getNodes()) {
            var node = obj.getNodes()[nodeIndex];
            // Put all the distinct nodes in a hashtable.
            var nodeStr = nodeToStr(node);
            if (!nodes[nodeStr]) {
                nodes[nodeStr] = [];
            }
            nodes[nodeStr].push(obj);
        }
    }

    // Rozhodnutí o zapojení objektů v obvodu
    var redLeadConnected = false;
    var blackLeadConnected = false;
    for (var nodeStr in nodes) {
        if (nodeStr == nodeToStr(redLeadObj.getNodes()[0])) {
            redLeadConnected = true;
        }
        if (nodeStr == nodeToStr(blackLeadObj.getNodes()[0])) {
            blackLeadConnected = true;
        }
    }
    bBothLeadsConnected = (redLeadConnected && blackLeadConnected) ||
        nodeToStr(redLeadObj.getNodes()[0]) == nodeToStr(blackLeadObj.getNodes()[0]);

    // Pokud jsou zapojené vypočítej hodnoty zapojeného obvodu

    if (bBothLeadsConnected) {
        var system = [];

        // Na každý uzel napiš rovnici.
        for (var nstr in nodes) {
            var orientations = [];
            var currents = [];
            // zjistit objekty v uzlu spojené
            for (var objIndex in nodes[nstr]) {
                var obj = nodes[nstr][objIndex];
                //K jedinečnému pojmenování index objektu v umístilObjekty
                //         // přidružená aktuální proměnná
                //
                var objectId = placedObjects.indexOf(obj);
                if (objectId > -1) {
                    //Orientace zapojení
                    orientations.push((nstr == nodeToStr(obj.getNodes()[0])) ? 1 : -1);
                    currents.push('i[' + objectId + ']');
                }
            }
            // sum_currents = 0 pokud je obvod spravně
            system.push(new AffineExpression(orientations, currents, 0));
        }

        //V výpočet.
        for (var objectId in placedObjects) {
            var obj = placedObjects[objectId];
            nodes = obj.getNodes();
            var node1name = voltageVariable(nodes[0]);
            var node2name = voltageVariable(nodes[1]);
            if (obj.getType() == 'resistor') {
                var currentname = 'i[' + objectId + ']';
                // V1 - V2 - R i == 0
                system.push(
                    new AffineExpression([1, -1, -obj.getValue()],
                        [node1name, node2name, currentname],
                        0));
            } else if (obj.getType() == 'wire') {
                // V1 == V2
                system.push(new AffineExpression([1, -1], [node1name, node2name], 0));
            } else if (obj.getType() == 'voltagesource') {
                // V1 - V2 == V_s
                system.push(new AffineExpression([1, -1],
                    [node1name, node2name],
                    obj.getValue()));
            }
        }

        // - zápornou sodnu
        var blackLeadVoltageName = voltageVariable(blackLeadObj.getNodes()[0]);
        system.push(new AffineExpression([1], [blackLeadVoltageName], 0));
//Debug výstup
        if (debug) {
            var debugOutputStr = "";
            for (var exprIndex in system) {
                debugOutputStr = debugOutputStr + system[exprIndex].toString() + "; ";
            }
            printMessage(debugOutputStr);
        }

        // Zobrazení napětí Voltmetru / naměřené na sondách
        var napetiMsg;
        try {
            var soln = solveLinearSystem(system);
            var v = soln[voltageVariable(redLeadObj.getNodes()[0])];
            if (isNaN(v)) {
                napetiMsg = '<em>v</em><sub>+</sub> = ?? (null)';
            } else {
                napetiMsg = '<em>v</em><sub>+</sub> = ' + v.toPrecision(6) + ' V';
            }
        } catch (e) {
            if (e.message == 'nestálý nebo rozpojený') {
                napetiMsg = '<em>v</em><sub>+</sub> = ?? (short circuit?)';
            } else {
                throw e;
            }
        }
        printOutput(napetiMsg);
    } else {
        printOutput('<em>v</em><sub>+</sub> = ?? (null)');
    }
}

// Eventy -------------------------------------------------------------

// Ovládání myší
function md(e) {
    isMouseDown = true;

    var cursorX = e.clientX - e.target.offsetLeft;
    var cursorY = e.clientY - e.target.offsetTop;
    dragStartx = cursorX;
    dragStarty = cursorY;

    // If the selected element is a wire and we are near its endpoints, allow
    // dragging by the endpoints.
    if (selectedObject !== null && selectedObject.isWire) {
        var nodes = selectedObject.getNodes();
        for (var nodeIndex in nodes) {
            var node = nodes[nodeIndex];
            if (normSquared(cursorX - node[0], cursorY - node[1]) < 10 * 10) {
                draggedObject = selectedObject;
                if (node === nodes[0]) {
                    // Switch the endpoints of the segment, because code in mm
                    // assumes we're dragging by the second endpoint.
                    var tmp_coord_x = draggedObject.x1;
                    draggedObject.x1 = draggedObject.x2;
                    draggedObject.x2 = tmp_coord_x;
                    var tmp_coord_y = draggedObject.y1;
                    draggedObject.y1 = draggedObject.y2;
                    draggedObject.y2 = tmp_coord_y;
                }
                return;
            }
        }
    }

    // Mark an object for possible drag or selection if the cursor is close
    // enough to the center of it. Dragging occurs if the cursor moves outside
    // a given radius.
    var nejblizsiSonda = findNejblizsiSondu(cursorX, cursorY, false);
    var nejblizsiObjekt = findNejblizsiObjekt(cursorX, cursorY);

    if (nejblizsiObjekt !== null && !(nejblizsiObjekt.isWire && nejblizsiSonda !== null)) {
        tentativelySelectedObject = nejblizsiObjekt;
        bDraggedOutsideThreshold = false;
        dragOffsetx = nejblizsiObjekt.xpos - cursorX;
        dragOffsety = nejblizsiObjekt.ypos - cursorY;
        dragOriginalx = nejblizsiObjekt.xpos;
        dragOriginaly = nejblizsiObjekt.ypos;
    } else if (nejblizsiSonda !== null) {
        // If we're near an endpoint, create a new wire starting there.
        draggedObject = new Kabel(nejblizsiSonda[0], nejblizsiSonda[1],
            nejblizsiSonda[0], nejblizsiSonda[1]);
        objekty.push(draggedObject);
    } else {
        // Otherwise, deselect all objekty.
        selectedObject = null;
        tentativelySelectedObject = null;
    }

    redraw();
}

// Handle a mouseup event.
function mu(e) {
    isMouseDown = false;

    // Select an object if the mouse has not moved far since the mousedown.
    if (tentativelySelectedObject !== null && !bDraggedOutsideThreshold) {
        selectedObject = tentativelySelectedObject;
    }
    // If we were dragging a template, restore its original position.
    if (draggedObject !== null && draggedObject.isTemplate) {
        draggedObject.xpos = dragOriginalx;
        draggedObject.ypos = dragOriginaly;
    }
    draggedObject = null;

    redraw();
}

// Handle a mousemove event.
function mm(e) {
    var cursorX = e.clientX - e.target.offsetLeft;
    var cursorY = e.clientY - e.target.offsetTop;

    var needsRedraw = false;

    // Update the mouseover hints as necessary.
    var nearestObject = findNejblizsiObjekt(cursorX, cursorY);
    var nearbyNode = null;
    if (nearestObject !== null && nearestObject.getMessage) {
        // If we're over a real element, display the tooltip for that object
        // and set the hand cursor.
        printMessage(nearestObject.getMessage(), true);
        // TODO: refactor this into a separate function.
        document.getElementById('circarea').className = "clickable";
    } else {
        // Otherwise, if we're near a node, highlight that node.
        nearbyNode = findNejblizsiSondu(cursorX, cursorY, false);
        if (nearbyNode !== null) {
            document.getElementById('circarea').className = "clickable";
        } else {
            document.getElementById('circarea').className = "";
        }

        printMessage('', true);
    }
    // Check whether the highlighted node moved, and if so, force a redraw.
    if (nearbyNode != highlightedNode) {
        highlightedNode = nearbyNode;
        needsRedraw = true;
    }

    if (isMouseDown) {
        if (draggedObject === null) {
            // Initiate a drag if applicable.
            if (normSquared(cursorX - dragStartx, cursorY - dragStarty) > 5 * 5) {
                if (tentativelySelectedObject !== null &&
                    !tentativelySelectedObject.isWire) {
                    draggedObject = tentativelySelectedObject;
                }
                bDraggedOutsideThreshold = true;
            }
        } else {
            var bRecompute = false;

            if (draggedObject.isTemplate) {
                // If we've dragged a template sufficiently far from its original
                // position, clone it. Otherwise, just move the template.
                if (normSquared(cursorX - dragStartx, cursorY - dragStarty) < 60 * 60) {
                    draggedObject.xpos = cursorX + dragOffsetx;
                    draggedObject.ypos = cursorY + dragOffsety;
                } else {
                    var newObj = draggedObject.clone(
                        cursorX + dragOffsetx, cursorY + dragOffsety);
                    draggedObject.xpos = dragOriginalx;
                    draggedObject.ypos = dragOriginaly;
                    draggedObject = newObj;
                    objekty.push(newObj);
                    bRecompute = true;
                }
            } else {
                var snapPosition;
                if (draggedObject.isWire) {
                    // Snap the endpoint being dragged to a nearby node, if possible.
                    var wireSnapTargetNode = findNejblizsiSondu(cursorX, cursorY, true);
                    if (wireSnapTargetNode !== null) {
                        draggedObject.x2 = wireSnapTargetNode[0];
                        draggedObject.y2 = wireSnapTargetNode[1];
                        snapPosition = nodeToStr(wireSnapTargetNode);
                    } else {
                        draggedObject.x2 = cursorX;
                        draggedObject.y2 = cursorY;
                        snapPosition = null;
                    }
                } else {
                    // Snap some node on this object to a nearby node, if possible
                    var nodes = draggedObject.getNodes();
                    var snapped = false;
                    for (var nodeIndex in nodes) {
                        var node = nodes[nodeIndex];
                        var nodeRelx = node[0] - draggedObject.xpos;
                        var nodeRely = node[1] - draggedObject.ypos;
                        var objectSnapTargetNode = findNejblizsiSondu(
                            cursorX + dragOffsetx + nodeRelx,
                            cursorY + dragOffsety + nodeRely,
                            true);
                        if (objectSnapTargetNode !== null) {
                            draggedObject.xpos = objectSnapTargetNode[0] - nodeRelx;
                            draggedObject.ypos = objectSnapTargetNode[1] - nodeRely;
                            snapPosition = objectSnapTargetNode[0] + ',' +
                                objectSnapTargetNode[1] + ',' + nodeRelx + ',' + nodeRely;
                            snapped = true;
                            break;
                        }
                    }
                    if (!snapped) {
                        draggedObject.xpos = cursorX + dragOffsetx;
                        draggedObject.ypos = cursorY + dragOffsety;
                        snapPosition = null;
                    }
                }
                bRecompute = (snapPosition != previousSnapPosition);
                previousSnapPosition = snapPosition;
            }

            if (bRecompute) {
                simulateCircuit(false);
            }
        }

        needsRedraw = true;
    }

    if (needsRedraw) {
        redraw();
    }
}

function mover(e) { }

function mout(e) { }

function kdown(e) {
    // Delete selected element when DEL is pressed.
    if (e.keyCode == 46) {
        if (selectedObject !== null && selectedObject.isGraphElement() &&
            !selectedObject.isLead) {
            objekty.splice(objekty.indexOf(selectedObject), 1);
            selectedObject = null;
            simulateCircuit(false);
            redraw();
        }
        return false;
    } else if (e.keyCode == 8 || (e.keyCode >= 48 && e.keyCode <= 57)) {
        if (selectedObject !== null && selectedObject.isGraphElement() &&
            !selectedObject.isLead) {
            if (e.keyCode == 8) {
                // Backspace
                selectedObject.value = Math.floor(selectedObject.value / 10);
                redraw();
            } else {
                // Some digit
                var digit = e.keyCode - 48;
                selectedObject.value = selectedObject.value * 10 + digit;
                redraw();
            }
            printMessage(selectedObject.getMessage(), true);
            simulateCircuit(false);
        }
        return false;
    }
}

function selectstart(e) {

    return false;
}
