import React, { useState } from 'react';
import { Star } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StarRatingProps {
  groupId: number;
  stars: number; // 0..10
  onSetStars: (groupId: number, stars: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  groupId,
  stars,
  onSetStars
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayStars = hoverRating !== null ? hoverRating : stars;

  const handleStarClick = (num: number, e: React.MouseEvent) => {
    // If clicking the same number, toggle to 0 or set
    const newRating = stars === num ? 0 : num;
    onSetStars(groupId, newRating);

    if (newRating > 0) {
      // Trigger fireworks celebration
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 50 + newRating * 5,
        spread: 60 + newRating * 3,
        origin: { x, y: Math.max(0.2, y - 0.1) },
        colors: ['#FFD700', '#FFA500', '#FF4500', '#00BFFF', '#32CD32']
      });
    }
  };

  return (
    <div className="flex items-center gap-1 bg-amber-500/10 dark:bg-amber-400/10 px-2 py-1 rounded-xl border border-amber-500/20">
      <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(null)}>
        {Array.from({ length: 10 }, (_, i) => {
          const starNum = i + 1;
          const isFilled = starNum <= displayStars;

          return (
            <button
              key={starNum}
              type="button"
              onMouseEnter={() => setHoverRating(starNum)}
              onClick={(e) => handleStarClick(starNum, e)}
              className="p-0.5 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
              title={`${starNum}/10 Sao`}
            >
              <Star
                className={`w-3.5 h-3.5 transition-colors ${
                  isFilled
                    ? 'fill-amber-400 text-amber-500 drop-shadow-[0_0_3px_rgba(251,191,36,0.6)]'
                    : 'text-slate-300 dark:text-slate-600 fill-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      <span className="text-xs font-black text-amber-600 dark:text-amber-400 ml-1 min-w-[32px] text-center">
        {stars}/10
      </span>
    </div>
  );
};
