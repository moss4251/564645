
import React, { useState, useEffect } from 'react';
import { GridQuestion, Position } from '../types';
import { ANIMALS, GRID_SIZE } from '../constants';

interface Props {
  question: GridQuestion;
  onAnswer: (placements: Record<string, Position>) => void;
}

const GridTest: React.FC<Props> = ({ question, onAnswer }) => {
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [currentPlacements, setCurrentPlacements] = useState<Record<string, Position>>({
    'turtle': question.turtlePos
  });

  useEffect(() => {
    setCurrentPlacements({ 'turtle': question.turtlePos });
    setSelectedAnimalId(null);
  }, [question]);

  const handleCellClick = (x: number, y: number) => {
    // 1. If holding an animal from dock or moving one
    if (selectedAnimalId) {
       // Cannot overwrite Turtle (Center)
       if (x === question.turtlePos.x && y === question.turtlePos.y) return;
       
       setCurrentPlacements(prev => ({ ...prev, [selectedAnimalId]: { x, y } }));
       setSelectedAnimalId(null);
       return;
    }

    // 2. If clicking a cell with an animal (not turtle), pick it up
    const occupantEntry = (Object.entries(currentPlacements) as [string, Position][]).find(([_, pos]) => pos.x === x && pos.y === y);
    if (occupantEntry && occupantEntry[0] !== 'turtle') {
      setSelectedAnimalId(occupantEntry[0]);
    }
  };

  const handleDockClick = (animalId: string) => {
    if (selectedAnimalId === animalId) setSelectedAnimalId(null);
    else setSelectedAnimalId(animalId);
  };

  const isComplete = ANIMALS.every(a => !!currentPlacements[a.id]);

  return (
    <div className="flex flex-col h-full py-1">
      
      {/* Clues Area - Scrollable but compact, max height set relative to viewport */}
      <div className="bg-white rounded-xl p-2 shadow-sm border-2 border-sky-100 mb-2 overflow-y-auto shrink-0 scrollbar-hide flex-none max-h-[25vh]">
        <div className="space-y-1.5">
          {question.animalPlacements.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg">
              <div className={`w-7 h-7 rounded-full ${p.animal.color} flex items-center justify-center text-base shadow-sm shrink-0`}>
                {p.animal.emoji}
              </div>
              <div className="bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm relative text-xs text-gray-700 font-medium leading-tight">
                   {p.clue}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Area - Flexible container that centers grid */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 bg-transparent">
        <div className="bg-sky-200 p-2 rounded-xl shadow-inner inline-block">
          {/* Tighter gap for mobile */}
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: GRID_SIZE }).map((_, y) => 
              Array.from({ length: GRID_SIZE }).map((_, x) => {
                const occupantEntry = (Object.entries(currentPlacements) as [string, Position][]).find(([_, pos]) => pos.x === x && pos.y === y);
                const animalId = occupantEntry ? occupantEntry[0] : null;
                const animal = animalId ? ANIMALS.find(a => a.id === animalId) : null;
                const isTurtle = animalId === 'turtle';

                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    className={`
                      w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center text-3xl transition-all relative
                      ${isTurtle 
                        ? 'bg-green-100 border-2 border-green-500 shadow-sm' 
                        : 'bg-white border-2 border-white cursor-pointer hover:bg-sky-50 active:scale-95'
                      }
                      ${selectedAnimalId && !animal ? 'animate-pulse ring-2 ring-sky-300 ring-offset-1' : ''}
                    `}
                  >
                    {animal ? (
                      <div className={`transition-all duration-300 ${animalId === selectedAnimalId ? 'scale-110 opacity-50' : 'scale-100'}`}>
                        {animal.emoji}
                      </div>
                    ) : (
                       // Visual center dot or just empty space
                       x === 1 && y === 1 
                       ? <div className="text-gray-300 text-[10px]">中心</div>
                       : <div className="w-1 h-1 bg-sky-100 rounded-full"></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 mb-1">
           {selectedAnimalId ? '👆 点击格子放置' : '👆 先点下方动物，再放入格子'}
        </p>
      </div>

      {/* Dock Area - Fixed at bottom */}
      <div className="shrink-0 pt-2">
        <div className="flex justify-center gap-2 px-2 pb-2">
          {ANIMALS.filter(a => a.id !== 'turtle').map(animal => {
            const isPlaced = !!currentPlacements[animal.id];
            const isSelected = selectedAnimalId === animal.id;
            
            return (
              <button
                key={animal.id}
                onClick={() => handleDockClick(animal.id)}
                className={`
                  relative flex flex-col items-center justify-center w-14 h-12 rounded-xl border-b-2 transition-all
                  ${isSelected 
                    ? 'bg-yellow-100 border-yellow-400 -translate-y-1' 
                    : isPlaced 
                      ? 'bg-gray-100 border-gray-300 opacity-50 grayscale' 
                      : 'bg-white border-gray-200 active:scale-95 touch-manipulation shadow-sm'
                  }
                `}
              >
                <span className="text-2xl filter drop-shadow-sm">{animal.emoji}</span>
              </button>
            );
          })}
        </div>
        
        <button
            onClick={() => onAnswer(currentPlacements)}
            disabled={!isComplete}
            className={`w-full py-3 rounded-t-2xl text-lg font-bold shadow-[0_-4px_10px_rgba(0,0,0,0.05)] transition-all touch-manipulation
            ${isComplete 
                ? 'bg-green-500 hover:bg-green-600 text-white translate-y-0' 
                : 'bg-gray-100 text-gray-400 translate-y-full'
            }
            `}
            style={{ transform: isComplete ? 'translateY(0)' : 'translateY(10px)' }}
        >
            ✅ 我摆好啦！
        </button>
      </div>
    </div>
  );
};

export default GridTest;
