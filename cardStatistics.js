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

	var gameStarted = false;			//Triggered when a game is started
	var gamePaused = false;				//Triggered when a game is paused

	var dealerCards = [];				//Store dealer cards in an array
	var dealerIndex = 0;				//Current index of dealerCards
	var dealerHolding = false;			//Triggered when the dealer stays (non-reversible)

	var cards = [];						//Store cards in an array of Card objects

	var previouslySelected = [];		//Store previously selected cards in an array
	var previousCounter = 0;			//Index of previouslySelected

	var selected = null;				//Currently selected card
	var cardBack = null;				//Back of a card
	var cardBackCopy = null;			//Copy of cardBack

	var playerScore = 0;				//Overall player score
	var dealerScore = 0;				//Overall dealer score
	var hiLoCount = 0;					//Rolling count of HiLo counting

	var topOffsetY = null;				//Y offset due to header

	//Player and dealer both start out with $100
	var playerMoney = 100;
	var dealerMoney = 100;
	var currentPot = 0;

	//Define global canvas's and displays for UI
	var canvas = document.getElementById("myCanvas");
	var ctx = null;
	var playerCanvas = null;
	var playerX = null;
	var dealerCanvas = null;
	var dealerX = null;
	var cardStats = null;
	var cardStatsDiv = null;

	//Declare bet button and input
	var betButton = null;
	var betInput = null;



	//Default UI upon loading
	setDisplay();
	loadCards();


	//Define the bet/stop button actions
	$("#betButton").click(function() {

		//Started a new game/round
		if(!gameStarted && !gamePaused) {
			if(!betPlayer()){
				alert("Invalid Bet");
				return;
			}
			$("#betButton").text("Stop");
			$("button").css("visibility", "visible");
			$("button:not(#newDeck)").prop("disabled", false);
			$("#betInput").prop("disabled", true);
			$("#betButton").prop("disabled", true);
			gameStarted = true;
			deal();
			writeCardStatistics();
		}

		//Unpause the current round
		else if(gameStarted && gamePaused){
			$("button:not(#newDeck)").prop("disabled", false);
			$("#betButton").text("Stop");
			gamePaused = false;
		}

		//Pause the current round
		else if(gameStarted && !gamePaused){
			$("button:not(#start, #newDeck)").prop("disabled", true);
			$("#betButton").text("Start");
			gamePaused = true;
		}

		//Next Game selected, clear and start next round
		else{
			clear();
			if(!betPlayer()){
				alert("Invalid Bet");
				return;
			}
			gameStarted = true;
			gamePaused = false;
			$("button:not(#start)").prop("disabled", false);
			$("#newDeck").prop("disabled", true);
			$("#betButton").text("Stop");
			deal();
			writeCardStatistics();
		}
	});


	//Define the Hit event for both player and dealer
	$("#hit").click(function() {
		hit(true);
		hit(false);
		repaintCanvas();
		writeCardStatistics();
	});


	//Stay (stand) event
	$("#stay").click(function() {
		stay();
	});



	//Refresh the deck, beginning from none selected - only available at the beginning of a game
	$("#newDeck").click(function() {

		//Set all cards to not selected and reset hiLoCount
		for(var i = 1; i < cards.length; i++) cards[i].selected = false;
		hiLoCount = 0;

		//Create a temporary canvas to playerCanvas "Deck Refreshed" over the main canvas
		$("#canvasTemp").remove();
		var canvasTemp = document.createElement("canvas");
		canvasTemp.id = "canvasTemp";
		canvasTemp.width = canvas.width;
		canvasTemp.height = canvas.height;
		document.body.appendChild(canvasTemp);

		//Overlay canvasTemp onto canvas
		$(canvasTemp).css({
			"position" : "absolute",
			"top" : topOffsetY,
			"left" : 0,
			"z-index" : 100,
			"background" : "transparent"
		});

		//Display "Deck Refreshed" then fade out
		var canvasTempX = canvasTemp.getContext("2d");
		fitTextOnCanvas(canvasTemp, canvasTempX, "Deck Refreshed", "Comic-Sans", 0);
		$(canvasTemp).delay(1000).fadeOut(750);
		repaintCanvas();
	});


	//Loads a card and draw it on the main canvas as specified by the parameters
	function showCards(num, currentX, currentY){
		var path = "cards/" + String(num) + ".svg";
		var source = new Image();
		source.src = path;

		//Set dimensions and location on canvas - unnecessary but nice
		source.width = canvas.width / 13;
		source.height = canvas.height / 4;
		source.id = String(num);
		source.x = currentX;
		source.y = currentY;

		//Store new Card object in cards array
		cards[num] = new Card(source, currentX, currentY, source.width, source.height, num);

		// Render our SVG image to the canvas once it loads.
		source.onload = function(){
			ctx.drawImage(source, currentX, currentY, source.width, source.height);
		}
	}


	//Called at the beginning of a new round/game
	function deal(){
		loadCardBacks("red");
		selectPlayerCards();
		selectDealerCards();
		repaintCanvas();
	}


	//Hits for either the dealer or player
	function hit(isPlayer){

		//All cards already selected
		if(previouslySelected.length >= (52 - dealerCards.length)){
			endGame();
			$("#newDeck").click();
			return;
		}

		var choose;
		if(isPlayer) {
			choose = Math.round((Math.random() * 51)) + 1;
			//Exclude already chosen in a while loop
			while (isAlreadySelected(choose)) {
				choose = Math.round((Math.random() * 51)) + 1;
			}

			//Set selected
			selected = cards[choose];
			selected.selected = true;

			//Update previouslySelected and draw it for player
			previouslySelected[previousCounter] = cards[choose];
			previousCounter++;
			playerX.clearRect(0, 0, playerCanvas.width, playerCanvas.height);
			drawPreviouslySelected(playerCanvas, playerX, false);
		}
		else{
			var dealerTotal = getDealerOrPlayerTotal(true);

			//Make sure dealer wants to hit
			if((dealerTotal >= 0  && dealerTotal < 17)  || (isDealerBehind() && !dealerHolding)){
				choose = Math.round((Math.random() * 51)) + 1;
				//Exclude already chosen in a while loop
				while(isAlreadySelected(choose)){
					choose = Math.round((Math.random() * 51)) + 1;
				}

				//Set selected
				selected = cards[choose];
				selected.selected = true;

				//Update dealer previouslySelected and draw it for dealer
				dealerCards[dealerIndex++] = cards[choose];
				dealerX.clearRect(0, 0, dealerCanvas.width, dealerCanvas.height);
				drawPreviouslySelected(dealerCanvas, dealerX, true);
			}
			else{
				//If dealer doesn't want to hit, then dealer is now holding
				dealerHolding = true;
			}
		}

		updateHiLo();
	}


	//Called when player clicks Stay. Processes dealer actions and ends the current round
	function stay(){
		var dealerTotal = getDealerOrPlayerTotal(true);
		var playerTotal = getDealerOrPlayerTotal(false);

		//If dealer has not held already and dealer is losing to player, then dealer hits until draw, bust, or win
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


	//Called on the bet click - takes the user input
	function betPlayer(){
		var userBet = document.getElementById("betInput").value;
		userBet = parseInt(userBet);
		if(userBet && userBet >= 5 && playerMoney >= userBet) {
			playerMoney -= userBet;
			dealerMoney -= userBet;
			currentPot = userBet * 2;
			renderBet();
			return true;
		}
		return false;
	}


	//Bet rendering
	function renderBet(){
		document.getElementById("currentBet").innerHTML = "Current Bet: " + parseInt(currentPot);
		updateScoresBets();
	}


	//Writes into the cardStatistics div displaying stats for each card type
	function writeCardStatistics() {
		$("#cardStatsDiv").empty();

		//Get and display totals for player and dealer
		var playerTotal = getDealerOrPlayerTotal(false);
		var dealerTotal = getDealerOrPlayerTotal(true);
		displayTotals(playerTotal, dealerTotal);

		//Check for bust
		if(playerTotal > 21 || dealerTotal > 21){
			endGame(playerTotal, dealerTotal);
			return;
		}

		outputPercentages();

	}


	//Record the score of the game and display it to the user. Then, prep for next round.
	function endGame(playerTotal, dealerTotal){
		if(playerTotal === 21){
			playerScore++;
			$("#cardStatsHeader").text("Player wins $" + currentPot + " by blackjack.");
			playerMoney += currentPot * 1.5;
		}
		else if(playerTotal > 21){
			dealerScore ++;
			$("#cardStatsHeader").text("Dealer wins $" + currentPot + " by bust.");
			dealerMoney += currentPot;
		}
		else if(dealerTotal > 21){
			playerScore ++;
			$("#cardStatsHeader").text("Player wins $" + currentPot + " by bust.");
			playerMoney += currentPot;
		}
		else if(playerTotal > dealerTotal){
			playerScore ++;
			$("#cardStatsHeader").text("Player wins $" + currentPot + " by count.");
			playerMoney += currentPot;
		}
		else if (playerTotal == dealerTotal){
			dealerScore ++;
			playerScore ++;
			$("#cardStatsHeader").text("Tie. $" + currentPot + " is split between Player and Dealer.");
			playerMoney += currentPot;
		}
		else {
			dealerScore ++;
			$("#cardStatsHeader").text("Dealer wins $" + currentPot + " by count.");
			dealerMoney += currentPot;
		}

		//Output Hi Lo
		(hiLoCount < 0) ? $("#cardStatsHeader").append(" According to HiLo Card Counting, Player should bet high.") : $("#cardStatsHeader").append(" According to HiLo Card Counting, Player should bet low.");
		updateScoresBets();

		//Clear Card Statistics
		$("#cardStatsDiv").children().empty();

		//Map to the next game via the bet button
		gameStarted = false;
		gamePaused = true;
		$("button:not(#betButton)").prop("disabled", true);
		$("#betButton").text("Bet");
		$("#betInput").prop("disabled", false);
		$("#betButton").prop("disabled", false);

		//Enable deck refresh
		$("#newDeck").prop("disabled", false);
	}

	function updateScoresBets(){
		//Output the scores for the player and dealer
		$("#leftPanelHeader").text("$" + playerMoney + " - Player - " + playerScore);
		$("#rightPanelHeader").text("$" + dealerMoney + " - Dealer - " + dealerScore);
	}

	//Called at the end of every round, clears some values in preparation for the next round
	function clear(){
		dealerCards = [];
		dealerIndex = 0;
		dealerHolding = false;
		previouslySelected = [];
		previousCounter = 0;
		selected = null;
		currentPot = 0;

		//Clear player and dealer panels
		playerX.clearRect(0, 0, playerCanvas.width, playerCanvas.height);
		dealerX.clearRect(0, 0, dealerCanvas.width, dealerCanvas.height);
		$("#cardStatsHeader").text("Card Statistics");
	}


	/*************************************************************************************
	 * Classes
	 */


	//Card class for use in the cards[] array
	function Card (source, offSetX, offSetY, width, height, num){
		this.source = source;
		this.offSetX = offSetX;
		this.offSetY = offSetY;
		this.width = width;
		this.height = height;
		this.num = num;
		this.selected = false;
	}


	/************************************************************************************
	 * Helper functions
	 */


	//Load's the cards into the main canvas
	function loadCards(){

		//Specify offsets for proper canvas orientation
		var xOff = canvas.width/13;
		var yOff = canvas.height/4;
		var currX = 0;
		var currY = 0;

		//Loop and update offsets while displaying each card on the main canvas
		for(var i = 1; i <53; i++){
			if(currX >=  canvas.width){
				currX = 0;
				currY += yOff;
			}
			showCards(i, currX, currY);

			currX += xOff;
		}
	}


	//Returns if the selected index choice has already been selected
	function isAlreadySelected(choose){
		return (cards[choose].selected) ?  true : false;
	}


	//Shows the totals in the player's and dealer's card pile
	function displayTotals(playerTotal, dealerTotal){

		fitTextOnCanvas(playerCanvas, playerX, String(playerTotal), "Comic-Sans", 0);
		fitTextOnCanvas(dealerCanvas, dealerX, String(dealerTotal), "Comic-Sans", 0);
	}


	//Helper function to display scores overlaid onto the player and dealer canvas's
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


	//If true, returns dealer total; else returns player total
	function getDealerOrPlayerTotal(isDealerTotal){
		var total = 0;
		var modulo = 13;

		//Select corresponding cards
		if(isDealerTotal) var totalCards = dealerCards;
		else var totalCards = previouslySelected;

		if(totalCards[0] == null || totalCards[0] == 0) return 0;

		//Get numbers of each card
		var nums = [];
		for (var i = 0; i < totalCards.length; i++) {
			nums[i] = totalCards[i].num;
		}

		//Add values of each number to total
		var acesCounter = 0;
		for(num of nums){
			var numModuloed = num % modulo;
			if(numModuloed > 10 || numModuloed == 0) total += 10; 						//Royals
			else if(numModuloed == 1)acesCounter++;										//Aces
			else if(numModuloed >= 2 && numModuloed <= 10) total += numModuloed;		//Numbers
			else continue;
		}

		//For aces, consider them last
		for(var i = 0; i < acesCounter; i++){
			if(total + 11 + (acesCounter - i) > 21) total += 1;
			else total += 11;
		}

		return total;
	}


	//Displays card stats in cardStatisticsDiv
	function outputPercentages(){

		//Clear UI
		setupCardStatDivs();

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

		//Correlate card name with card percentage
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

		//Display card statistics
		for(var i = 2; i < percentages.length + 2; i++){

			var index = i % percentages.length;
			if((i-2) < 5) $("#cardStatsDivLeft").append(percentages[index].cardName + ": " + percentages[index].percentage + "%" + "<br />");
			else if ((i-2) >  8) $("#cardStatsDivRight").append(percentages[index].cardName + ": " + percentages[index].percentage + "%" + "<br />");
			else $("#cardStatsDivMid").append(percentages[index].cardName + ": " + percentages[index].percentage + "%" + "<br />");
		}
	}


	//Helper function to load the cardBack according to the color (red or blue)
	function loadCardBacks(color){
		var path = "cards/" + String(color) + ".svg";
		cardBack = new Image();
		cardBack.src = path;
		cardBack.id = color;
		cardBack.onload = function () {
			repaintCanvas();
		}
	}


	//Choose two player cards on deal
	function selectPlayerCards(){
		hit(true);
		hit(true);
	}


	//Choose two dealer cards on deal
	function selectDealerCards(){
		hit(false);
		dealerCards[0] = selected;
		hit(false);
		dealerCards[1] = selected;
		dealerIndex = 2;

		//Determine if holding
		var dealerTotal = getDealerOrPlayerTotal(true);
		var playerTotal = getDealerOrPlayerTotal(false);
		if(dealerTotal >= 17 && dealerTotal > playerTotal) {
			dealerHolding = true;
		}

		//Draw drawn cards
		dealerX.drawImage(dealerCards[1].source, 0, 0, dealerCanvas.width / 5, dealerCanvas.height);
		dealerX.drawImage(dealerCards[0].source, dealerCanvas.width / 5, 0, dealerCanvas.width / 5, dealerCanvas.height);
	}


	//On each hit update hiLoCount
	function updateHiLo(){
		if(selected != null){
			var trueNum = selected.num % 13;
			if(trueNum == 0 || trueNum == 1 || trueNum >= 10)  hiLoCount ++;
			else if(trueNum >= 2 && trueNum <= 6) hiLoCount --;
		}
	}

	//
	function outputHiLo(){
		//Display hiLo Count suggestion
		/*$("#cardStatsHeader").css({
			"min-width" : $("#cardStatsDiv").width()
		});*/
	}


	//Paints canvas by replacing selected cards with the chosen cardBack
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


	//Draws the previouslySelected cards in either the player or dealer canvas, chosen by isDealer boolean
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

		//Paint Images on canvas
		for(var i = drawingCards.length - 1; i >= 0; i--){
			if(drawingCards.length - i < indices + 1){
				panelChoice.drawImage(drawingCards[i].source, tempOffsetX, 0, (canvasChoice.width / indices), canvasChoice.height);
				tempOffsetX += canvasChoice.width / indices;
			}
		}
	}


	//Helper function to output if dealer is ahead/tied or losing to player
	function isDealerBehind(){
		var dealerTotal = getDealerOrPlayerTotal(true);
		var playerTotal = getDealerOrPlayerTotal(false);
		if (playerTotal > dealerTotal && playerTotal <= 21) return true;
		else if(dealerTotal >= playerTotal && dealerTotal <= 21) return false;
		else if (playerTotal > 21) return false;
		else if(dealerTotal > 21) return false;
		else return false;
	}


	/************************************************************************************
	 * UI rendering functions
	 */


	//Sets up the UI for displaying card stats
	function setupCardStatDivs(){
		//Left portion of cardStatsDiv
		var cardStatsDivLeft = document.createElement("div");
		cardStatsDivLeft.id = "cardStatsDivLeft";
		cardStatsDiv.appendChild(cardStatsDivLeft);
		$("#cardStatsDivLeft").css({
			float : "left",
			"min-width" : $("#cardStatsDiv").width() / 3
		});

		//Middle portion of cardStatsDiv
		var cardStatsDivMid = document.createElement("div");
		cardStatsDivMid.id = "cardStatsDivMid";
		cardStatsDiv.appendChild(cardStatsDivMid);
		$("#cardStatsDivMid").css({
			float : "left",
			"min-width" : $("#cardStatsDiv").width() / 3
		});

		//Right portion of cardStatsDiv
		var cardStatsDivRight = document.createElement("div");
		cardStatsDivRight.id = "cardStatsDivRight";
		cardStatsDiv.appendChild(cardStatsDivRight);
		$("#cardStatsDivRight").css({
			"min-width" : $("#cardStatsDiv").width() / 3
		});

		//HiLo portion of cardStatsDiv
		var clear = document.createElement("div");
		clear.style.clear = "both";
		cardStatsDiv.appendChild(clear);
		var hiLoOutput = document.createElement("div");
		hiLoOutput.id = "hiLoOutput";
		cardStatsDiv.appendChild(hiLoOutput);


		//Add and show bet button and textbox
		/*betInput.max = playerMoney;
		cardStatsDiv.appendChild(betInput);
		cardStatsDiv.appendChild(betButton);
		cardStatsDiv.appendChild(currentPotOutput);*/
	}

	function test(){return false;}


	//Sets the UI display dynamically
	function setDisplay(){

		//Orient main canvas
		topOffsetY = $("#myCanvas").position().top;
		canvas.style.left = 0;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight - topOffsetY -(window.innerHeight * .3);
		ctx = canvas.getContext("2d");

		//Define lower panel headers which display player and dealer scores
		var panelHeading = document.createElement("span");
		panelHeading.id = "panelHeading";
		panelHeading.style.display = "block";
		document.body.appendChild(panelHeading);
		$("#panelHeading").width = canvas.width - 70;
		$("#panelHeading").height = "50px";
		$("#panelHeading").append("<b><span id = 'leftPanelHeader'>$" + playerMoney + " - Player - 0</span> <span id = 'rightPanelHeader'>$" + dealerMoney + " - Dealer - 0</span></b>");
		$("#leftPanelHeader").css("margin-left", "15%");
		$("#rightPanelHeader").css("float", "right");
		$("#rightPanelHeader").css("margin-right", "15%");

		//Amount of space left on the screen for the bottom panel
		var bottomPanelHeight =  window.innerHeight - topOffsetY - canvas.height - $("#panelHeading").height();

		//Bottom panel to show player's selected cards and score
		playerCanvas = document.createElement('canvas');
		playerCanvas.id     = "playerCanvas";
		playerCanvas.width  = 5 * (window.innerWidth / 13);
		playerCanvas.height = bottomPanelHeight;
		playerCanvas.style.float = "left";
		document.body.appendChild(playerCanvas);
		playerX = playerCanvas.getContext("2d");

		//Bottom panel to show Card Statistics of the current round
		cardStats = document.createElement('div');
		cardStats.id = "cardStats";
		document.body.appendChild(cardStats);
		$("#cardStats").append("<h3 align = 'center' id = 'cardStatsHeader'>Card Statistics<h3>");
		$("#cardStats").css({
			float : "left",
			width : 3 * (window.innerWidth / 13),
			height : bottomPanelHeight,
			overflow: "auto"
		});

		//Organize cardStats by div
		cardStatsDiv = document.createElement("div");
		cardStatsDiv.id = "cardStatsDiv";
		cardStats.appendChild(cardStatsDiv);
		$("#cardStatsDiv").css({
			float : "left",
			"min-width" :  $("#cardStats").width(),
			overflow : "auto"
		});
		var p1 = $("#cardStatsDiv").position().top;
		$("#cardStatsDiv").css("max-height", window.innerHeight - p1);

		//Bottom panel to show dealer's cards
		dealerCanvas = document.createElement('canvas');
		dealerCanvas.id = "dealerCanvas";
		dealerCanvas.width = 5 * (window.innerWidth /  13);
		dealerCanvas.height = bottomPanelHeight;
		dealerCanvas.style.float = "left";
		document.body.appendChild(dealerCanvas);
		dealerX = dealerCanvas.getContext("2d");

		//Bet button and input needs to be instantiated early
		/*betButton = document.createElement("button");
		betButton.innerHTML = "Bet";
		betButton.id = "betButton";

		betInput = document.createElement("input");
		betInput.type = "number";
		betInput.min = 0;
		betInput.max = playerMoney;
		betInput.style.width = "10%";
		betInput.value = "0";

		currentPotOutput = document.createElement("span");
		currentPotOutput.id = "currentPotOutput";
		currentPotOutput.innerHTML = "Current Pot: 0";*/
	}
});
