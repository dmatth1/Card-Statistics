/***
 * Card Statistics created by Daniel Mattheiss
 *
 * Written in javascript using the jQuery framework
 *
 * This application simulates a single deck player vs. dealer blackjack game and outputs relevant statistics.
 *
 * *********************************************************************************************************8
 *
 * To begin a new game, select Start Game. The player and dealer will both be dealt two cards.
 * Click Stop to pause the game.
 *
 * Click Hit to receive another card. The dealer will be dealt a card as well if the dealer is below 17. Note that
 * the player will receive his card first and will lose upon bust.
 *
 * To stay at the current hand, click Stay. If the dealer's hand is less than the player's hand the dealer will automatically
 * draw until either a tie, bust, or the dealer wins.
 *
 * At the end of each game, the player has the option of refreshing the deck. Clicking New Deck will reset the cards.
 *
 * The player overall score and current hand is displayed in the bottom left corner, while the dealer's is displayed in the
 * bottom right. All flipped cards on the board have already been played.
 *
 * Card statistics are displayed in lower center box. Card statistics show the probability of each card draw, as well as the
 * betting strategy determined by HiLo card counting. Refreshing the deck refreshes the card statistics.
 *
 * When a round has finished, the result is displayed in the card statistics box. Clicking Next Game will start the next round.
 *
 */
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
	var playerScore = 0;
	var dealerScore = 0;
	var hiLoCount = 0;

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
			$("button").css("visibility", "visible");
			$("button").prop("disabled", false);
			$("#newDeck").prop("disabled", true);
			gameStarted = true;
			deal();
			writeCardStatistics();
		}
		else if(gameStarted && gamePaused){
			$("button:not(#newDeck)").prop("disabled", false);
			$("#start").text("Stop");
			gamePaused = false;
		}
		else if(gameStarted && !gamePaused){
			$("button:not(#start, #newDeck)").prop("disabled", true);
			$("#start").text("Start");
			gamePaused = true;
		}
		else{
			gameStarted = true;
			gamePaused = false;
			clear();
			$("button:not(#start)").prop("disabled", false);
			$("#newDeck").prop("disabled", true);
			$("#start").text("Stop");
			deal();
			writeCardStatistics();
		}

	});

	//Define the hit button actions
	$("#hit").click(function() {
		hit(true);
		hit(false);
		repaintCanvas();
		writeCardStatistics();
	});

	//Stay (stand) function
	$("#stay").click(function() {
		stay();
	});

	//Refresh the deck, beginning from none selected - only available at the beginning of a game
	$("#newDeck").click(function() {
		$("#canvasTemp").remove();
		for(var i = 1; i < cards.length; i++) cards[i].selected = false;
		var canvasTemp = document.createElement("canvas");
		canvasTemp.id = "canvasTemp";
		canvasTemp.width = canvas.width;
		canvasTemp.height = canvas.height;
		document.body.appendChild(canvasTemp);
		$(canvasTemp).css({
			"position" : "absolute",
			"top" : topOffsetY,
			"left" : 0,
			"z-index" : 100,
			"background" : "transparent"
		});
		var canvasTempX = canvasTemp.getContext("2d");
		fitTextOnCanvas(canvasTemp, canvasTempX, "Deck Refreshed", "Comic-Sans", 0);
		$(canvasTemp).delay(1000).fadeOut(750);
		hiLoCount = 0;
		repaintCanvas();
	});


	var topOffsetY = $("#myCanvas").position().top;
	var canvas = document.getElementById("myCanvas");
	//canvas.style.position = "absolute";
	//canvas.style.top = topOffsetY;
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
	$("#panelHeading").append("<b><span id = 'leftPanelHeader'>Player - 0</span> <span id = 'rightPanelHeader'>Dealer - 0</span></b>");
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

		// lower the font size until the text fits the canvas
		do{
			fontsize--;
			panelChoice.font= fontsize+"px "+fontface;
		}while((fontsize >= (canvasChoice.height)) || (panelChoice.measureText(text).width >= canvasChoice.width));

		// draw the text
		panelChoice.fillStyle = "blue";
		panelChoice.fillText(text, (canvasChoice.width - panelChoice.measureText(text).width) / 2, fontsize - (fontsize / 8), canvasChoice.width);
	}

	//Record the score of the game and display it to the user
	function endGame(playerTotal, dealerTotal){
		if(playerTotal > 21){
			dealerScore ++;
			$("#cardStatsHeader").text("Dealer wins by bust.");
		}
		else if(dealerTotal > 21){
			playerScore ++;
			$("#cardStatsHeader").text("Player wins by bust.");
		}
		else if(playerTotal > dealerTotal){
			playerScore ++;
			$("#cardStatsHeader").text("Player wins by count.");
		}
		else if (playerTotal == dealerTotal){
			dealerScore ++;
			playerScore ++;
			$("#cardStatsHeader").text("Tie. Pot is split between Player and Dealer.");
		}
		else {
			dealerScore ++;
			$("#cardStatsHeader").text("Dealer wins by count.");
		}

		//Output the scores for the player and dealer
		$("#leftPanelHeader").text("Player - " + playerScore);
		$("#rightPanelHeader").text("Dealer - " + dealerScore);

		//Clear Card Statistics
		$("#cardStatsDiv").children().empty();

		//Map to the next game via the #start button
		gameStarted = false;
		gamePaused = true;
		$("button:not(#start)").prop("disabled", true);
		$("#start").text("Next Game");

		//Enable deck refresh
		$("#newDeck").prop("disabled", false);
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

		//Initialize all quantities to 0
		var quantities = [];
		for(var i = 0; i < 13; i++) quantities[i] = 0;

		//Count all non-selected card quantities
		//Determine how many unique cards are left in the deck
		var cCounter = 0;
		for(var i = 1; i < cards.length; i++){
			if(cards[i] != null && !cards[i].selected){
				quantities[i % 13]++;
				cCounter++;
			}
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

		var clear = document.createElement("div");
		clear.style.clear = "both";
		cardStatsDiv.appendChild(clear);
		var hiLoOutput = document.createElement("div");
		hiLoOutput.id = "hiLoOutput";
		cardStatsDiv.appendChild(hiLoOutput);
		$("#hiLoOutput").css({
			"min-width" : $("#cardStatsDiv").width()
		});
		(hiLoCount < 0) ? $("#hiLoOutput").append("<h4>According to HiLo Card Counting, Player should bet.</h4>") : $("#hiLoOutput").append("<h4>According to HiLo Card Counting, Player should not bet.</h4>");
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
		var path = "cards/" + String(color) + ".svg";
		cardBack = new Image();
		cardBack.src = path;
		cardBack.id = color;
		cardBack.onload = function () {
			repaintCanvas();
		}
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
		repaintCanvas();
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
		updateHiLo();
	}

	function updateHiLo(){
		if(selected != null){
			var trueNum = selected.num % 13;
			if(trueNum == 0 || trueNum == 1 || trueNum >= 10)  hiLoCount ++;
			else if(trueNum >= 2 && trueNum <= 6) hiLoCount --;
		}
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
				repaintCanvas();
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
		for (var i = 1; i < 53; i++) {
			cardBackCopy = cardBack;
			var c = cards[i];
			if (!c.selected)
				ctx.drawImage(c.source, c.offSetX, c.offSetY, c.width, c.height);
			else
				ctx.drawImage(cardBackCopy, c.offSetX, c.offSetY, c.width, c.height);
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

	function Card (source, offSetX, offSetY, width, height, num){
		this.source = source;
		this.offSetX = offSetX;
		this.offSetY = offSetY;
		this.width = width;
		this.height = height;
		this.num = num;
		this.selected = false;
	}
});
