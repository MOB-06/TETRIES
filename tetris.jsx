import React, { useState, useEffect, useCallback, useRef } from 'react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 26;

// Theme configurations
const THEMES = {
  neon: {
    name: 'Neon',
    background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%)',
    primaryColor: '#00f5ff',
    secondaryColor: '#b026ff',
    accentColor: '#ff4757',
    boardBg: 'rgba(10, 14, 39, 0.8)',
    cellEmpty: 'rgba(255, 255, 255, 0.03)',
    cellBorder: 'rgba(255, 255, 255, 0.05)',
  },
  minimal: {
    name: 'Minimal',
    background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1d 50%, #0d0d0d 100%)',
    primaryColor: '#4ecdc4',
    secondaryColor: '#44a8a0',
    accentColor: '#95e1d3',
    boardBg: 'rgba(13, 13, 13, 0.9)',
    cellEmpty: 'rgba(255, 255, 255, 0.02)',
    cellBorder: 'rgba(78, 205, 196, 0.08)',
  },
  sunset: {
    name: 'Sunset',
    background: 'linear-gradient(135deg, #2d1b2e 0%, #5b2a56 50%, #2d1b2e 100%)',
    primaryColor: '#ff6b9d',
    secondaryColor: '#ff8c42',
    accentColor: '#ffa07a',
    boardBg: 'rgba(45, 27, 46, 0.85)',
    cellEmpty: 'rgba(255, 107, 157, 0.03)',
    cellBorder: 'rgba(255, 107, 157, 0.08)',
  },
  classic: {
    name: 'Classic',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
    primaryColor: '#4CAF50',
    secondaryColor: '#2196F3',
    accentColor: '#FFC107',
    boardBg: 'rgba(0, 0, 0, 0.8)',
    cellEmpty: 'rgba(255, 255, 255, 0.05)',
    cellBorder: 'rgba(255, 255, 255, 0.1)',
  },
  retro: {
    name: 'Retro',
    background: 'linear-gradient(135deg, #2c1810 0%, #4a2c1a 50%, #2c1810 100%)',
    primaryColor: '#ff6b35',
    secondaryColor: '#f7931e',
    accentColor: '#c1666b',
    boardBg: 'rgba(44, 24, 16, 0.9)',
    cellEmpty: 'rgba(255, 107, 53, 0.05)',
    cellBorder: 'rgba(255, 107, 53, 0.1)',
  }
};

// Tetromino shapes
const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: '#00f5ff' },
  O: { shape: [[1, 1], [1, 1]], color: '#ffd000' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#b026ff' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00ff88' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#ff4757' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#1e90ff' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#ff6b35' }
};

// Sound synthesis helper
const playTone = (frequency, duration, volume = 0.1, type = 'sine') => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch (e) {
    // Silently fail if audio context not available
  }
};

const TetrisGame = () => {
  // Game state
  const [board, setBoard] = useState(Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(null)));
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [heldPiece, setHeldPiece] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  // UI state
  const [showMenu, setShowMenu] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [theme, setTheme] = useState('neon');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalGames: 0,
    totalLines: 0,
    totalScore: 0,
    highScore: 0,
    piecesPlaced: 0,
    playTime: 0
  });

  const [sessionStartTime, setSessionStartTime] = useState(null);
  const gameLoopRef = useRef(null);
  const currentTheme = THEMES[theme];

  // Load saved data
  useEffect(() => {
    const savedStats = localStorage.getItem('tetrisStats');
    const savedTheme = localStorage.getItem('tetrisTheme');
    const savedSound = localStorage.getItem('tetrisSound');

    if (savedStats) setStats(JSON.parse(savedStats));
    if (savedTheme) setTheme(savedTheme);
    if (savedSound !== null) setSoundEnabled(savedSound === 'true');
  }, []);

  // Save statistics
  const saveStats = useCallback((newStats) => {
    localStorage.setItem('tetrisStats', JSON.stringify(newStats));
  }, []);

  // Sound effects
  const playSound = useCallback((type) => {
    if (!soundEnabled) return;

    switch (type) {
      case 'move':
        playTone(200, 0.05, 0.05);
        break;
      case 'rotate':
        playTone(300, 0.05, 0.05);
        break;
      case 'drop':
        playTone(150, 0.1, 0.1);
        break;
      case 'line':
        playTone(440, 0.15, 0.15);
        setTimeout(() => playTone(554, 0.15, 0.15), 100);
        break;
      case 'tetris':
        playTone(440, 0.1, 0.15);
        setTimeout(() => playTone(554, 0.1, 0.15), 100);
        setTimeout(() => playTone(659, 0.1, 0.15), 200);
        setTimeout(() => playTone(880, 0.2, 0.15), 300);
        break;
      case 'gameover':
        playTone(440, 0.2, 0.15);
        setTimeout(() => playTone(415, 0.2, 0.15), 200);
        setTimeout(() => playTone(392, 0.4, 0.15), 400);
        break;
      default:
        break;
    }
  }, [soundEnabled]);

  const getRandomPiece = () => {
    const pieces = Object.keys(TETROMINOES);
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    return {
      type: randomPiece,
      shape: TETROMINOES[randomPiece].shape,
      color: TETROMINOES[randomPiece].color
    };
  };

  const initGame = useCallback(() => {
    const first = getRandomPiece();
    const next = getRandomPiece();
    setCurrentPiece(first);
    setNextPiece(next);
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
    setBoard(Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(null)));
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setHeldPiece(null);
    setCanHold(true);
    setGameOver(false);
    setGameStarted(true);
    setShowMenu(false);
    setSessionStartTime(Date.now());

    setStats(prev => ({
      ...prev,
      totalGames: prev.totalGames + 1
    }));
  }, []);

  const checkCollision = useCallback((piece, pos) => {
    if (!piece) return true;

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;

          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }

          if (newY >= 0 && board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, [board]);

  // Get ghost piece position
  const getGhostPosition = useCallback(() => {
    if (!currentPiece) return null;

    let ghostY = position.y;
    while (!checkCollision(currentPiece, { x: position.x, y: ghostY + 1 })) {
      ghostY++;
    }
    return { x: position.x, y: ghostY };
  }, [currentPiece, position, checkCollision]);

  const mergePiece = useCallback((customPos = null) => {
    if (!currentPiece) return;

    const pos = customPos || position;
    const newBoard = board.map(row => [...row]);

    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardY = pos.y + y;
          const boardX = pos.x + x;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      }
    }

    setBoard(newBoard);
    playSound('drop');

    // Update pieces placed
    setStats(prev => {
      const updated = { ...prev, piecesPlaced: prev.piecesPlaced + 1 };
      saveStats(updated);
      return updated;
    });

    clearLines(newBoard);

    const newPiece = nextPiece;
    const newNext = getRandomPiece();
    setCurrentPiece(newPiece);
    setNextPiece(newNext);
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
    setCanHold(true);

    if (checkCollision(newPiece, { x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 })) {
      setGameOver(true);
      setGameStarted(false);
      playSound('gameover');

      // Update final stats
      const playTime = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
      setStats(prev => {
        const updated = {
          ...prev,
          playTime: prev.playTime + playTime,
          highScore: Math.max(prev.highScore, score)
        };
        saveStats(updated);
        return updated;
      });
    }
  }, [currentPiece, nextPiece, position, board, checkCollision, playSound, score, sessionStartTime, saveStats]);

  const clearLines = (boardState) => {
    let cleared = 0;
    const newBoard = boardState.filter(row => {
      if (row.every(cell => cell !== null)) {
        cleared++;
        return false;
      }
      return true;
    });

    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }

    if (cleared > 0) {
      const points = [0, 100, 300, 500, 800][cleared] * level;
      setScore(prev => prev + points);
      setLinesCleared(prev => {
        const newTotal = prev + cleared;
        setLevel(Math.floor(newTotal / 10) + 1);
        return newTotal;
      });
      setBoard(newBoard);

      // Update stats
      setStats(prev => {
        const updated = {
          ...prev,
          totalLines: prev.totalLines + cleared,
          totalScore: prev.totalScore + points
        };
        saveStats(updated);
        return updated;
      });

      // Play sound based on lines cleared
      if (cleared === 4) {
        playSound('tetris');
      } else {
        playSound('line');
      }
    }
  };

  const moveDown = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    const newPos = { x: position.x, y: position.y + 1 };

    if (checkCollision(currentPiece, newPos)) {
      mergePiece();
    } else {
      setPosition(newPos);
    }
  }, [currentPiece, position, gameOver, isPaused, checkCollision, mergePiece]);

  const moveHorizontal = useCallback((direction) => {
    if (!currentPiece || gameOver || isPaused) return;

    const newPos = { x: position.x + direction, y: position.y };

    if (!checkCollision(currentPiece, newPos)) {
      setPosition(newPos);
      playSound('move');
    }
  }, [currentPiece, position, gameOver, isPaused, checkCollision, playSound]);

  const rotate = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    const rotated = currentPiece.shape[0].map((_, i) =>
      currentPiece.shape.map(row => row[i]).reverse()
    );

    const rotatedPiece = { ...currentPiece, shape: rotated };

    if (!checkCollision(rotatedPiece, position)) {
      setCurrentPiece(rotatedPiece);
      playSound('rotate');
    }
  }, [currentPiece, position, gameOver, isPaused, checkCollision, playSound]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    let newPos = { ...position };
    while (!checkCollision(currentPiece, { x: newPos.x, y: newPos.y + 1 })) {
      newPos.y++;
    }

    setPosition(newPos);
    mergePiece(newPos);
  }, [currentPiece, position, gameOver, isPaused, checkCollision, mergePiece]);

  const holdPiece = useCallback(() => {
    if (!currentPiece || !canHold || gameOver || isPaused) return;

    if (heldPiece === null) {
      setHeldPiece(currentPiece);
      setCurrentPiece(nextPiece);
      setNextPiece(getRandomPiece());
    } else {
      const temp = currentPiece;
      setCurrentPiece(heldPiece);
      setHeldPiece(temp);
    }

    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 1, y: 0 });
    setCanHold(false);
    playSound('move');
  }, [currentPiece, heldPiece, nextPiece, canHold, gameOver, isPaused, playSound]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!gameStarted || showMenu || showSettings) return;

      switch (e.key) {
        case 'ArrowLeft':
          moveHorizontal(-1);
          break;
        case 'ArrowRight':
          moveHorizontal(1);
          break;
        case 'ArrowDown':
          moveDown();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          rotate();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'c':
        case 'C':
          holdPiece();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          setIsPaused(prev => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [moveHorizontal, moveDown, rotate, hardDrop, holdPiece, gameStarted, showMenu, showSettings]);

  // Game loop
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      const speed = Math.max(100, 1000 - (level - 1) * 80);
      gameLoopRef.current = setInterval(moveDown, speed);
      return () => clearInterval(gameLoopRef.current);
    }
  }, [gameStarted, gameOver, isPaused, level, moveDown]);

  // Social sharing
  const shareScore = useCallback((platform) => {
    const text = `I scored ${score} points in Tetris! Level ${level}, ${linesCleared} lines cleared.`;
    const url = window.location.href;

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  }, [score, level, linesCleared]);

  const renderPiece = (piece, cellSize = CELL_SIZE, isGhost = false) => {
    if (!piece) return null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {piece.shape.map((row, y) => (
          <div key={y} style={{ display: 'flex', gap: '1px' }}>
            {row.map((cell, x) => (
              <div
                key={x}
                style={{
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: cell ? (isGhost ? 'transparent' : piece.color) : 'transparent',
                  border: cell ? `${isGhost ? 2 : 1}px ${isGhost ? 'dashed' : 'solid'} ${piece.color}` : 'none',
                  boxShadow: cell && !isGhost ? `0 0 10px ${piece.color}40, inset 0 0 10px ${piece.color}20` : 'none',
                  borderRadius: '2px',
                  opacity: isGhost ? 0.3 : 1
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    const ghostPos = getGhostPosition();

    // Render ghost piece
    if (currentPiece && !gameOver && ghostPos) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = ghostPos.y + y;
            const boardX = ghostPos.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH && !displayBoard[boardY][boardX]) {
              displayBoard[boardY][boardX] = 'ghost';
            }
          }
        }
      }
    }

    // Render current piece
    if (currentPiece && !gameOver) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              displayBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) => (
      <div key={y} style={{ display: 'flex', gap: '1px' }}>
        {row.map((cell, x) => (
          <div
            key={x}
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: cell === 'ghost' ? 'transparent' : (cell || currentTheme.cellEmpty),
              border: cell === 'ghost' ? `2px dashed ${currentPiece?.color}50` : (cell ? `1px solid ${cell}` : `1px solid ${currentTheme.cellBorder}`),
              boxShadow: cell && cell !== 'ghost' ? `0 0 10px ${cell}40, inset 0 0 10px ${cell}20` : 'none',
              borderRadius: '2px',
              transition: 'all 0.1s ease',
              opacity: cell === 'ghost' ? 0.3 : 1
            }}
          />
        ))}
      </div>
    ));
  };

  // Mobile touch controls
  const TouchControls = () => (
    <div style={{
      display: 'flex',
      gap: '15px',
      marginTop: '20px',
      justifyContent: 'center',
      flexWrap: 'wrap'
    }}>
      <button onClick={() => moveHorizontal(-1)} style={touchButtonStyle}>◄</button>
      <button onClick={() => moveHorizontal(1)} style={touchButtonStyle}>►</button>
      <button onClick={rotate} style={touchButtonStyle}>↻</button>
      <button onClick={hardDrop} style={touchButtonStyle}>▼</button>
      <button onClick={holdPiece} style={touchButtonStyle}>HOLD</button>
      <button onClick={() => setIsPaused(!isPaused)} style={touchButtonStyle}>⏸</button>
    </div>
  );

  const touchButtonStyle = {
    padding: '15px 20px',
    fontSize: '18px',
    fontWeight: '700',
    fontFamily: '"Orbitron", sans-serif',
    background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})`,
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: `0 0 20px ${currentTheme.primaryColor}50`,
    transition: 'all 0.3s ease',
    minWidth: '60px'
  };

  // Main Menu
  if (showMenu && !gameStarted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: currentTheme.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '"Orbitron", "Rajdhani", sans-serif',
        color: '#fff'
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap" rel="stylesheet" />

        <h1 style={{
          fontSize: '80px',
          fontWeight: '900',
          margin: '0 0 20px 0',
          background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor}, ${currentTheme.accentColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: `0 0 30px ${currentTheme.primaryColor}50`,
          letterSpacing: '12px'
        }}>
          TETRIS
        </h1>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          marginTop: '40px',
          minWidth: '300px'
        }}>
          <button onClick={initGame} style={{
            padding: '20px 40px',
            fontSize: '24px',
            fontWeight: '700',
            fontFamily: '"Orbitron", sans-serif',
            letterSpacing: '3px',
            background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})`,
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: `0 0 30px ${currentTheme.primaryColor}50`,
            transition: 'all 0.3s ease'
          }}>
            START GAME
          </button>

          <button onClick={() => setShowStats(true)} style={{
            padding: '15px 40px',
            fontSize: '18px',
            fontWeight: '700',
            fontFamily: '"Orbitron", sans-serif',
            letterSpacing: '3px',
            background: 'transparent',
            border: `2px solid ${currentTheme.primaryColor}`,
            borderRadius: '12px',
            color: currentTheme.primaryColor,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            STATISTICS
          </button>

          <button onClick={() => setShowSettings(true)} style={{
            padding: '15px 40px',
            fontSize: '18px',
            fontWeight: '700',
            fontFamily: '"Orbitron", sans-serif',
            letterSpacing: '3px',
            background: 'transparent',
            border: `2px solid ${currentTheme.primaryColor}`,
            borderRadius: '12px',
            color: currentTheme.primaryColor,
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}>
            SETTINGS
          </button>
        </div>

        {stats.highScore > 0 && (
          <div style={{
            marginTop: '40px',
            textAlign: 'center',
            fontFamily: '"Rajdhani", sans-serif'
          }}>
            <div style={{
              fontSize: '14px',
              letterSpacing: '3px',
              color: currentTheme.primaryColor,
              marginBottom: '5px'
            }}>
              HIGH SCORE
            </div>
            <div style={{
              fontSize: '48px',
              fontWeight: '700',
              color: '#fff',
              textShadow: `0 0 20px ${currentTheme.primaryColor}50`
            }}>
              {stats.highScore.toString().padStart(6, '0')}
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: currentTheme.boardBg,
              border: `2px solid ${currentTheme.primaryColor}`,
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '500px',
              width: '90%',
              backdropFilter: 'blur(10px)'
            }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '700',
                marginBottom: '30px',
                color: currentTheme.primaryColor,
                letterSpacing: '4px'
              }}>SETTINGS</h2>

              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '16px',
                  letterSpacing: '2px',
                  marginBottom: '10px',
                  color: currentTheme.primaryColor
                }}>THEME</label>
                <select
                  value={theme}
                  onChange={(e) => {
                    setTheme(e.target.value);
                    localStorage.setItem('tetrisTheme', e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    fontFamily: '"Orbitron", sans-serif',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: `1px solid ${currentTheme.primaryColor}`,
                    borderRadius: '8px',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <option value="neon">Neon</option>
                  <option value="minimal">Minimal</option>
                  <option value="sunset">Sunset</option>
                  <option value="classic">Classic</option>
                  <option value="retro">Retro</option>
                </select>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '16px',
                  letterSpacing: '2px',
                  cursor: 'pointer',
                  color: '#fff'
                }}>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => {
                      setSoundEnabled(e.target.checked);
                      localStorage.setItem('tetrisSound', e.target.checked);
                    }}
                    style={{ marginRight: '12px', width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  SOUND EFFECTS
                </label>
              </div>

              <button onClick={() => setShowSettings(false)} style={{
                width: '100%',
                padding: '15px',
                fontSize: '18px',
                fontWeight: '700',
                fontFamily: '"Orbitron", sans-serif',
                letterSpacing: '3px',
                background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})`,
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                cursor: 'pointer',
                marginTop: '20px'
              }}>
                CLOSE
              </button>
            </div>
          </div>
        )}

        {/* Statistics Modal */}
        {showStats && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: currentTheme.boardBg,
              border: `2px solid ${currentTheme.primaryColor}`,
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '500px',
              width: '90%',
              backdropFilter: 'blur(10px)'
            }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '700',
                marginBottom: '30px',
                color: currentTheme.primaryColor,
                letterSpacing: '4px'
              }}>STATISTICS</h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                fontFamily: '"Rajdhani", sans-serif',
                fontSize: '16px'
              }}>
                <StatItem label="Total Games" value={stats.totalGames} theme={currentTheme} />
                <StatItem label="High Score" value={stats.highScore} theme={currentTheme} />
                <StatItem label="Total Lines" value={stats.totalLines} theme={currentTheme} />
                <StatItem label="Total Score" value={stats.totalScore} theme={currentTheme} />
                <StatItem label="Pieces Placed" value={stats.piecesPlaced} theme={currentTheme} />
                <StatItem label="Play Time" value={`${Math.floor(stats.playTime / 60)}m`} theme={currentTheme} />
              </div>

              <button onClick={() => setShowStats(false)} style={{
                width: '100%',
                padding: '15px',
                fontSize: '18px',
                fontWeight: '700',
                fontFamily: '"Orbitron", sans-serif',
                letterSpacing: '3px',
                background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})`,
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                cursor: 'pointer',
                marginTop: '30px'
              }}>
                CLOSE
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Game UI
  return (
    <div style={{
      minHeight: '100vh',
      background: currentTheme.background,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '"Orbitron", "Rajdhani", sans-serif',
      color: '#fff',
      position: 'relative'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@300;400;600&display=swap" rel="stylesheet" />

      {/* Back to Home Button */}
      <button
        onClick={() => {
          setShowMenu(true);
          setGameStarted(false);
          setIsPaused(false);
        }}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          padding: '12px 20px',
          fontSize: '16px',
          fontWeight: '700',
          fontFamily: '"Orbitron", sans-serif',
          letterSpacing: '2px',
          background: `${currentTheme.primaryColor}20`,
          border: `2px solid ${currentTheme.primaryColor}`,
          borderRadius: '8px',
          color: currentTheme.primaryColor,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          zIndex: 100
        }}
        onMouseEnter={(e) => {
          e.target.style.background = `${currentTheme.primaryColor}40`;
        }}
        onMouseLeave={(e) => {
          e.target.style.background = `${currentTheme.primaryColor}20`;
        }}
      >
        ← HOME
      </button>

      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '25px'
      }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: '900',
          margin: '0 0 8px 0',
          background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor}, ${currentTheme.accentColor})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '6px'
        }}>
          TETRIS
        </h1>
        <div style={{
          display: 'flex',
          gap: '18px',
          justifyContent: 'center',
          fontSize: '13px',
          letterSpacing: '2px',
          color: currentTheme.primaryColor,
          fontFamily: '"Rajdhani", sans-serif',
          flexWrap: 'wrap'
        }}>
          <span>LEVEL {level}</span>
          <span>SCORE {score.toString().padStart(6, '0')}</span>
          <span>HIGH {stats.highScore.toString().padStart(6, '0')}</span>
        </div>
      </div>

      {/* Game Container */}
      <div style={{
        display: 'flex',
        gap: '18px',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {/* Left Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Panel title="HOLD" theme={currentTheme}>
            <div style={{
              width: '100px',
              height: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px'
            }}>
              {heldPiece && renderPiece(heldPiece, 20)}
            </div>
          </Panel>

          <Panel title="STATS" theme={currentTheme}>
            <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: '14px' }}>
              <StatRow label="SCORE" value={score.toString().padStart(6, '0')} color="#fff" />
              <StatRow label="LEVEL" value={level} color={currentTheme.accentColor} />
              <StatRow label="LINES" value={linesCleared} color={currentTheme.secondaryColor} />
            </div>
          </Panel>
        </div>

        {/* Game Board */}
        <div style={{
          background: currentTheme.boardBg,
          border: `2px solid ${currentTheme.primaryColor}`,
          borderRadius: '10px',
          padding: '12px',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 50px ${currentTheme.primaryColor}30`,
          position: 'relative'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {renderBoard()}
          </div>

          {!gameStarted && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(10, 14, 39, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              gap: '20px'
            }}>
              <div style={{
                fontSize: '32px',
                fontWeight: '700',
                color: currentTheme.primaryColor,
                textShadow: `0 0 20px ${currentTheme.primaryColor}80`
              }}>
                {gameOver ? 'GAME OVER' : 'TETRIS'}
              </div>

              {gameOver && (
                <>
                  <div style={{
                    fontSize: '16px',
                    color: '#fff',
                    fontFamily: '"Rajdhani", sans-serif'
                  }}>
                    Score: {score} | Lines: {linesCleared}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginTop: '10px'
                  }}>
                    <ShareButton icon="𝕏" onClick={() => shareScore('twitter')} theme={currentTheme} />
                    <ShareButton icon="f" onClick={() => shareScore('facebook')} theme={currentTheme} />
                    <ShareButton icon="W" onClick={() => shareScore('whatsapp')} theme={currentTheme} />
                    <ShareButton icon="T" onClick={() => shareScore('telegram')} theme={currentTheme} />
                  </div>
                </>
              )}

              <button onClick={initGame} style={{
                padding: '15px 40px',
                fontSize: '18px',
                fontWeight: '700',
                fontFamily: '"Orbitron", sans-serif',
                letterSpacing: '3px',
                background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})`,
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: `0 0 20px ${currentTheme.primaryColor}50`
              }}>
                {gameOver ? 'PLAY AGAIN' : 'START GAME'}
              </button>

              <button onClick={() => setShowMenu(true)} style={{
                padding: '10px 30px',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: '"Orbitron", sans-serif',
                letterSpacing: '2px',
                background: 'transparent',
                border: `2px solid ${currentTheme.primaryColor}`,
                borderRadius: '8px',
                color: currentTheme.primaryColor,
                cursor: 'pointer'
              }}>
                MAIN MENU
              </button>
            </div>
          )}

          {isPaused && gameStarted && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(10, 14, 39, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              gap: '20px'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: '700',
                color: currentTheme.primaryColor,
                textShadow: `0 0 30px ${currentTheme.primaryColor}80`,
                letterSpacing: '8px'
              }}>
                PAUSED
              </div>
              <button onClick={() => setIsPaused(false)} style={{
                padding: '15px 40px',
                fontSize: '18px',
                fontWeight: '700',
                fontFamily: '"Orbitron", sans-serif',
                letterSpacing: '3px',
                background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.secondaryColor})`,
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer'
              }}>
                RESUME
              </button>
              <button onClick={() => {
                setShowMenu(true);
                setGameStarted(false);
                setIsPaused(false);
              }} style={{
                padding: '10px 30px',
                fontSize: '14px',
                fontWeight: '700',
                fontFamily: '"Orbitron", sans-serif',
                letterSpacing: '2px',
                background: 'transparent',
                border: `2px solid ${currentTheme.primaryColor}`,
                borderRadius: '8px',
                color: currentTheme.primaryColor,
                cursor: 'pointer'
              }}>
                MAIN MENU
              </button>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Panel title="NEXT" theme={currentTheme}>
            <div style={{
              width: '100px',
              height: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px'
            }}>
              {nextPiece && renderPiece(nextPiece, 20)}
            </div>
          </Panel>

          <Panel title="CONTROLS" theme={currentTheme}>
            <div style={{
              fontFamily: '"Rajdhani", sans-serif',
              fontSize: '13px',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <ControlRow keys="← →" action="Move" />
              <ControlRow keys="↑ / W" action="Rotate" />
              <ControlRow keys="↓" action="Soft Drop" />
              <ControlRow keys="SPACE" action="Hard Drop" />
              <ControlRow keys="C" action="Hold" />
              <ControlRow keys="P/ESC" action="Pause" />
            </div>
          </Panel>
        </div>
      </div>

      {/* Mobile Controls */}
      <div style={{ display: window.innerWidth <= 768 ? 'block' : 'none' }}>
        {gameStarted && <TouchControls />}
      </div>
    </div>
  );
};

// Helper Components
const Panel = ({ title, children, theme }) => (
  <div style={{
    background: 'rgba(10, 14, 39, 0.6)',
    border: `1px solid ${theme.primaryColor}40`,
    borderRadius: '10px',
    padding: '12px',
    backdropFilter: 'blur(10px)',
    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`
  }}>
    <div style={{
      fontSize: '11px',
      letterSpacing: '2px',
      color: theme.primaryColor,
      marginBottom: '10px',
      fontFamily: '"Rajdhani", sans-serif'
    }}>{title}</div>
    {children}
  </div>
);

const StatItem = ({ label, value, theme }) => (
  <div>
    <div style={{
      fontSize: '12px',
      letterSpacing: '2px',
      color: theme.primaryColor,
      marginBottom: '5px'
    }}>{label}</div>
    <div style={{
      fontSize: '24px',
      fontWeight: '700',
      color: '#fff'
    }}>{value}</div>
  </div>
);

const StatRow = ({ label, value, color }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  }}>
    <span style={{ fontSize: '12px', letterSpacing: '2px' }}>{label}</span>
    <span style={{ fontSize: '16px', fontWeight: '700', color }}>{value}</span>
  </div>
);

const ControlRow = ({ keys, action }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px'
  }}>
    <span>{keys}</span>
    <span style={{ color: '#00f5ff' }}>{action}</span>
  </div>
);

const ShareButton = ({ icon, onClick, theme }) => (
  <button onClick={onClick} style={{
    width: '40px',
    height: '40px',
    fontSize: '18px',
    fontWeight: '700',
    background: `${theme.primaryColor}30`,
    border: `1px solid ${theme.primaryColor}`,
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  }}>
    {icon}
  </button>
);

export default TetrisGame;
