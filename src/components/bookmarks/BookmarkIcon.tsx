import React from 'react';
import { Bookmark } from 'lucide-react';

interface BookmarkIconProps {
  isBookmarked: boolean;
  size?: number;
  className?: string;
}

export const BookmarkIcon: React.FC<BookmarkIconProps> = ({ 
  isBookmarked, 
  size = 20, 
  className = '' 
}) => {
  return (
    <Bookmark 
      size={size}
      className={`transition-all duration-200 ${className} ${
        isBookmarked 
          ? 'fill-current text-yellow-500' 
          : 'text-gray-400 hover:text-yellow-500'
      }`}
    />
  );
};