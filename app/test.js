
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
