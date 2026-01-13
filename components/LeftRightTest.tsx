
import React from 'react';
import { Facing, Hand } from '../types';

interface Props {
  facing: Facing;
  handRaised: Hand;
  onAnswer: (answer: Hand) => void;
}

const LeftRightTest: React.FC<Props> = ({ facing, handRaised, onAnswer }) => {
  // Visual Logic:
  // If facing BACK: Left Hand is on Screen Left. Right Hand is on Screen Right.
  // If facing FRONT: Left Hand is on Screen RIGHT (Mirror). Right Hand is on Screen LEFT (Mirror).
  
  const isScreenLeftRaised = (facing === Facing.BACK && handRaised === Hand.LEFT) || 
                             (facing === Facing.FRONT && handRaised === Hand.RIGHT);
                             
  const isScreenRightRaised = (facing === Facing.BACK && handRaised === Hand.RIGHT) || 
                              (facing === Facing.FRONT && handRaised === Hand.LEFT);

  return (
    <div className="flex flex-col items-center justify-between h-full py-1">
      <div className="text-center mb-1 px-4">
        <h2 className="text-xl font-bold text-sky-800 comic-font mb-1">他举起的是哪只手？</h2>
        <div className="bg-white/60 py-1 px-3 rounded-lg inline-block text-gray-600 text-xs font-medium border border-white">
            提示：注意他是面向你还是背对你哦
        </div>
      </div>

      <div className="relative flex-1 w-full flex items-center justify-center min-h-[160px]">
        {/* Character Container - Scaled Down for Mobile */}
        <div className="relative w-32 h-48 flex flex-col items-center transition-all duration-500">
           
           {/* Head */}
           <div className={`w-20 h-20 rounded-full border-4 border-gray-800 z-10 relative shadow-md
             ${facing === Facing.FRONT ? 'bg-[#ffdec8]' : 'bg-gray-900'}
           `}>
             {/* Face Features (Only if Front) */}
             {facing === Facing.FRONT && (
               <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
                 {/* Bangs */}
                 <div className="absolute top-0 w-full h-6 bg-gray-800 rounded-t-full"></div>
                 {/* Eyes */}
                 <div className="flex space-x-4 mt-1">
                    <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                 </div>
                 {/* Mouth */}
                 <div className="w-4 h-1.5 border-b-4 border-red-400 rounded-full"></div>
               </div>
             )}
             
             {/* Back of Head Features */}
             {facing === Facing.BACK && (
                 <div className="absolute inset-0 flex flex-col items-center">
                     <div className="w-full h-full rounded-full bg-gradient-to-b from-gray-800 to-gray-700 opacity-90"></div>
                     <div className="absolute -left-1 top-1/2 w-2 h-4 bg-[#ffdec8] rounded-l-full -z-10"></div>
                     <div className="absolute -right-1 top-1/2 w-2 h-4 bg-[#ffdec8] rounded-r-full -z-10"></div>
                 </div>
             )}
           </div>

           {/* Body */}
           <div className="w-24 h-16 bg-blue-500 rounded-t-3xl relative -mt-2 z-0 shadow-inner flex justify-center">
              {/* Collar */}
              {facing === Facing.FRONT && (
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-white mt-1"></div>
              )}
              {facing === Facing.BACK && (
                  <div className="mt-3 text-blue-300 font-bold text-[10px] opacity-50 tracking-widest">BACK</div>
              )}

              {/* ARMS */}
              {/* Left Arm (Screen Left) */}
              <div className={`absolute top-1 -left-3 w-6 h-20 bg-blue-500 rounded-full origin-top transition-all duration-500 border-4 border-blue-600/20
                ${isScreenLeftRaised ? '-rotate-[150deg] -translate-y-2' : 'rotate-12'}
              `}>
                <div className="absolute bottom-0 w-full h-6 bg-[#ffdec8] rounded-full border-t-4 border-black/10"></div>
                {isScreenLeftRaised && (
                   <div className="absolute -bottom-8 -left-2 text-2xl animate-bounce">✋</div>
                )}
              </div>

              {/* Right Arm (Screen Right) */}
              <div className={`absolute top-1 -right-3 w-6 h-20 bg-blue-500 rounded-full origin-top transition-all duration-500 border-4 border-blue-600/20
                ${isScreenRightRaised ? 'rotate-[150deg] -translate-y-2' : '-rotate-12'}
              `}>
                <div className="absolute bottom-0 w-full h-6 bg-[#ffdec8] rounded-full border-t-4 border-black/10"></div>
                {isScreenRightRaised && (
                   <div className="absolute -bottom-8 -right-2 text-2xl animate-bounce">✋</div>
                )}
              </div>
           </div>

           {/* Label Badge */}
           <div className={`absolute -bottom-4 px-3 py-1 rounded-full text-white font-bold shadow-lg text-xs
             ${facing === Facing.FRONT ? 'bg-orange-500' : 'bg-gray-700'}
           `}>
             {facing}
           </div>
        </div>
      </div>

      {/* Answer Buttons */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-xs mt-2 px-2 pb-4">
        <button
          onClick={() => onAnswer(Hand.LEFT)}
          className="group relative bg-white border-b-4 border-pink-200 active:border-b-0 active:translate-y-1 rounded-2xl p-3 transition-all flex flex-col items-center touch-manipulation"
        >
          <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">👈</div>
          <div className="text-lg font-bold text-pink-500">左手</div>
        </button>
        
        <button
          onClick={() => onAnswer(Hand.RIGHT)}
          className="group relative bg-white border-b-4 border-blue-200 active:border-b-0 active:translate-y-1 rounded-2xl p-3 transition-all flex flex-col items-center touch-manipulation"
        >
          <div className="text-3xl mb-1 group-hover:scale-110 transition-transform">👉</div>
          <div className="text-lg font-bold text-blue-500">右手</div>
        </button>
      </div>
    </div>
  );
};

export default LeftRightTest;
