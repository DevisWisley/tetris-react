import React, { useRef, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { Piece } from "./types";

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

const randomPiece = (): Piece => {
  const index = Math.floor(Math.random() * SHAPES.length);
  return {
    shape: SHAPES[index],
    color: COLORS[index]
  };
};

const Tetris: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [board, setBoard] = useState<number[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  );
  const [piece, setPiece] = useState<Piece>(randomPiece());
  const [pos, setPos] = useState<[number, number]>([0, 3]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) return;

    context.fillStyle = "#111827"; // Tailwind gray-900
    context.fillRect(0, 0, COLS * BLOCK_SIZE, ROWS * BLOCK_SIZE);

    board.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          context.fillStyle = COLORS[value - 1];
          context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
          context.strokeStyle = "black";
          context.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      });
    });

    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          context.fillStyle = piece.color;
          context.fillRect((pos[1] + x) * BLOCK_SIZE, (pos[0] + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
          context.strokeStyle = "black";
          context.strokeRect((pos[1] + x) * BLOCK_SIZE, (pos[0] + y) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      });
    });
  }, [board, piece, pos]);

  useEffect(() => {
    if (gameOver) {
      Swal.fire({
        icon: "info",
        title: "Game Over",
        text: `Score: ${score}`,
        confirmButtonText: "Play Again"
      }).then(() => {
        resetGame();
      });
    }
  }, [gameOver]);

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

  const collide = (brd: number[][], p: Piece, pos: [number, number]) => {
    for (let y = 0; y < p.shape.length; y++) {
      for (let x = 0; x < p.shape[y].length; x++) {
        if (p.shape[y][x] !== 0 &&
            (brd[y + pos[0]] && brd[y + pos[0]][x + pos[1]]) !== 0) {
          return true;
        }
      }
    }
    return false;
  };

  const merge = (brd: number[][], p: Piece, pos: [number, number]) => {
    p.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          brd[y + pos[0]][x + pos[1]] = COLORS.indexOf(p.color) + 1;
        }
      });
    });
  };

  const resetGame = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setPiece(randomPiece());
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

      // Clear lines
      let lines = 0;
      for (let y = ROWS - 1; y >= 0; y--) {
        if (newBoard[y].every(val => val !== 0)) {
          newBoard.splice(y, 1);
          newBoard.unshift(Array(COLS).fill(0));
          lines++;
          y++;
        }
      }
      if (lines > 0) setScore(score + lines * 100);

      // New piece
      const newPiece = randomPiece();
      const startPos: [number, number] = [0, 3];
      if (collide(newBoard, newPiece, startPos)) {
        setGameOver(true);
        return;
      }
      setBoard(newBoard);
      setPiece(newPiece);
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
      <canvas ref={canvasRef} width={COLS * BLOCK_SIZE} height={ROWS * BLOCK_SIZE} className="border-4 border-white rounded-lg"></canvas>
      <button onClick={resetGame} className="btn btn-primary mt-3">Restart</button>
    </div>
  );
};

export default Tetris;