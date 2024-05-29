var dragX, dragY;
var puzzles;
var cells;

var trajectoryData = [];
var cellData = [];

var startTimer;

var sunflower;
let puzzleImg;

var xOffset = 0.0;
var yOffset = 0.0;

var trajectoryID = 0.0;

var dragged = -1;

var a;
var canvasDiv, mywidth, myHeight, myCanvas;
var drawLeftPadding, drawTopPadding, drawDrawAreaWidth, drawDrawAreaHeight;

function preload() {
    sunflower = loadImage('tint1.jpg');
}

function setup() {
    startTimer = Date.now();

    canvasDiv = document.getElementById('myDiv');
    mywidth = canvasDiv.offsetWidth;
    myHeight = canvasDiv.offsetHeight;
    myCanvas = createCanvas(mywidth, 600);
    myCanvas.parent("myDiv");

    image(sunflower, 0, 0);

    cursor(HAND);

    var numPuzzles = 5 * 5;
    var numCells = numPuzzles;
    var numPuzzleImgs = numPuzzles;
    var nRow = 5;
    var nColumn = 5;

    var drawAreaWidth = 300;
    var drawAreaHeight = 300;

    drawDrawAreaWidth = drawAreaWidth;
    drawDrawAreaHeight = drawAreaHeight;

    var paddingWidth = mywidth - drawAreaWidth;
    var paddingHeight = 600 - drawAreaHeight;

    var leftPadding = paddingWidth / 2;
    var topPadding = paddingHeight / 2;

    drawLeftPadding = leftPadding;
    drawTopPadding = topPadding;

    puzzleWidth = drawAreaWidth / nRow;
    puzzleHeight = drawAreaHeight / nColumn;

    puzzles = new Array(numPuzzles);
    cells = new Array(numCells);
    puzzleImg = new Array(numPuzzleImgs);

    var counter = 0;
    for (var i = 0; i < nColumn; i++) {
        for (var j = 0; j < nRow; j++) {
            puzzleImg[counter] = get(j * (sunflower.width / nRow), i * (sunflower.height / nColumn), sunflower.width / nRow, sunflower.height / nColumn);
            counter = counter + 1;
        }
    }

    for (var i = 0; i < puzzles.length; i++) {
        var x = random(puzzleWidth, mywidth - puzzleWidth);
        while (x > (leftPadding - puzzleWidth) && x < ((leftPadding + drawAreaWidth) + (puzzleWidth))) {
            x = random(puzzleWidth, mywidth - paddingWidth);
        }

        var y = random(puzzleHeight, height - puzzleHeight);

        var cropPuzzleImg = puzzleImg[i];

        puzzles[i] = new Puzzle(x, y, i, cropPuzzleImg, 0, 0, false);
        puzzles[i].solved = false;
    }

    var cellCount = 0;
    for (var i = 0; i < nRow; i++) {
        for (var j = 0; j < nColumn; j++) {
            cells[cellCount] = new Cell(cellCount, leftPadding + (puzzleWidth / 2) + (j * puzzleWidth), topPadding + (puzzleHeight / 2) + (i * puzzleHeight));
            var cellDataElement = {
                "id": cellCount,
                "xPos": cells[cellCount].xpos,
                "yPos": cells[cellCount].ypos,
                "width": puzzleWidth,
                "height": puzzleHeight,
                "solved": false,
                "timer": 0.0
            };
            cellData.push(cellDataElement);

            cellCount = cellCount + 1;
        }
    }
}

function draw() {
    clear();
    background('rgb(255,255,255)');

    stroke('rgb(200,200,200)');
    fill('rgb(255,255,255)');
    rectMode(CORNER);
    rect(drawLeftPadding, drawTopPadding, drawDrawAreaWidth, drawDrawAreaHeight);

    for (var i = 0; i < puzzles.length; i++) {
        puzzles[i].display(mouseX, mouseY);
    }
}

function mousePressed() {
    if (dragged == -1 && hovaMutatok() != -1) {
        dragged = hovaMutatok();
    }

    if (dragged !== -1) {
        puzzles[dragged].dragging = true;
        puzzles[dragged].offsetX = puzzles[dragged].xpos - mouseX;
        puzzles[dragged].offsetY = puzzles[dragged].ypos - mouseY;

        trajectoryID = trajectoryID + 1;

        var trajectoryElement = {
            "id": puzzles[dragged].trajectoryID,
            "cx": puzzles[dragged].xpos,
            "cy": puzzles[dragged].ypos,
            "trajectoryID": puzzles[dragged].cellId,
            "width": puzzleWidth,
            "height": puzzleHeight,
            "millisec": Date.now()
        };

        trajectoryData.push(trajectoryElement);
        handlePuzzlePieceMove(trajectoryElement.trajectoryID);
    }
}

function mouseDragged() {
    cursor(MOVE);
    if (dragged != -1) {
        puzzles[dragged].xpos = mouseX;
        puzzles[dragged].ypos = mouseY;

        // Only store data if position has changed significantly to reduce redundancy
        if (trajectoryData.length === 0 || dist(mouseX, mouseY, trajectoryData[trajectoryData.length - 1].cx, trajectoryData[trajectoryData.length - 1].cy) > 10) {
            trajectoryData.push({
                "id": puzzles[dragged].trajectoryID,
                "cx": puzzles[dragged].xpos,
                "cy": puzzles[dragged].ypos,
                "trajectoryID": puzzles[dragged].cellId,
                "width": puzzleWidth,
                "height": puzzleHeight,
                "millisec": Date.now()
            });
        }
    }
}

function mouseReleased() {
    cursor(HAND);

    if (dragged != -1) {
        if (trajectoryData.length > 2) {
            for (var i = 0; i < cells.length; i++) {
                for (var j = 0; j < puzzles.length; j++) {
                    if (cells[i].id == puzzles[j].cellId) {
                        if ((cells[i].xpos >= puzzles[j].xpos - (puzzleWidth / 2)) && (cells[i].xpos <= puzzles[j].xpos + (puzzleWidth / 2)) &&
                            (cells[i].ypos >= puzzles[j].ypos - (puzzleWidth / 2)) && (cells[i].ypos <= puzzles[j].ypos + (puzzleWidth / 2))) {
                            puzzles[j].xpos = cells[i].xpos;
                            puzzles[j].ypos = cells[i].ypos;
                            puzzles[j].solved = true;

                            if (cellData[i].solved == false) {
                                cellData[i].solved = true;
                                currentTime = Date.now();
                                deltaTIme = currentTime - startTimer;
                                cellData[i].timer = deltaTIme;
                            }
                        }
                    }
                }
            }

            puzzles[dragged].dragging = false;
            dragged = -1;
        }
    }
}

function hovaMutatok() {
    for (var i = 0; i < puzzles.length; i++) {
        if (dist(puzzles[i].xpos, puzzles[i].ypos, mouseX, mouseY) < (puzzleWidth / 2)) {
            if (puzzles[i].solved == false) {
                return i;
            }
        }
    }
    return -1;
}

let interactions = []; // To store interactions between puzzle pieces
let lastMovedPiece = null; // To keep track of the last moved puzzle piece

// Assuming you have a function to handle puzzle piece moves
function handlePuzzlePieceMove(currentPieceId) {
    console.log(currentPieceId)
    if (lastMovedPiece !== null) {
        interactions.push({ source: lastMovedPiece, target: currentPieceId });
    }
    lastMovedPiece = currentPieceId;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

class Puzzle {
    constructor(tempXpos, tempYpos, tempCellId, tempPuzzleImg, tempOffsetX, tempOffsetY, tempDragging) {
        this.xpos = tempXpos;
        this.ypos = tempYpos;
        this.cellId = tempCellId;
        this.puzzleImg = tempPuzzleImg;
        this.offsetX = tempOffsetX;
        this.offsetY = tempOffsetY;
        this.dragging = tempDragging;
    }

    display(px, py) {
        rectMode(CENTER);
        imageMode(CENTER);
        fill('rgba(255,0,0,0)');
        stroke('rgb(0,0,0)');

        if (this.dragging) {
            this.xpos = px + this.offsetX;
            this.ypos = py + this.offsetY;
        }

        rect(this.xpos, this.ypos, puzzleWidth, puzzleHeight);
        this.puzzleImg.resize(puzzleWidth, puzzleHeight);
        image(this.puzzleImg, this.xpos, this.ypos);
    }
}

class Cell {
    constructor(tempId, tempXpos, tempYpos) {
        this.id = tempId;
        this.xpos = tempXpos;
        this.ypos = tempYpos;
    }

    display() {
        stroke('rgba(255,255,255, 0)');
        fill('rgb(255,255,255)');
        rectMode(CENTER);
        rect(this.xpos, this.ypos, puzzleWidth, puzzleHeight);
    }
}