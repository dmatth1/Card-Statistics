var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var cards = [];
var previousCounter = 0;
var previouslySelected = [];
var selected = null;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight-(window.innerHeight * .2);
    //canvas.style.top = '50px';
    render();

}
window.addEventListener('resize', resize, false); resize();
function render() { // draw to screen here
}

//Bottom panel to display selected cards
var display = document.createElement('canvas');
display.id     = "display";
display.width  = window.innerWidth / 2;
//display.style.position = absolute;
//display.style.left = window.innerWidth / 2;
display.height = window.innerHeight * .2 - 25;
display.style.zIndex   = 8;
document.body.appendChild(display);
var displayX = display.getContext("2d");
var displayOffsetX = 0; 

var xOff = canvas.width/13;
var yOff = canvas.height/4;
var currX = 0;
var currY = 0;
for(var i = 1; i <53; i++){
	if(currX >=  canvas.width){
		currX = 0;
		currY += yOff;
	}

	showCards(i, currX, currY);

	currX += xOff;
}

  
function showCards(num, currentX, currentY){
	// Load up our image.
	var path = "cards/" + String(num) + ".svg";
	var source = new Image();
	source.src = path;
	source.width = canvas.width / 13;
	source.height = canvas.height / 4;
	source.id = num;
	source.x = currentX;
	source.y = currentY;
	cards[num] = new Card(source, currentX, currentY, source.width, source.height);
	//cards[num] = source;
	// Render our SVG image to the canvas once it loads.
	source.onload = function(){
	    ctx.drawImage(source,currentX,currentY, source.width, source.height);
	}
}

//Choose and highlight a random card by button click
function select(){
	var choose = Math.round((Math.random() * 51)) + 1;

	//if(selected != null) repaintCanvas();
	selectHelper(cards[choose]);

	selected = cards[choose];
	previouslySelected[previousCounter] = cards[choose];
	previousCounter++;

	//Displays selected cards in bottom panel in a scrolling display
	drawPreviouslySelected();

}

function selectHelper(c){
	ctx.clearRect(c.offSetX, c.offSetY, c.width, c.height);
	ctx.drawImage(c.source, c.offSetX, c.offSetY, c.width, c.height);
	ctx.rect(c.offSetX, c.offSetY, c.width, c.height);
	ctx.lineWidth = 3;
	ctx.stroke();
}
function repaintCanvas(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for(var i = 1; i < 53; i++){
		var c = cards[i];
		ctx.drawImage(c.source, c.offSetX, c.offSetY, c.width, c.height);
	};
}
function drawPreviouslySelected(){
	var tempOffsetX = 0;
	for(var i = previouslySelected.length - 1; i >= 0; i--){
		if(previouslySelected.length - i < 14){
			displayX.drawImage(previouslySelected[i].source, tempOffsetX, 0, (display.width / 13), display.height);		
			tempOffsetX += display.width / 13;
		}
	}
}

function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

function Card (source, offSetX, offSetY, width, height){
	this.source = source;
	this.offSetX = offSetX;
	this.offSetY = offSetY;
    this.width = width;
    this.height = height;
    this.selected = false;
}

/*class Card {
  constructor(source, offSetX, offSetY, width, height) {
  	this.source = source;
    this.offSetX = offSetX;
    this.offSetY = offSetY;
    this.width = width;
    this.height = height;
  }
  
  get source() {
  	return this.source;
  }
  get offSetX() {
    return this.offSetX;
  }
  get offSetY() {
  	return this.offSetY;
  }
  get width() {
  	return this.width;
  }
  get height() {
  	return this.height;
  }

  /*calcArea() {
    return this.height * this.width;
  }*/
//}

/*var x = canvas.width/2;
var y = canvas.height-30;
var dx = 2;
var dy = -2;

var ballRadius = 10;

var paddleHeight = 10;
var paddleWidth = 75;
var paddleX = (canvas.width-paddleWidth)/2;

var rightPressed = false;
var leftPressed = false


function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI*2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height-paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    drawPaddle();
    showCards(3);

    x += dx;
    y += dy;
	if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
	    dx = -dx;
	}

	if(y + dy < ballRadius) {
	    dy = -dy;
	} else if(y + dy > canvas.height-ballRadius) {
		if(x > paddleX && x < paddleX + paddleWidth) {
	        dy = -dy;
	    }
	    else {
	        alert("GAME OVER");
	        document.location.reload();
	    }
	}

	if(rightPressed && paddleX < canvas.width-paddleWidth) {
	    paddleX += 7;
	}
	else if(leftPressed && paddleX > 0) {
	    paddleX -= 7;
	}	
}

/*document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(e) {
    if(e.keyCode == 39) {
        rightPressed = true;
    }
    else if(e.keyCode == 37) {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if(e.keyCode == 39) {
        rightPressed = false;
    }
    else if(e.keyCode == 37) {
        leftPressed = false;
    }
}*/

//setInterval(draw);


