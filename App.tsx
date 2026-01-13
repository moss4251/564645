
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Direction, Facing, Hand, Position, GridQuestion, LeftRightQuestion } from './types';
import { ANIMALS, GRID_SIZE } from './constants';
import LeftRightTest from './components/LeftRightTest';
import GridTest from './components/GridTest';
import { getTeacherEncouragement } from './services/geminiService';

// --- Audio System ---
let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  // Resume on interaction if suspended (crucial for mobile)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

const playSound = (type: 'correct' | 'wrong' | 'win') => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  // Master gain for this effect to avoid clipping
  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.value = 0.5;

  if (type === 'correct' || type === 'win') {
    // Applause Effect
    const duration = type === 'win' ? 3.5 : 1.5;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // 1. Generate Pink Noise (Base for claps)
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; 
    }

    // 2. Trigger Claps
    const clapCount = type === 'win' ? 30 : 12; 
    
    for (let i = 0; i < clapCount; i++) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        filter.type = 'lowpass';
        filter.frequency.value = 800 + Math.random() * 800; 
        
        const spread = type === 'win' ? duration * 0.9 : duration * 0.7;
        const start = ctx.currentTime + (Math.random() * spread);
        
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(0.3, start + 0.01); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(masterGain);
        source.start(start);
    }
    
    // 3. Success Chime (Overlay)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    osc.type = 'sine';
    
    if (type === 'correct') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.linearRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        oscGain.gain.setValueAtTime(0.1, ctx.currentTime);
        oscGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
    } else {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1046.50, ctx.currentTime + 0.4);
        oscGain.gain.setValueAtTime(0.2, ctx.currentTime);
        oscGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
    }
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.8);

  } else if (type === 'wrong') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(masterGain);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0); // 0 to 9
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'FAIL' | 'WIN'>('START');
  const [lrQuestion, setLrQuestion] = useState<LeftRightQuestion | null>(null);
  const [gridQuestion, setGridQuestion] = useState<GridQuestion | null>(null);
  const [teacherMsg, setTeacherMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // --- Question Generation Logic ---

  const generateLR = useCallback((forcedFacing?: Facing) => {
    const facings = [Facing.FRONT, Facing.BACK];
    const hands = [Hand.LEFT, Hand.RIGHT];
    return {
      facing: forcedFacing || facings[Math.floor(Math.random() * facings.length)],
      handRaised: hands[Math.floor(Math.random() * hands.length)]
    };
  }, []);

  const generateGrid = useCallback(() => {
    // 1. Turtle Center (1, 1)
    const turtlePos = { x: 1, y: 1 };
    
    // 2. Valid Neighbors (Cardinal only)
    const validNeighbors: Position[] = [
        { x: 1, y: 0 }, { x: 1, y: 2 }, { x: 0, y: 1 }, { x: 2, y: 1 }
    ];

    // 3. Randomize positions
    const pickedPos = validNeighbors.sort(() => Math.random() - 0.5).slice(0, 3);
    const others = ANIMALS.filter(a => a.id !== 'turtle');

    const animalPlacements = others.map((animal, i) => {
      const targetPos = pickedPos[i];
      const dx = targetPos.x - turtlePos.x;
      const dy = targetPos.y - turtlePos.y;

      let clue = "";
      const useSelfRelative = Math.random() > 0.5;

      if (useSelfRelative) {
        if (dx < 0) clue = `我在小乌龟的 ${Direction.LEFT} 边`; 
        else if (dx > 0) clue = `我在小乌龟的 ${Direction.RIGHT} 边`; 
        else if (dy < 0) clue = `我在小乌龟的 ${Direction.UP} 边`; 
        else if (dy > 0) clue = `我在小乌龟的 ${Direction.DOWN} 边`; 
      } else {
        if (dx < 0) clue = `小乌龟在我的 ${Direction.RIGHT} 边`;
        else if (dx > 0) clue = `小乌龟在我的 ${Direction.LEFT} 边`;
        else if (dy < 0) clue = `小乌龟在我的 ${Direction.DOWN} 边`;
        else if (dy > 0) clue = `小乌龟在我的 ${Direction.UP} 边`;
      }

      return { animal, clue, targetPos };
    });

    return { turtlePos, animalPlacements };
  }, []);

  const prepareStep = useCallback((step: number) => {
    // Logic:
    // Q1, Q2 (Idx 0, 1): Back Facing
    // Q3, Q4, Q5 (Idx 2, 3, 4): Front Facing
    // Q6-Q10 (Idx 5+): Grid
    
    if (step < 5) {
      const facing = step < 2 ? Facing.BACK : Facing.FRONT;
      setLrQuestion(generateLR(facing));
      setGridQuestion(null);
    } else {
      setGridQuestion(generateGrid());
      setLrQuestion(null);
    }
  }, [generateLR, generateGrid]);

  // --- Game Flow Handlers ---

  const handleStart = () => {
    getAudioContext(); // Init audio context
    playSound('correct'); // Start chime
    setCurrentStep(0);
    setGameState('PLAYING');
    prepareStep(0);
  };

  const handleNextLevel = () => {
    const nextStep = currentStep + 1;
    
    // Play sound immediately
    if (nextStep >= 10) {
        playSound('win');
    } else {
        playSound('correct');
    }

    // Start fade transition
    setIsTransitioning(true);

    // Wait for fade out, then update state
    setTimeout(() => {
        if (nextStep >= 10) {
            handleWin();
            setIsTransitioning(false); 
        } else {
            setCurrentStep(nextStep);
            prepareStep(nextStep);
            // Short delay to allow render before fading in
            setTimeout(() => {
                setIsTransitioning(false);
            }, 50);
        }
    }, 500); 
  };

  const handleRestart = async () => {
    playSound('wrong');
    setGameState('FAIL');
    // Specific teacher message requested
    setTeacherMsg("加油，再试试，吕老师相信你可以的🙂");
    setIsLoading(false);
  };

  const handleWin = async () => {
    setGameState('WIN');
    setIsLoading(true);
    // Use Gemini for a dynamic win message only
    const msg = await getTeacherEncouragement(true, 10);
    setTeacherMsg(msg);
    setIsLoading(false);
  };

  // --- Input Handlers ---

  const handleLRAnswer = (answer: Hand) => {
    if (!lrQuestion || isTransitioning) return;
    
    if (answer === lrQuestion.handRaised) {
      handleNextLevel();
    } else {
      handleRestart();
    }
  };

  const handleGridAnswer = (placements: Record<string, Position>) => {
    if (!gridQuestion || isTransitioning) return;
    
    const isCorrect = gridQuestion.animalPlacements.every(p => {
      const userPos = placements[p.animal.id];
      return userPos && userPos.x === p.targetPos.x && userPos.y === p.targetPos.y;
    });

    if (isCorrect) {
      handleNextLevel();
    } else {
      handleRestart();
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-sky-50 overflow-hidden shadow-2xl relative select-none">
      {/* Header */}
      <div className="bg-sky-500 px-3 py-2 text-white flex justify-between items-center shadow-md z-10 shrink-0">
        <div>
          <h1 className="text-lg font-bold comic-font tracking-wider">方位大作战</h1>
          <div className="flex items-center gap-2 text-[10px] opacity-90">
            <span className="bg-white/20 px-2 py-0.5 rounded-full">第 {currentStep + 1} / 10 关</span>
            <span>{currentStep < 5 ? '左右分辨' : '九宫格'}</span>
          </div>
        </div>
        <div className="flex gap-0.5">
            {/* Dots */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    i < currentStep ? 'bg-yellow-300' : 
                    i === currentStep ? 'bg-white scale-125 ring-2 ring-white/50' : 
                    'bg-sky-700'
                }`}
              />
            ))}
        </div>
      </div>

      {/* Main Area */}
      <main className="flex-1 p-2 relative flex flex-col overflow-hidden">
        {gameState === 'START' && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-2">
              <div className="text-7xl animate-bounce mb-4">🧭</div>
              <h2 className="text-2xl font-black text-sky-800 comic-font">准备好挑战了吗？</h2>
              <p className="text-gray-600 px-8 text-sm">
                连续答对 <strong className="text-orange-500 text-lg">10</strong> 道题<br/>
                通关有惊喜哦！
              </p>
            </div>
            <button 
              onClick={handleStart}
              className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-xl py-4 px-12 rounded-full shadow-[0_6px_0_rgb(194,65,12)] active:shadow-none active:translate-y-2 transition-all"
            >
              开始闯关
            </button>
          </div>
        )}

        {gameState === 'PLAYING' && (
          <div 
            className={`flex-1 flex flex-col h-full justify-center transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
          >
            {currentStep < 5 && lrQuestion && (
              <LeftRightTest 
                facing={lrQuestion.facing} 
                handRaised={lrQuestion.handRaised} 
                onAnswer={handleLRAnswer} 
              />
            )}
            {currentStep >= 5 && gridQuestion && (
              <GridTest 
                question={gridQuestion} 
                onAnswer={handleGridAnswer} 
              />
            )}
          </div>
        )}

        {(gameState === 'FAIL' || gameState === 'WIN') && (
          <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in slide-in-from-bottom duration-500 backdrop-blur-sm">
            <div className="text-8xl mb-2 filter drop-shadow-lg">
                {gameState === 'WIN' ? '🎉' : '💪'}
            </div>
            
            <h2 className={`text-3xl font-black comic-font tracking-widest ${gameState === 'WIN' ? 'text-yellow-500' : 'text-sky-700'}`}>
              {gameState === 'WIN' ? '挑战成功！' : '加油！'}
            </h2>
            
            <div className="w-full bg-sky-50 p-4 rounded-3xl border-2 border-sky-200 relative mt-6 max-w-xs mx-auto">
               <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-3xl bg-white rounded-full p-1 border-2 border-sky-200">👩‍🏫</div>
               <p className="text-sky-900 font-medium italic text-base pt-3 leading-relaxed">
                 {isLoading ? "老师正在思考评语..." : `“${teacherMsg}”`}
               </p>
            </div>

            <button 
              onClick={handleStart}
              className="mt-6 bg-sky-500 hover:bg-sky-600 text-white font-bold text-lg py-3 px-10 rounded-2xl shadow-lg transition-all active:scale-95"
            >
              {gameState === 'WIN' ? '再玩一次' : '再试一次'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
