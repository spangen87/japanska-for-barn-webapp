(function (globalScope) {
  const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  function createInitialSnake(cols, rows) {
    const centerX = Math.floor(cols / 2);
    const centerY = Math.floor(rows / 2);
    return [
      { x: centerX, y: centerY },
      { x: centerX - 1, y: centerY },
      { x: centerX - 2, y: centerY }
    ];
  }

  function normalizeDirection(next, fallback) {
    return Object.prototype.hasOwnProperty.call(DIRECTIONS, next) ? next : fallback;
  }

  function isOppositeDirection(a, b) {
    const da = DIRECTIONS[a];
    const db = DIRECTIONS[b];
    return da.x + db.x === 0 && da.y + db.y === 0;
  }

  function resolveDirection(current, requested) {
    const validRequested = normalizeDirection(requested, current);
    if (isOppositeDirection(current, validRequested)) {
      return current;
    }
    return validRequested;
  }

  function isOutOfBounds(position, cols, rows) {
    return position.x < 0 || position.y < 0 || position.x >= cols || position.y >= rows;
  }

  function isCellOnSnake(cell, snake) {
    return snake.some((segment) => segment.x === cell.x && segment.y === cell.y);
  }

  function placeFood(snake, cols, rows, randomFn) {
    const freeCells = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (!isCellOnSnake({ x, y }, snake)) {
          freeCells.push({ x, y });
        }
      }
    }

    if (freeCells.length === 0) {
      return null;
    }

    const random = typeof randomFn === 'function' ? randomFn : Math.random;
    const index = Math.floor(random() * freeCells.length);
    return freeCells[index];
  }

  function createInitialState(options) {
    const cols = options && Number.isInteger(options.cols) ? options.cols : 20;
    const rows = options && Number.isInteger(options.rows) ? options.rows : 20;
    const direction = options && options.direction ? normalizeDirection(options.direction, 'right') : 'right';
    const snake = options && Array.isArray(options.snake) ? options.snake.map((s) => ({ x: s.x, y: s.y })) : createInitialSnake(cols, rows);
    const randomFn = options && options.randomFn ? options.randomFn : Math.random;

    return {
      cols,
      rows,
      snake,
      direction,
      food: placeFood(snake, cols, rows, randomFn),
      score: 0,
      growth: 0,
      gameOver: false,
      won: false
    };
  }

  function step(state, requestedDirection, randomFn) {
    if (state.gameOver) {
      return state;
    }

    const direction = resolveDirection(state.direction, requestedDirection);
    const velocity = DIRECTIONS[direction];
    const head = state.snake[0];
    const nextHead = { x: head.x + velocity.x, y: head.y + velocity.y };

    const growingThisStep =
      state.food && nextHead.x === state.food.x && nextHead.y === state.food.y;
    const keepTail = state.growth > 0 || growingThisStep;
    const bodyToCheck = keepTail ? state.snake : state.snake.slice(0, -1);

    if (isOutOfBounds(nextHead, state.cols, state.rows) || isCellOnSnake(nextHead, bodyToCheck)) {
      return {
        ...state,
        direction,
        gameOver: true
      };
    }

    const nextSnake = [nextHead, ...state.snake];
    let nextGrowth = state.growth;
    if (!keepTail) {
      nextSnake.pop();
    } else if (state.growth > 0 && !growingThisStep) {
      nextGrowth -= 1;
    }

    if (growingThisStep) {
      nextGrowth += 1;
    }

    const nextScore = growingThisStep ? state.score + 1 : state.score;
    const nextFood = growingThisStep ? placeFood(nextSnake, state.cols, state.rows, randomFn) : state.food;

    const won = nextFood === null;

    return {
      ...state,
      snake: nextSnake,
      direction,
      food: nextFood,
      score: nextScore,
      growth: nextGrowth,
      won,
      gameOver: won ? true : state.gameOver
    };
  }

  const api = {
    DIRECTIONS,
    createInitialState,
    placeFood,
    step,
    resolveDirection,
    isOutOfBounds,
    isCellOnSnake
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  globalScope.SnakeCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
