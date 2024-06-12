import { WebSocket } from "ws";
import { Chess } from "chess.js";
import { GAME_OVER, INIT_GAME, MOVE } from "./message";

export class Game {
  public player1: WebSocket;
  public player2: WebSocket;
  private board: Chess;
  private startTime: Date;
  private moveCount = 0;

  constructor(player1: WebSocket, player2: WebSocket) {
    this.player1 = player1;
    this.player2 = player2;
    this.board = new Chess();
    this.startTime = new Date();

    this.player1.send(JSON.stringify({
      type: INIT_GAME,
      payload: {
        color: "white"
      },
    }))
    this.player2.send(JSON.stringify({
      type: INIT_GAME,
      payload: {
        color: "black"
      },
    }))
  }

  makeMove(
    socket: WebSocket,
    move: {
      from: string;
      to: string;
    }
  ) {
    // Validate the type of move using zod
    if (this.moveCount % 2 === 0 && this.player1 !== socket) {
      return;
    }
    if (this.moveCount % 2 === 1 && this.player2 !== socket) {
      return;
    }

    console.log("after validate moves return");


    try {
      this.board.move(move);
    } catch (error) {
      return;
    }

    if (this.board.isGameOver()) {
      // Send the game over message to both players
      this.player1.emit(
        JSON.stringify({
          type: GAME_OVER,
          payload: this.board.turn() === "w" ? "black" : "white",
        })
      );

      this.player2.emit(
        JSON.stringify({
          type: GAME_OVER,
          payload: this.board.turn() === "w" ? "black" : "white",
        })
      );

      return;
    }

    if (this.moveCount % 2 === 0) {
      console.log("inside if");

      this.player2.send(
        JSON.stringify({
          type: MOVE,
          payload: move,
        })
      );
    } else {
      console.log("inside else");

      this.player1.send(
        JSON.stringify({
          type: MOVE,
          payload: move,
        })
      );
    }
    this.moveCount++;
  }
}