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