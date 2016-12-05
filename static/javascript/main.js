$(document).ready(function() {
  "use strict";
  console.log("Main.js has loaded");
  var suits = ['spades', 'clubs', 'diams', 'hearts'];
  var ranks = {2 : 2, 3 : 3, 4 : 4, 5 : 5, 6 : 6, 7 : 7, 8 : 8, 9 : 9, 10 : 10, J : 10, Q : 10, K : 10, A : 11,};
  var players = [];
  var flipCard = 0;
  class Card{
    constructor(id, suit, rank, value, color){
      this.id = id;
      this.suit = suit;
      this.rank = rank;
      this.value = value;
      this.color = color;
      this.template = `
        <div id="${this.id}" class="player_card card back">
          <img src="static/images/card_back.jpg" alt="playing card back" />
          <div class="upper_symbol ${this.color}">
            <p class="rank">${this.rank}</p>
            <p class="${this.color}">&${this.suit};</p>
          </div>
          <div class="lower_symbol ${this.color}">
            <p class="rank">${this.rank}</p>
            <p>&${this.suit};</p>
          </div>
        </div>`;
    }
  }

  class Player{
    constructor(name, position){
      this.name = name;
      this.position = position;
      this.hand = [];
      this.cardSum = 0;
      this.score = 0;
      this.template = `
        <div id="player_${position}" class="player waiting">
          <h4><strong>~${name}~</strong></h4>
          <h6>Score: <span id="score_${position}">0</span></h6>
          <div id="hand_${position}" class="hand">
          </div>
          <h5 class="won" >You Won!</h5>
          <h5 class="lost" >You Lost</h5>
          <div class="actions">
            <button id="hit_${position}" class="hit" type="button" name="button">Hit</button>
            <button id="stay_${position}" class="stay" type="button" name="button">Stay</button>
          </div>
        </div>`;
    }
  }

  //Game creates an object that holds the deck as a private variable and all of the game-play methods
  class Game{
    constructor(){
      //Private variables- once newDeck is called it will be an array of 52 Card objects
      var self = this;
      var deck = [];
      //////////////////////////////Methods
      //Build a new deck
      this.newDeck = function(){
        //clear deck
        deck = [];
        for(var i = 0; i < suits.length; i++){
          //For each rank in each suit- build a card
          for(var rank in ranks){
            var color = "black";
            if(suits[i] === "hearts" || suits[i] === "diams"){
              color = "red";
            }
            var cardId = deck.length;
            var cardSuit = suits[i];
            var cardRank = rank;
            var cardValue = ranks[rank];
            var newCard = new Card(cardId, cardSuit, cardRank, cardValue, color);
            deck.push(newCard);
          }
        }
        return this;
      }
      //Shuffle the deck
      this.shuffle = function(){
        for (var i = 0; i < deck.length; i++) {
      		var rand1 = Math.floor(Math.random() * 52);
      		var rand2 = Math.floor(Math.random() * 52);
      		var value = deck[rand1]
      		deck[rand1] = deck[rand2];
      		deck[rand2] = value;
      	}
        return this;
      };
      //Show the next card to be delt- cards are delt from the end of the array because
      //pop() is less memory intesive than shift()
      this.getNext = function(){
        return deck[deck.length-1].id;
      }
      //Deal a single card to player
      this.deal = function(player){
        $('#deck').append('<div id="action_card" class="deal_card card"></div>');
        //Calculate where to send card based on location of player's hand and number of cards in hand
        var top = ($(`#hand_${player.position}`).offset().top - 96);
        var left = ($(`#hand_${player.position}`).offset().left - 48 + (20 * player.hand.length));
        var newCard = {};
        $('#action_card').css({
          'top' : `${top}px`,
          'left' : `${left}px`,
          'transform' : 'rotate(180deg)',
        });
        setTimeout(function(){
          $('#action_card').remove();
          newCard = deck.pop();
          player.hand.push(newCard);
          $(`#hand_${player.position}`).append(newCard.template);
        }, 600);
        return newCard.id;
      }
      //Initiates the dealing sequence at the beggining of each game- 2 cards to each player and the dealer
      this.dealAll = function(){
          console.log("Starting deal");
          var count = players.length -1;
          var rounds = setInterval(function(){
            var player = players[count];
            self.deal(player);
            count --;
            if(count < 0){
              console.log("clearing interval");
              clearInterval(rounds);
              console.log("Deal again:");
              if(players[0].hand.length === 0){
                self.dealAll()
              }
            }
          }, 900);
        return this;
      }
      //Adds event listeners to dynamically added player buttons in the DOM
      this.addEvents = function(player){
        //Gives player another card then evaluates the players score to see if they bust
        $(`#hit_${player.position}`).click(function(){
          console.log(player.name + " hits");
          var cardId = game.getNext();
          game.deal(player);
          setTimeout(function(){
            self.turnCard(cardId);
            player.cardSum = self.evaluate(player);
            if(player.cardSum > 21){
              $(`#player_${player.position}`).removeClass('playing');
              $(`#player_${player.position}`).addClass('bust');
              if(player.position > 1){
                self.takeTurn(players[player.position-1]);
              }
              else{
                self.dealersTurn();
              }
            }
          }, 1000)
        });
        //Moves the turn to the next player. If no next player- initiates dealer's turn
        $(`#stay_${player.position}`).click(function(){
          console.log(player.name + " stays");
          $(`#player_${player.position}`).removeClass('playing');
          $(`#player_${player.position}`).addClass('waiting');
          //player.cardSum = evaluate(player);
          console.log(`${player.name}'s cardSum is ${player.cardSum}'`);
          if(player.position > 1){
            self.takeTurn(players[player.position-1]);
          }
          else{
            self.dealersTurn();
          }
        });
      }
      //Turns a card to show it's face
      this.turnCard = function(id){
        var card = $(`#${id}`);
        card.css({'transform' : 'rotateY(0deg)'});
        setTimeout(function(){
          card.removeClass('back');
          card.addClass('front');
        }, 200)
      }
      //Opens a players action-buttons on their turn
      this.takeTurn = function(player){
        console.log(`${player.name}'s turn'`);
        player.cardSum = self.evaluate(player)
        $(`#player_${player.position}`).removeClass('waiting');
        $(`#player_${player.position}`).addClass('playing');
      }
      //Calculates the player's best score from their current cards
      //Aces are switched from 11 to 1 if needed to keep the player from busting
      this.evaluate = function(player){
        var aces = []
        //Sum the initial card values
        function checkSum(){
          var sum = 0;
          for (var i = 0; i < player.hand.length; i++) {
            console.log(player.hand[i].value);
            sum += player.hand[i].value;
            if(player.hand[i].rank === 'A'){
              aces.push(i);
            }
          }
          return sum;
        }
        var total = checkSum()
        //If 21 or under- return score
        if(total <= 21){
          console.log("Score is " + total);
          return total;
        }
        //If over 21 and no aces, player busts
        else if(aces.length == 0) {
          console.log("Bust");
          return total;
        }
        //If over 21 and has aces- for each ace, switch to 1 and re-sum the values
        //Returns the highest total less than or equal to 21
        else{
          for (var i = 0; i < aces.length; i++) {
            total -= 10;
            if(total < 21){
              console.log("Score is " + total);
              return total;
            }
          }
          //If all aces have been switched and the value is still over 21- player busts
          console.log("Bust");
          return total;
        }
      }
      //Dealer hits at 16 or below-
      this.dealersTurn = function(){
        console.log("Dealers Turn");
        self.turnCard(flipCard);
        var player = players[0];
        player.cardSum = self.evaluate(player);
        $('#dealer_sum').text(`Dealer's hand: ${player.cardSum}`);
        if(player.cardSum < 17){
          var cardId = game.getNext();
          game.deal(player);
          setTimeout(function(){
            self.turnCard(cardId);
            player.cardSum = self.evaluate(player);
            game.dealersTurn();
          }, 1000);
        }
        else{
          game.findWinner();
        }
      }
      //Evaluates all the scores and compares them to dealer's score to determin winners
      this.findWinner = function(){
        var dealerScore = players[0].cardSum;
        if(dealerScore > 21){
          dealerScore = 0;
        }
        console.log("Find Winner- Dealers cardSum is " + dealerScore);
        for (var i = players.length-1; i > 0; i--) {
          var player = players[i];
          if(player.cardSum > dealerScore && player.cardSum <= 21){
            console.log(`${player.name} is a winner!`);
            player.score += 1;
            $(`#player_${player.position}`).removeClass();
            $(`#player_${player.position}`).addClass('player winner');
          }
          else{
            console.log(`${player.name} loses!`);
            player.score -= 1;
            $(`#player_${player.position}`).removeClass();
            $(`#player_${player.position}`).addClass('player bust');
          }
          $(`#score_${player.position}`).text(player.score);
        }
        $('#deal').show();
      }
    }
  }

  //Shuffles the deck, clears the hand and sets up for a new round
  function newRound(){
    console.log("Starting Game");
    game = new Game();
    game.newDeck().shuffle().shuffle();
    for (var i = 0; i < players.length; i++) {
      players[i].cardSum = 0;
      players[i].hand = [];
      $('#dealer_sum').text("");
      $(`#hand_${i}`).empty();
      $(`#player_${i}`).removeClass();
      $(`#player_${i}`).addClass('player waiting');
    }
  }
  ////////////////////////////////////////////////////End of varaibles and functions
  //Add dealer to the players array
  var game = new Game();

  players.push(new Player('Dealer', 0));
  //Add event listeners to static DOM

  //Hide start-game button until at least one player is created
  $('#start_game').hide();

  //Add new player to game using player html template
  //Add-player button is hidden after 3 players created to restrict number of players
  $('#add_player').click(function(){
    $('#start_game').show();
    $('#game_info').text("");
    var name = $('#new_player_name').val();
    $('#new_player_name').val('');
    console.log("Creating new player");
    var newPlayer = new Player(name, players.length);
    players.push(newPlayer);
    $('#player_section').append(newPlayer.template);
    game.addEvents(newPlayer);
    if(players.length >= 4){
      $('.pre_game').hide();
    }
  });

  //Once all players have been added- starts game
  $('#start_game').click(function(){
    $('.pre_game').hide();
    $('.game_wrapper').removeClass('game_off');
    $('.game_wrapper').addClass('game_on');
  })

  //Starts new round and deals to all players
  $('#deal').click(function(){
    newRound();
    game.dealAll();
    $('#deal').hide();
    //Calculates how long the initial deal will take based on number of players
    //Then triggers flipping the cards
    setTimeout(function(){
      //Find an flip cards in the DOM
      $('.player_card').each(function(){
        //If the card is the dealers first card- do not flip but save id to be flipped at end of round
        if(this.id == players[0].hand[0].id){
          flipCard = this.id;
        }
        else{
          game.turnCard(this.id);
        }
      })
      game.takeTurn(players[players.length-1]);
      //Calculate wait time before flipping cards based on number of players
    }, (((players.length * 2) + .5) * 1000))
  });

  //Reset for a new game
  $('#new_game').click(function(){
    console.log("New Game");
    players = [new Player('Dealer', 0)];
    $('#hand_0').empty();
    $('#start_game').hide();
    $('.pre_game').show();
    $('#player_section').empty();
    $('.game_wrapper').removeClass('game_on');
    $('.game_wrapper').addClass('game_off');
  })
});
