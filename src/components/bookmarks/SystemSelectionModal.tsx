import React, { useState, useEffect } from 'react';
import { BookmarkService } from '../../utils/BookmarkService';
import { SpecialtyType } from '../../types';
import { X, Bookmark, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface SystemSelectionModalProps {
  onClose: () => void;
  specialty: SpecialtyType;
  onNavigate: (page: string) => void;
}

export const SystemSelectionModal: React.FC<SystemSelectionModalProps> = ({
  onClose,
  specialty,
  onNavigate
}) => {
  const [availableSystems, setAvailableSystems] = useState<string[]>([]);
  const [systemCounts, setSystemCounts] = useState<Record<string, number>>({});
  const [totalBookmarks, setTotalBookmarks] = useState(0);

  useEffect(() => {
    const loadSystemsAndCounts = async () => {
      try {
        // Get available systems asynchronously
        const systems = await BookmarkService.getAvailableSystems(specialty);
        setAvailableSystems(systems);

        // Get bookmark counts for each system
        const counts: Record<string, number> = {};
        systems.forEach(system => {
          counts[system] = BookmarkService.getSystemBookmarkCount(specialty, system);
        });
        setSystemCounts(counts);

        // Get total bookmark count
        const total = BookmarkService.getTotalBookmarkCount(specialty);
        setTotalBookmarks(total);
      } catch (error) {
        console.error('Error loading systems and counts:', error);
        // Fallback to empty state
        setAvailableSystems([]);
        setSystemCounts({});
        setTotalBookmarks(0);
      }
    };

    loadSystemsAndCounts();
  }, [specialty]);

  // Get theme colors based on specialty
  const getThemeColors = () => {
    switch (specialty) {
      case 'medicine':
        return {
          primary: 'emerald',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          button: 'bg-emerald-600 hover:bg-emerald-700'
        };
      case 'surgery':
        return {
          primary: 'blue',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'gynae-obs':
        return {
          primary: 'pink',
          bg: 'bg-pink-50',
          border: 'border-pink-200',
          text: 'text-pink-700',
          button: 'bg-pink-600 hover:bg-pink-700'
        };
      default:
        return {
          primary: 'gray',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          button: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  const theme = getThemeColors();

  const handleViewAllBookmarks = () => {
    onNavigate('bookmark-review');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center">
            <Bookmark className={`w-5 h-5 mr-2 ${theme.text}`} />
            My Bookmarks
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {totalBookmarks === 0 ? (
            // Empty State
            <div className="text-center py-8">
              <div className={`w-16 h-16 mx-auto ${theme.bg} rounded-full flex items-center justify-center mb-4`}>
                <Bookmark className={`w-8 h-8 ${theme.text}`} />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">No Bookmarks Yet</h3>
              <p className="text-sm text-gray-600 mb-4">
                Start practicing and bookmark important questions to review them later.
              </p>
              <Button onClick={onClose} variant="outline">
                Start Practicing
              </Button>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className={`${theme.bg} ${theme.border} border rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${theme.text}`}>Total Bookmarks</span>
                  <Badge className={`${theme.button} text-white`}>
                    {totalBookmarks}
                  </Badge>
                </div>
              </div>

              {/* Systems List */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Review by System</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableSystems.map((system) => (
                    <div
                      key={system}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{system}</p>
                        <p className="text-xs text-gray-500">
                          {systemCounts[system]} bookmark{systemCounts[system] !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {systemCounts[system]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t">
                <Button 
                  onClick={handleViewAllBookmarks}
                  className={`w-full ${theme.button} text-white`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View All Bookmarks
                </Button>
                <Button 
                  onClick={onClose} 
                  variant="outline" 
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};