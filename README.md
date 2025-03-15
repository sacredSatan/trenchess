# trenchess

~~working title~~ 

<img src="https://github.com/user-attachments/assets/3aa9b4f2-e18e-4cf4-a8c7-c77e3e53d4ca" width="175" alt="trenchess logo">

trenchess is regular chess, with an option to alter the properties of the game by playing various ability cards.

For those (me) who can't beat someone at regular chess, there's a slightly better chance with this one with the added element of luck. (It's not enough for me though).

## Gameplay loop
- each player starts with _n_ cards (one of each type)
- every 4 moves they get an option to select cards from 2 random cards + cards in hand (max _n_ cards)
- playing a card switches turns (could be a potential out for zugzwang)
- regular game of chess otherwise

## Cards

### Trench

Dig a trench with a pawn, allowing no pieces to cross or occupy (except the Knight). Moving the pawn removes trench.

![trench in action](https://github.com/user-attachments/assets/7b7b473a-efe3-4445-b8a2-9022e4290ac2)

### Reverse Pawn

This is my 2nd favourite card, it basically reverses the direction a pawn moves in. The reversed pawn can no longer be promoted (since it'll never reach the opponent's back rank). Initially my idea was for the pawn to switch directions after it reaches its own backrank (as in, a white pawn on e, reaches e1), so essentially "promoting" it to be a regular pawn. But I think this version is good enough.

![reverse pawn in action](https://github.com/user-attachments/assets/bdafe5bc-6ccf-4799-8343-d9588c17f444)

### Shove Pawn

This is my favourite card, and in combination with reverse pawn it can be deadly. It essentially shoves a pawn forward, regardless of pawn colour. 

#### checkmate with a shove
![checkmate with the shove in action](https://github.com/user-attachments/assets/8905f754-0c72-4e52-8dc5-241729236ad4)

_my brother came up with this position_

#### block pieces with a shove
![shove in action](https://github.com/user-attachments/assets/c0d72f2b-6ced-412e-b228-023517d2e282)

_credit for this position also goes to my brother but he did it in a game with me_

### Portal

This works more like a tunnel, you pick squares to be the openings and any piece able to move to such squares can come out from any of the other openings. Only condition is that pawns can't reach the opposite backrank through portals, it's an invalid move. 

![portal in action](https://github.com/user-attachments/assets/70b900bc-63e3-49b1-b75d-767b879fd1a8)

### Clear

Just removes applied effect from a tile/piece.

![clear in action](https://github.com/user-attachments/assets/95ceef7d-f878-4796-b623-93cbccffb39c)


### Caveats

One tile can only hold one modifier at a given time, for example, a pawn with "reverse pawn" modifier on it moving to a tile with "portal" will destroy the "portal" modifier from the tile. Same happens when you use shove on a pawn.


## Debug and Replay

Debug mode is not worth documenting, it's mostly for development by me, to set positions and test out game logic from those positions. Replay mode was quickly put together to record and keep some interesting games I've played and regretted not being able to save them.

### Replay

You can save and replay a game you've played by clicking/copying the link at the bottom of the page that says "inspect game for replay", that should take you to the replay mode. You can use "PREV" and "NEXT" buttons to move through the game. It's not the most convenient but it does the job.

I used pako to compress the move state so it fits in the url. The sample link has over 115 moves each played by the players, which with the current implementation produces a move history of ~10k characters. pako reduces it to ~1.7k characters, allowing it to fit in the url. 

[Here's a sample game link](https://sacredsatan.github.io/trenchess/?moveHistory=H4sIAAAAAAAAA7Va227cNhD9FULPCrCkrulbWqeo0RYFmgJ9CIJAF0oy4CZtsQ1QFH3oHxnefdnXfEq+pCPb2ZVo5szMpsUahry0SGrOzOGZGb38K9n++atPvkiu3lxtr5rrF9tm65M0eddc/0Ffv7Sb1LrU2tRmqc3vLujPTfo0+Gw+82OrT/zUqaPRp6mzqXN3F5v5S+vKtKrzTfHwO0/zV3+nx6f55e27xVMk3hmfJ2C8Mr4A46M1QwbG29p0JRjvnenR+s8uLl5//8PF5deXz398/eV3z776lv7foBVXd/z8zeVPz81QGYeeoTbDao9d83v/wl/7bnv19s0C8uT9jv56f6BfH/7Zz5e3d5c3CbBwZ81YyGa/PU15N/uOn30g+yJ8YtZwZqOzON3xxCIDFoEBQ5BDA4cmcqZDkPrajLUcoAAb1oatM21+FkL309OiYPaIPdsc+mMEM7oDItAVxlcoDK1pkIW7MjBBOJ7hcaIJqQmjCNElIilrvFMCtIJ/D+HPsW0icIyZQWi0ZA3k75EZpxrOGHEi2gN0iZgXldDvuto0Mh5cef+BN3FP7qeNsCURHtDkTWl6yB4Ojw90P2SvDLNTBJumkKN5Dw3dAdFsKvoXFTb7j9g8AAQpML6jTLjgTbIK6SNyOlb8740WWYTiDBMpER0Cu8nweTtY00EipaNSSGUL7KRnzZCJtcYhPMn2PGikAzw8RXLTI+N0FRaDEYg7TFk+fOAQrhzD8Ui5YIMpo6qxpreqGLo5xpCEVUt86BMc8NCOhAeZG4YHnZVwyYHZUl9gPGLnnFPxUBg2OGDoYOorGf67ZHXiSaQ/qSJIFpQ8jci7m9r0NbJmhccH5v6JkjeENul2jXUW0u5oKJQYkS9J5cYpOhapERaNZBzoivE8EQqJKtjwY+4fkLnnPBONtxkODh8KFREcC42G89Q8cFas0RZcJZHwxFU91J6FQjLfEwPpOkhVZaBmBVRTahXIyPBl74IIF0C2tCknfFuhPzzKiM7KWye1fSbGPkTuDXILAlGuGM4GEZeHGmcmjWQ7Yig5wztxTEdI8HAOiPS02ryRMVB8EcSks3JBB+NUmUlZ1fI5rGpNTqq7l4nMIZFFYszzpenTyWk+KzY9UyHSm2xW+8oylcexR2wAYfUFXpH0jJfpkaMRZWefF3vHJ05Wba5LJKUsOZE/KWNwYrJjwndU1jVoSuQxY2YmpkoozLZWoXBU9FhixI32RJaAhbhyZfeSIERPmmOCi7kEA9eUq+HyCp95CGBmE+S3g6aZcYJudw6J+sDfxPGO6ZPcAvrp7MfayMBcGvNNLF/JHUa0xynDuSNtaBIeQLskCDIu0saQOUS43J4iTEuXnFsKXEdQf8SAxHQR7uPQMCxOcW42u4BG3x9WVsYQTiFVixo2i0t5KJ974jUVGyCIgucA0FKweo+tco+SIFw1yBgWU9Qul6JFScZH66gTB1y9peERlWgmZnxg9OIY6g2uMySq/q4a9EhUFuQeZ1XPPoazsquMc665HgJLs0yba+5A1eY3XUS1uK1JE8K3R+ZujEaXr7JuzoRDmIRyKeE6RPHk8zsFUHwzfaa5YQ+rWxluWjcWr8/1sR6tLzKOtPtHodHrTb/UKbjrAh997kEgVqBHb2GpsjQtNJ1joCuCZnhk///f2w6xgzZ8vYer/O4VaMSaTFhodUyPiAuthnmfgwutuRBO46/+BSUajo4CKAAA)

![replay mode in action](https://github.com/user-attachments/assets/57f5b492-43f4-49ce-a6fe-aefe885d0601)

## Why and How

Why is straightforward, I like making games. My brother plays chess, and I'm never going to beat him in regular chess. I thought adding an element of luck would even the odds, but it was nowhere close.

The idea for this game initially involved me learning to use 3d modelling in order to make a chess board where you can slide out squares like a sliding puzzle, or add things to the board, actually "physically" modifying the battleground. 

It was too far away, so this project started as a temporary measure, to figure out game logic while I learned to do 3d modelling. I ended up dropping my plans to learn 3d modelling, but I did make donuts. I might go back to it but it probably won't happen any time soon.

The engine is not a traditional chess engine that predicts best moves, and evaluates game position. I'm not skilled enough to write that, but I've kept myself from reading up about writing chess engines because I wanted to come up with solutions to everything myself.

## State of the release

The initial gameplay loop is complete. This is my most complete game releases in recent years.

You'll probably encounter bugs, I haven't even tested it other than just playing a bunch of games. 

### Engine
The code's probably unreadable. I've abandoned ideas in the middle, done the same thing multiple ways, etc. The implementation is not optimal, I just did what I could come up with. I'd make use of external resources next time, as I've finished one reference free implementation already. If I were to implement an engine again, I'd learn about how actual engines that can evaluate positions are made, and probably do it in a language that I'm not yet familiar with.

### Frontend
It started with CLI, but I quickly realized that web is the easiest to iterate on for me. I initially supported drag and drop etc, but it became too tedious. 

### p2p
It uses peerjs, once I settled on web as the interface, I wanted to use webrtc to make it playable remotely between two players. The goal was to learn to use webrtc, but I just ended up lifting code from one of the example repos, and moved on becase at the time, writing logic for the engine was way more fun. I'll probably revisit webrtc soon.

## Known issues
- ~~reverse pawn overwrites tile modifiers like trench/portal~~
  - ~~since the tile can only have one modifier at a time~~
  - I no longer consider this an issue. A tile can only have one modifier, and the latest occupying piece overwrites whatever previously was in there. 

## Todos

- ~~Instead of the random 6 cards at the beginning of the game, allow players to draw/discard cards after every n moves.~~
  - players now start with one card of each type (_n_ total), and every 4 moves they get an option to select cards from 2 random cards + the cards already in their hand (max _n_ cards).
- Error handling (your only recourse currently is to reload the page and lose the state)
- Add tests to ensure that the classic chess implementation is bugfree at least
- Simple qol improvements like last move indicator, sound etc. But way down in the priority list.
