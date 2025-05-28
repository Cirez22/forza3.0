import React from 'react';
import { Zap } from 'lucide-react';

type LogoProps = {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
};

const Logo: React.FC<LogoProps> = ({ size = 'md', withText = true }) => {
  const sizeMap = {
    sm: { text: 'text-lg', icon: 16 },
    md: { text: 'text-xl', icon: 20 },
    lg: { text: 'text-2xl', icon: 24 },
  };

  return (
    <div className="flex items-center gap-0">
      <span className={`font-bold ${sizeMap[size].text} tracking-tighter`}>
        FORZA
      </span>
      <Zap
        size={sizeMap[size].icon}
        className="text-orange-500 -ml-1"
        fill="currentColor"
      />
    </div>
  );
};

export default Logo;