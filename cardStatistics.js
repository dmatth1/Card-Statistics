
$(function() {
	var gameStarted = false;
	var gamePaused = false;
	var dealerCards = [];
	var dealerIndex = 0;
	var dealerHolding = false;
	var cards = [];
	var previousCounter = 0;
	var previouslySelected = [];
	var selected = null;
	var cardBack = null;
	var cardBackCopy = null;

	function clear(){
		dealerCards = [];
		dealerIndex = 0;
		dealerHolding = false;
		previouslySelected = [];
		previousCounter = 0;
		selected = null;
		displayX.clearRect(0, 0, display.width, display.height);
		$("#cardStatsHeader").text("Card Statistics");
		dealerX.clearRect(0, 0, dealer.width, dealer.height);
	}



	//Define the start/stop button actions
	$("#start").click(function() {
		if(!gameStarted && !gamePaused) {
			$("#start").text("Stop");
			$("#hit").css("visibility", "visible");
			$("#stay").css("visibility", "visible");
			$("button").prop("disabled", false);
			gameStarted = true;
			deal();
			writeCardStatistics();
		}
		else if(gameStarted && gamePaused){
			$("button").prop("disabled", false);
			$("#start").text("Stop");
			gamePaused = false;
		}
		else if(gameStarted && !gamePaused){
			$("button:not(#start)").prop("disabled", true);
			$("#start").text("Start");
			gamePaused = true;
		}
		else{
			//location.reload();
			//clear all data instead of reloading
			gameStarted = true;
			gamePaused = false;
			clear();
			$("button:not(#start)").prop("disabled", false);
			$("#start").text("Stop");
			deal();
			writeCardStatistics();
		}

	});

	//Define the hit button actions
	$("#hit").click(function() {
		hit(true);
		hit(false);
		writeCardStatistics();
	});

	$("#stay").click(function() {
		stay();
	});


	var topOffsetY = $("#myCanvas").position().top;
	var canvas = document.getElementById("myCanvas");
	//canvas.style.position = "absolute";
	//canvas.style.top = 50;
	canvas.style.left = 0;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight - topOffsetY -(window.innerHeight * .3);
	var ctx = canvas.getContext("2d");

	var panelHeading = document.createElement("span");
	panelHeading.id = "panelHeading";
	panelHeading.style.display = "block";
	document.body.appendChild(panelHeading);
	$("#panelHeading").width = canvas.width - 70;
	$("#panelHeading").height = "50px";
	$("#panelHeading").append("<span id = 'leftPanelHeader'><b>Player</b></span> <span id = 'rightPanelHeader'><b>Dealer</b></span>");
	$("#leftPanelHeader").css("margin-left", "15%");
	$("#rightPanelHeader").css("float", "right");
	$("#rightPanelHeader").css("margin-right", "15%");

	var bottomPanelHeight =  window.innerHeight - topOffsetY - canvas.height - $("#panelHeading").height();

	//Bottom panel to display player's selected cards
	var display = document.createElement('canvas');
	display.id     = "display";
	display.width  = 5 * (window.innerWidth / 13);
	display.height = bottomPanelHeight;
	display.style.float = "left";
	document.body.appendChild(display);
	var displayX = display.getContext("2d");

	//Bottom panel to display Card Statistics of the current hand
	var cardStats = document.createElement('div');
	cardStats.id = "cardStats";
	document.body.appendChild(cardStats);
	$("#cardStats").append("<h3 align = 'center' id = 'cardStatsHeader'>Card Statistics<h3>");
	$("#cardStats").css({
		float : "left",
		width : 3 * (window.innerWidth / 13),
		height : bottomPanelHeight
	});

	var cardStatsDiv = document.createElement("div");
	cardStatsDiv.id = "cardStatsDiv";
	cardStats.appendChild(cardStatsDiv);
	$("#cardStatsDiv").css({
		float : "left",
		"min-width" :  $("#cardStats").width(),
		overflow : "auto"
	});
	var p1 = $("#cardStatsDiv").position().top;
	$("#cardStatsDiv").css("max-height", window.innerHeight - p1);

	//Bottom panel to display dealer's cards
	var dealer = document.createElement('canvas');
	dealer.id = "dealer";
	dealer.width = 5 * (window.innerWidth /  13);
	dealer.height = bottomPanelHeight;
	dealer.style.float = "left";
	document.body.appendChild(dealer);
	var dealerX = dealer.getContext("2d");

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


	function writeCardStatistics() {
		$("#cardStatsDiv").empty();

		var playerTotal = getDealerOrPlayerTotal(false);
		var dealerTotal = getDealerOrPlayerTotal(true);

		displayTotals(playerTotal, dealerTotal);

		if(playerTotal > 21 || dealerTotal > 21){
			endGame(playerTotal, dealerTotal);
			return;
		}

		outputPercentages();

	}

	//After a game is finished, show the totals in the player's and dealer's card pile
	function displayTotals(playerTotal, dealerTotal){

		fitTextOnCanvas(display, displayX, String(playerTotal), "Comic-Sans", 0);
		fitTextOnCanvas(dealer, dealerX, String(dealerTotal), "Comic-Sans", 0);
	}
	function fitTextOnCanvas(canvasChoice, panelChoice, text,fontface,yPosition){

		// start with a large font size
		var fontsize = 300;

		// lower the font size until the text fits the canva
		do{
			fontsize--;
			panelChoice.font="bold " + fontsize+"px "+fontface;
		}while((fontsize >= (canvasChoice.height)))

		// draw the text
		panelChoice.fillStyle = "blue";
		panelChoice.fillText(text, (canvasChoice.width / 2) - (panelChoice.measureText(text).width / 2), fontsize - (fontsize / 8));
	}

	//Enable to the Use to play another game from the old decks
	function endGame(playerTotal, dealerTotal){
		if(playerTotal > 21) $("#cardStatsHeader").text("Dealer wins by bust.");
		else if(dealerTotal > 21) $("#cardStatsHeader").text("Player wins by bust.");
		else if(playerTotal > dealerTotal) $("#cardStatsHeader").text("Player wins by count.");
		else if (playerTotal == dealerTotal) $("#cardStatsHeader").text("Tie. Pot is split between Player and Dealer.");
		else $("#cardStatsHeader").text("Dealer wins by count.");

		$("#cardStatsDiv").children().empty();

		gameStarted = false;
		gamePaused = true;
		$("button:not(#start)").prop("disabled", true);
		$("#start").text("Next Game");
	}

	//If true, returns dealer total; else player total
	function getDealerOrPlayerTotal(isDealerTotal){
		var total = 0;
		var modulo = 13;

		if(isDealerTotal) var totalCards = dealerCards;
		else var totalCards = previouslySelected;

		if(totalCards[0] == null || totalCards[0] == 0) return 0;

		var nums = [];
		for (var i = 0; i < totalCards.length; i++) {
			nums[i] = totalCards[i].num;
		}

		var acesCounter = 0;
		for(num of nums){
			var numModuloed = num % modulo;
			if(numModuloed > 10 || numModuloed == 0) total += 10; 						//Royals
			else if(numModuloed == 1)acesCounter++;										//Aces
			else if(numModuloed >= 2 && numModuloed <= 10) total += numModuloed;		//Numbers
			else continue;
		}

		for(var i = 0; i < acesCounter; i++){
			if(total + 11 + (acesCounter - i) > 21) total += 1;
			else total += 11;
		}

		return total;
	}

	function outputPercentages(){
		var cardStatsDivLeft = document.createElement("div");
		cardStatsDivLeft.id = "cardStatsDivLeft";
		cardStatsDiv.appendChild(cardStatsDivLeft);
		$("#cardStatsDivLeft").css({
			float : "left",
			"min-width" : $("#cardStatsDiv").width() / 3
		});

		var cardStatsDivMid = document.createElement("div");
		cardStatsDivMid.id = "cardStatsDivMid";
		cardStatsDiv.appendChild(cardStatsDivMid);
		$("#cardStatsDivMid").css({
			float : "left",
			"min-width" : $("#cardStatsDiv").width() / 3
		});

		var cardStatsDivRight = document.createElement("div");
		cardStatsDivRight.id = "cardStatsDivRight";
		cardStatsDiv.appendChild(cardStatsDivRight);
		$("#cardStatsDivRight").css({
			"min-width" : $("#cardStatsDiv").width() / 3
		});

		var quantities = [];
		for(var i = 0; i < 13; i++) quantities[i] = 0;

		for(var i = 1; i < 53; i++){
			if(!cards[i].selected) quantities[i % 13]++;
		}

		//Determine how many unique cards are left in the deck
		var cCounter = 0;
		for(var i = 1; i < cards.length; i++){
			if(cards[i] != null && !cards[i].selected) cCounter++;
		}

		var percentages = [];
		for(var i = 0; i < quantities.length; i++){
			var ratio = (1 / cCounter) * quantities[i];
			var percentage = (ratio * 100).toFixed(2);

			var cardName = i;
			if(cardName == 1) cardName = "Ace";
			else if(cardName == 11) cardName = "Jack";
			else if(cardName == 12) cardName = "Queen";
			else if(cardName == 0) cardName = "King";

			percentages[i] = {percentage : percentage, cardName : cardName};
		}

		for(var i = 2; i < percentages.length + 2; i++){

			var index = i % percentages.length;
			if((i-2) < 5) $("#cardStatsDivLeft").append(percentages[index].cardName + ": " + percentages[index].percentage + "%" + "<br />");
			else if ((i-2) >  8) $("#cardStatsDivRight").append(percentages[index].cardName + ": " + percentages[index].percentage + "%" + "<br />");
			else $("#cardStatsDivMid").append(percentages[index].cardName + ": " + percentages[index].percentage + "%" + "<br />");
		}
	}

	function showCards(num, currentX, currentY){
		// Load up our image.
		var path = "cards/" + String(num) + ".svg";
		var source = new Image();
		source.src = path;
		source.width = canvas.width / 13;
		source.height = canvas.height / 4;
		source.id = String(num);
		source.x = currentX;
		source.y = currentY;
		cards[num] = new Card(source, currentX, currentY, source.width, source.height, num);
		// Render our SVG image to the canvas once it loads.
		source.onload = function(){
			ctx.drawImage(source, currentX, currentY, source.width, source.height);
		}
	}

	//cardBacks[0] = red and cardBacks[1] = blue
	function loadCardBacks(color){
		var path = "cards/" + color + ".svg";
		cardBack = new Image();
		cardBack.src = path;
		cardBack.id = color + "0";
		//return cardBack;
	}

	function selectPlayerCards(){
		hit(true);
		hit(true);
	}

	function selectDealerCards(){
		hit(false);
		dealerCards[0] = selected;
		hit(false);
		dealerCards[1] = selected;
		dealerIndex = 2;

		var dealerTotal = getDealerOrPlayerTotal(true);
		var playerTotal = getDealerOrPlayerTotal(false);
		if(dealerTotal >= 17 && dealerTotal > playerTotal) {
			dealerHolding = true;
		}


		dealerX.drawImage(dealerCards[1].source, 0, 0, dealer.width / 5, dealer.height);
		dealerX.drawImage(dealerCards[0].source, dealer.width / 5, 0, dealer.width / 5, dealer.height);

	}

	function deal(){
		loadCardBacks("red");
		selectPlayerCards();
		selectDealerCards();
	}

	//Choose and highlight a random card by button click
	function hit(isPlayer){
		if(previouslySelected.length >= (52 - dealerCards.length)) return;

		var choose;

		if(isPlayer) {
			choose = Math.round((Math.random() * 51)) + 1;
			//Exclude already chosen in a while loop
			while (isAlreadySelected(choose)) {
				choose = Math.round((Math.random() * 51)) + 1;
			}


			selected = cards[choose];
			selected.selected = true;


			previouslySelected[previousCounter] = cards[choose];
			previousCounter++;
			displayX.clearRect(0, 0, display.width, display.height);
			drawPreviouslySelected(display, displayX, false);
		}
		else{
			//Dealer's hit
			var dealerTotal = getDealerOrPlayerTotal(true);

			if((dealerTotal >= 0  && dealerTotal < 17)  || (isDealerBehind() && !dealerHolding)){
				choose = Math.round((Math.random() * 51)) + 1;
				//Exclude already chosen in a while loop
				while(isAlreadySelected(choose)){
					choose = Math.round((Math.random() * 51)) + 1;
				}

				selected = cards[choose];
				selected.selected = true;


				dealerCards[dealerIndex++] = cards[choose];
				dealerX.clearRect(0, 0, dealer.width, dealer.height);
				drawPreviouslySelected(dealer, dealerX, true);
			}
			else{
				dealerHolding = true;
			}
		}
		/*ctx.clearRect(selected.offSetX, selected.offSetY, selected.width, selected.height);
		if(cardBackCopy == null) {
			cardBack.onload = function () {
				ctx.drawImage(cardBack, selected.offSetX, selected.offSetY, selected.width, selected.height);
				cardBackCopy = ctx.getImageData(selected.offSetX, selected.offSetY, selected.width, selected.height);
			};
		}
		else {ctx.putImageData(cardBackCopy, selected.offSetX, selected.offSetY);}*/
	}

	function isDealerBehind(){
		var dealerTotal = getDealerOrPlayerTotal(true);
		var playerTotal = getDealerOrPlayerTotal(false);
		if (playerTotal > dealerTotal && playerTotal <= 21) return true;
		else if(dealerTotal >= playerTotal && dealerTotal <= 21) return false;
		else if (playerTotal > 21) return false;
		else if(dealerTotal > 21) return false;
		else return false;
	}


	function stay(){
		var dealerTotal = getDealerOrPlayerTotal(true);
		var playerTotal = getDealerOrPlayerTotal(false);


		if(!dealerHolding && isDealerBehind()) {
			while (isDealerBehind()) {
				hit(false);
				dealerTotal = getDealerOrPlayerTotal(true);
			}
		}


		displayTotals(playerTotal, dealerTotal);


		endGame(playerTotal, dealerTotal);
	}

	//Returns if the selected index choice has already been selected
	function isAlreadySelected(choose){
		return (cards[choose].selected) ?  true : false;
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
		}
	}
	function drawPreviouslySelected(canvasChoice, panelChoice, isDealer){
		var tempOffsetX = 0;


		if(isDealer){
			var drawingCards = dealerCards;
			var indices = 5;
		}
		else {
			var drawingCards = previouslySelected;
			var indices = 5;
		}

		for(var i = drawingCards.length - 1; i >= 0; i--){
			if(drawingCards.length - i < indices + 1){
				panelChoice.drawImage(drawingCards[i].source, tempOffsetX, 0, (canvasChoice.width / indices), canvasChoice.height);
				tempOffsetX += canvasChoice.width / indices;
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

	function Card (source, offSetX, offSetY, width, height, num){
		this.source = source;
		this.offSetX = offSetX;
		this.offSetY = offSetY;
		this.width = width;
		this.height = height;
		this.num = num;
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

});
