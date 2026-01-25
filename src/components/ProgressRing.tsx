interface ProgressRingProps {
  percent: number;
  className?: string;
}

export default function ProgressRing({ percent, className = "w-20 h-20 md:w-32 md:h-32" }: ProgressRingProps) {
  // Use viewBox for responsive scaling, match pie chart's 85% outer radius
  const size = 100;
  const strokeWidth = 6;
  const radius = (size * 0.85 - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#262626"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#a3a3a3"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm md:text-xl font-bold text-neutral-400">{Math.round(percent)}%</span>
      </div>
    </div>
  );
}
