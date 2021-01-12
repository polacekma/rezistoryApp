var isMouseDown = false;
var canvasWidth = 800;
var canvasHeight = 400;

// The element or wire with focus
var selectedObject = null;
var tentativelySelectedObject = null;
var bDraggedOutsideThreshold = false;
// The element or wire being dragged
var draggedObject = null;

// Node that the cursor is near, or null
var highlightedNode = null;

var dragOffsetx = null;
var dragOffsety = null;
// Original coordinates of thing being dragged
var dragOriginalx = null;
var dragOriginaly = null;
// Cursor position at drag start
var dragStartx = null;
var dragStarty = null;

var blackLeadObj = null;
var redLeadObj = null;
var bBothLeadsConnected = false;

var previousSnapPosition = '';

var objects = [];