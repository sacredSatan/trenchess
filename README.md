# trenchess

~~working title~~ 

![trenchess-logo](https://github.com/user-attachments/assets/3aa9b4f2-e18e-4cf4-a8c7-c77e3e53d4ca)

trenchess is regular Chess, with an option to alter the properties of the game by playing various ability cards. 

For those (me) who can't beat someone at regular chess, there's a slightly better chance with this one with the added element of luck. (It's not enough for me though).

## Gameplay loop
- each players start with 6 random cards
- playing a card switches turns (could be a potential out for zugzwang)
- regular game of chess otherwise

## Cards

### Trench

Dig a trench with a pawn, allowing no pieces to cross (except the Knight). Moving the pawn removes trench.

### Reverse Pawn

This is my favourite card, it basically reverses the direction a pawn moves in. The reversed pawn can no longer be promoted.

![reverse pawn in action](https://github.com/user-attachments/assets/bdafe5bc-6ccf-4799-8343-d9588c17f444)

### Portal

This works more like a tunnel, you pick squares to be the openings and any piece able to move to such squares can come out from any of the other openings.

### Clear

Just removes applied effect from a tile/piece.

## Why and How

Why is straightforward, I like making games. The idea for this game initially involved me learning to use 3d modelling in order to make a chess board where you can slide out squares like a sliding puzzle, or add things to the board, actually "physically" modifying the battleground. 

It was too far away, so this project started as a temporary measure, to figure out game logic while I learned to do 3d modelling. 

The engine is not a traditional chess engine, that predicts best moves, and evaluates game position. I'm not skilled enough to write that, but I've kept myself from reading up about writing chess engines because I wanted to come up with solutions to everything myself. 

## State of the release

The initial gameplay loop is complete. This is my most complete game releases in recent years.

You'll probably encounter bugs, I haven't even tested it other than just playing a bunch of games. 

### Engine
The code's probably unreadable. I've abandoned ideas in the middle, done the same thing multiple ways, etc. The implementation is not optimal, I just did what I could come up with. I'd make use of external resources next time.

### Frontend
It started with CLI, but I quickly realized that web is the easiest to iterate on for me. I initially supported drag and drop etc, but it became too tedious. 

### p2p
It uses peerjs, once I settled on web as the interface, I wanted to use webrtc to make it playable remotely between two players. The goal was to learn to use webrtc, but I just ended up lifting code from one of the example repos, and moved on becase at the time, writing logic for the engine was way more fun. I'll probably revisit webrtc soon.

## Potential Todos

- Instead of the random 6 cards at the beginning of the game, allow players to draw/discard cards after every n moves. 
- Error handling (your only recourse currently is to reload the page and lost the state)
- Add tests to ensure that the classic chess implementation is bugfree at least
