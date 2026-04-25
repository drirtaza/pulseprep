import { useState, useEffect } from "react";
import { BookmarkIcon } from "./BookmarkIcon";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { BookmarkService } from "../../utils/BookmarkService";
import { SpecialtyType, MCQQuestion } from "../../types";

interface BookmarkButtonProps {
  questionId: string | number; // ✅ FIXED: Updated to handle both string and number IDs
  specialty: SpecialtyType;
  question: MCQQuestion;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showTooltip?: boolean;
}

export function BookmarkButton({
  questionId,
  specialty,
  question,
  className = "",
  size = 'md',
  variant = 'ghost',
  showTooltip = true
}: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // ✅ FIXED: Handle both string and number IDs
    const idToCheck = String(questionId);
    const bookmarked = BookmarkService.isBookmarked(idToCheck, specialty);
    setIsBookmarked(bookmarked);
  }, [questionId, specialty]);

  const handleBookmarkToggle = async () => {
    setIsLoading(true);
    
    try {
      if (isBookmarked) {
        const bookmarks = BookmarkService.getBookmarks(specialty);
        // ✅ FIXED: Handle ID conversion for finding bookmark
        const idToFind = String(questionId);
        const bookmark = bookmarks.find(b => String(b.id) === idToFind);
        
        if (bookmark) {
          const success = BookmarkService.removeBookmark(String(questionId), specialty);
          if (success) {
            setIsBookmarked(false);
            console.log('📌 Bookmark removed successfully');
          }
        }
      } else {
        const success = BookmarkService.addBookmark(question, specialty);
        if (success) {
          setIsBookmarked(true);
          console.log('📌 Bookmark added successfully');
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-8 w-8';
      case 'lg': return 'h-12 w-12';
      default: return 'h-10 w-10';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'lg': return 24;
      default: return 20;
    }
  };

  const button = (
    <Button
      variant={variant}
      size="icon"
      className={`${getButtonSize()} transition-colors ${className}`}
      onClick={handleBookmarkToggle}
      disabled={isLoading}
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <BookmarkIcon 
        isBookmarked={isBookmarked} 
        size={getIconSize()}
        className={isLoading ? "animate-pulse" : ""}
      />
    </Button>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}