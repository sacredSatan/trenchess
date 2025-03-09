# trenchess

~~working title~~ 

<img src="https://github.com/user-attachments/assets/3aa9b4f2-e18e-4cf4-a8c7-c77e3e53d4ca" width="175" alt="trenchess logo">

trenchess is regular chess, with an option to alter the properties of the game by playing various ability cards.

For those (me) who can't beat someone at regular chess, there's a slightly better chance with this one with the added element of luck. (It's not enough for me though).

## Gameplay loop
- each player starts with 4 cards (one of each type)
- every 4 moves they get an option to select upto 4 cards from 2 random cards + cards in hand
- playing a card switches turns (could be a potential out for zugzwang)
- regular game of chess otherwise

## Cards

### Trench

Dig a trench with a pawn, allowing no pieces to cross or occupy (except the Knight). Moving the pawn removes trench.

![trench in action](https://github.com/user-attachments/assets/7b7b473a-efe3-4445-b8a2-9022e4290ac2)

### Reverse Pawn

This is my favourite card, it basically reverses the direction a pawn moves in. The reversed pawn can no longer be promoted (since it'll never reach the opponent's back rank). Initially my idea was for the pawn to switch directions after it reaches its own backrank (as in, a white pawn on e, reaches e1), so essentially "promoting" it to be a regular pawn. But I think this version is good enough.

![reverse pawn in action](https://github.com/user-attachments/assets/bdafe5bc-6ccf-4799-8343-d9588c17f444)

### Portal

This works more like a tunnel, you pick squares to be the openings and any piece able to move to such squares can come out from any of the other openings. Only condition is that pawns can't reach the opposite backrank through portals, it's an invalid move. 

![portal in action](https://github.com/user-attachments/assets/70b900bc-63e3-49b1-b75d-767b879fd1a8)

### Clear

Just removes applied effect from a tile/piece.

### Caveats

One tile can only hold one modifier at a given time, for example, a pawn with "reverse pawn" modifier on it moving to a tile with "portal" will destroy the "portal" modifier from the tile.

![clear in action](https://github.com/user-attachments/assets/95ceef7d-f878-4796-b623-93cbccffb39c)


## Debug and Replay

Debug mode is not worth documenting, it's mostly for development by me, to set positions and test out game logic from those positions. Replay mode was quickly put together to record and keep some interesting games I've played and regretted not being able to save them.

### Replay

You can save and replay a game you've played by clicking/copying the link at the bottom of the page that says "inspect game for replay", that should take you to the replay mode. You can use "PREV" and "NEXT" buttons to move through the game. It's not the most convenient but it does the job.

[Here's a sample game link](https://sacredsatan.github.io/trenchess/?moveHistory=H4sIAAAAAAAAA82X30vDMBDH/5Wjz3noJel++CZs4h5EcIIPY4w0SX/A3ETqQMS/yv/Av8zbQJl1S9dla6WltD2Sy33uy10yeQuK1ycbXAT5Ii9yNR8XqrABC1Zq/kK/Jxgy5AyRoWAoNy/0GbJ+6Qo9L+zuuXuMk7XPODLONy/h+ifyDpll9/spmZy+s59oHperrSgCy8HKYL897oHuOOyGg3GN1x2Iey47QuLjP0HQtfxr9WzGdm51kS8XW+kMPj/o69fDgS1GUOIM01ZEmyJkwoO2ofGRB22LYHnztEmkyXloK1e0CsGgy15N27iyVeXfCIhd4//4Pw2WjJKMzdNea6tWtOXxArQP7cvBYHZzOxhdjYZ3s4fr0f0QFAeX2s/Ef8dC4tJCmsnIjoXomkSqZ0zcMx6xxvTUWauXq+yoXPmUKQ7Kp0yRuGLX+Cr/pAldy783EdJM0kKFImGlPqBJGZkP6B1iM/KfVCgr26hQFL6zw1b2DOnuOQd0aNMCf2p1tg3a3G8/tD5r+Og/KYfdDO1EQtrC7lN7apu0qX06ayqoNzdPW4nSga4Z2plwn0OraFO2Yh/aa5G1QFuL0oGyGdqxKB2fa9ImkSgf2pTtrAXaWQQmaqFuRwd1qekXmn4DLPMSAAA=)

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
  - players now start with one card of each type (4 total), and every 4 moves they get an option to select upto 4 cards, from 2 random cards + the cards already in their hand.
- Error handling (your only recourse currently is to reload the page and lose the state)
- Add tests to ensure that the classic chess implementation is bugfree at least
- Simple qol improvements like last move indicator, sound etc. But way down in the priority list.
