import React, { useRef, useEffect, useState } from "react";
import Swal from "sweetalert2";

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;

const COLORS = ["cyan", "blue", "orange", "yellow", "green", "purple", "red"];
const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[2, 0, 0], [2, 2, 2]], // J
  [[0, 0, 3], [3, 3, 3]], // L
  [[4, 4], [4, 4]], // O
  [[0, 5, 5], [5, 5, 0]], // S
  [[0, 6, 0], [6, 6, 6]], // T
  [[7, 7, 0], [0, 7, 7]]  // Z
];

function randomPiece() {
  const index = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[index],
    color: COLORS[index]
  };
}

export default function Tetris() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextRef = useRef<HTMLCanvasElement>(null);

  const [board, setBoard] = useState<number[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  );
  const [piece, setPiece] = useState(randomPiece());
  const [nextPiece, setNextPiece] = useState(randomPiece());
  const [pos, setPos] = useState<[number, number]>([0, 3]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Draw board & piece
  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    // background
    context.fillStyle = "#111827";
    context.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

    // draw board
    board.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          context.fillStyle = COLORS[value - 1];
          context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
          context.strokeStyle = "black";
          context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      });
    });

    // draw current piece
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          context.fillStyle = piece.color;
          context.fillRect((pos[1] + x) * BLOCK_SIZE, (pos[0] + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
          context.strokeStyle = "black";
          context.strokeRect((pos[1] + x) * BLOCK_SIZE, (pos[0] + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      });
    });
  }, [board, piece, pos]);

  // Draw next piece
  useEffect(() => {
    const ctx = nextRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1f2937"; // gray-800
    ctx.fillRect(0, 0, 6 * BLOCK_SIZE, 6 * BLOCK_SIZE);

    nextPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          ctx.fillStyle = nextPiece.color;
          ctx.fillRect((x + 1) * BLOCK_SIZE, (y + 1) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
          ctx.strokeStyle = "black";
          ctx.strokeRect((x + 1) * BLOCK_SIZE, (y + 1) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      });
    });
  }, [nextPiece]);

  // Game over dialog
  useEffect(() => {
    if (gameOver) {
      Swal.fire({
        icon: "info",
        title: "Game Over",
        text: `Score: ${score}`,
        confirmButtonText: "Play Again"
      }).then(() => resetGame());
    }
  }, [gameOver]);

  // Keyboard & auto-drop
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowDown") drop();
      else if (e.key === "ArrowUp") rotate();
    };
    window.addEventListener("keydown", handleKey);
    const interval = setInterval(drop, 500);
    return () => {
      window.removeEventListener("keydown", handleKey);
      clearInterval(interval);
    };
  });

  const collide = (brd: number[][], p: any, pos: [number, number]) => {
    for (let y = 0; y < p.shape.length; y++) {
      for (let x = 0; x < p.shape[y].length; x++) {
        if (
          p.shape[y][x] &&
          (brd[y + pos[0]] && brd[y + pos[0]][x + pos[1]]) !== 0
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const merge = (brd: number[][], p: any, pos: [number, number]) => {
    p.shape.forEach((row: number[], y: number) => {
      row.forEach((value, x) => {
        if (value) {
          brd[y + pos[0]][x + pos[1]] = COLORS.indexOf(p.color) + 1;
        }
      });
    });
  };

  const resetGame = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setPiece(randomPiece());
    setNextPiece(randomPiece());
    setPos([0, 3]);
    setScore(0);
    setGameOver(false);
  };

  const drop = () => {
    const newPos: [number, number] = [pos[0] + 1, pos[1]];
    if (!collide(board, piece, newPos)) {
      setPos(newPos);
    } else {
      const newBoard = board.map(row => [...row]);
      merge(newBoard, piece, pos);

      // clear lines
      let lines = 0;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (newBoard[y].every(val => val !== 0)) {
          newBoard.splice(y, 1);
          newBoard.unshift(Array(COLS).fill(0));
          lines++;
          y++;
        }
      }
      if (lines > 0) setScore(s => s + lines * 100);

      // pakai nextPiece
      const startPos: [number, number] = [0, 3];
      if (collide(newBoard, nextPiece, startPos)) {
        setGameOver(true);
        return;
      }
      setBoard(newBoard);
      setPiece(nextPiece);
      setNextPiece(randomPiece());
      setPos(startPos);
    }
  };

  const move = (dir: number) => {
    const newPos: [number, number] = [pos[0], pos[1] + dir];
    if (!collide(board, piece, newPos)) {
      setPos(newPos);
    }
  };

  const rotate = () => {
    const rotated = piece.shape[0].map((_, i) =>
      piece.shape.map(row => row[i]).reverse()
    );
    const newPiece = { ...piece, shape: rotated };
    if (!collide(board, newPiece, pos)) {
      setPiece(newPiece);
    }
  };

  return (
    <div className="flex flex-col items-center mt-5">
      <h1 className="text-3xl font-bold mb-3">🎮 Tetris Game</h1>
      <p className="mb-2">Score: <span className="fw-bold">{score}</span></p>

      <div className="flex gap-6">
        {/* Main Game */}
        <canvas
          ref={canvasRef}
          width={COLS * BLOCK_SIZE}
          height={ROWS * BLOCK_SIZE}
          className="border-4 border-white rounded-lg"
        ></canvas>

        {/* Next Piece */}
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-bold mb-2">Next Piece</h2>
          <canvas
            ref={nextRef}
            width={6 * BLOCK_SIZE}
            height={6 * BLOCK_SIZE}
            className="border-2 border-white rounded-lg"
          ></canvas>
        </div>
      </div>

      <button onClick={resetGame} className="btn btn-primary mt-3">Restart</button>
    </div>
  );
}