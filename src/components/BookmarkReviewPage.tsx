import React, { useState, useEffect } from 'react';
import { BookmarkService, SimpleBookmark } from '../utils/BookmarkService';
import { UserData } from '../types';
import { 
  ArrowLeft, 
  Bookmark, 
  Search, 
  MoreVertical,
  Trash2,
  Edit,
  BookOpen,
  LogOut,
  Stethoscope,
  Scissors,
  Baby
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface BookmarkReviewPageProps {
  user: UserData;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export const BookmarkReviewPage: React.FC<BookmarkReviewPageProps> = ({
  user,
  onNavigate,
  onLogout
}) => {
  const [bookmarks, setBookmarks] = useState<SimpleBookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<SimpleBookmark[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [availableSystems, setAvailableSystems] = useState<string[]>([]);
  const [editingBookmark, setEditingBookmark] = useState<SimpleBookmark | null>(null);
  const [editNote, setEditNote] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load bookmarks and available systems
  useEffect(() => {
    const loadBookmarks = () => {
      console.log(`🔖 Loading bookmarks for ${user.specialty}...`);
      const allBookmarks = BookmarkService.getBookmarks(user.specialty);
      setBookmarks(allBookmarks);
      console.log(`🔖 Loaded ${allBookmarks.length} bookmarks`);
      
      // ✅ UPDATED: Use sync version and get ALL systems from CMS
      console.log(`🔖 Loading available systems for ${user.specialty}...`);
      const systems = BookmarkService.getAvailableSystemsSync(user.specialty);
      setAvailableSystems(systems);
      console.log(`🔖 Loaded ${systems.length} available systems:`, systems);
    };

    loadBookmarks();
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timeInterval);
  }, [user.specialty]);

  // Apply filters
  useEffect(() => {
    let filtered = bookmarks;

    // Filter by system
    if (selectedSystem !== 'all') {
      filtered = filtered.filter(bookmark => bookmark.system === selectedSystem);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(bookmark => 
        bookmark.question.toLowerCase().includes(term) ||
        bookmark.system.toLowerCase().includes(term) ||
        bookmark.explanation.toLowerCase().includes(term) ||
        bookmark.note?.toLowerCase().includes(term)
      );
    }

    setFilteredBookmarks(filtered);
  }, [bookmarks, selectedSystem, searchTerm]);

  // Get theme colors based on specialty
  const getThemeColors = () => {
    switch (user.specialty) {
      case 'medicine':
        return {
          primary: 'emerald',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          text: 'text-emerald-700',
          button: 'bg-emerald-600 hover:bg-emerald-700',
          icon: Stethoscope
        };
      case 'surgery':
        return {
          primary: 'blue',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700',
          icon: Scissors
        };
      case 'gynae-obs':
        return {
          primary: 'pink',
          bg: 'bg-pink-50',
          border: 'border-pink-200',
          text: 'text-pink-700',
          button: 'bg-pink-600 hover:bg-pink-700',
          icon: Baby
        };
      default:
        return {
          primary: 'gray',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          button: 'bg-gray-600 hover:bg-gray-700',
          icon: BookOpen
        };
    }
  };

  const theme = getThemeColors();
  const SpecialtyIcon = theme.icon;

  // ✅ FIXED: Updated to use removeBookmarkById instead of removeBookmark
  const handleDeleteBookmark = (bookmarkId: string) => {
    console.log(`🔖 Attempting to delete bookmark: ${bookmarkId}`);
    const success = BookmarkService.removeBookmarkById(bookmarkId, user.specialty);
    if (success) {
      console.log(`✅ Successfully deleted bookmark: ${bookmarkId}`);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } else {
      console.error(`❌ Failed to delete bookmark: ${bookmarkId}`);
    }
  };

  const handleEditNote = (bookmark: SimpleBookmark) => {
    setEditingBookmark(bookmark);
    setEditNote(bookmark.note || '');
  };

  const handleSaveNote = () => {
    if (editingBookmark) {
      const success = BookmarkService.updateBookmarkNote(
        editingBookmark.id, 
        user.specialty, 
        editNote
      );
      if (success) {
        setBookmarks(prev => 
          prev.map(b => 
            b.id === editingBookmark.id 
              ? { ...b, note: editNote }
              : b
          )
        );
      }
    }
    setEditingBookmark(null);
    setEditNote('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const getSpecialtyDisplayName = () => {
    switch (user.specialty) {
      case 'gynae-obs': return 'Gynae & Obs';
      case 'medicine': return 'Medicine';
      case 'surgery': return 'Surgery';
      default: return user.specialty;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => onNavigate('dashboard')}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${theme.button} rounded-xl flex items-center justify-center shadow-lg`}>
                  <SpecialtyIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Bookmarks</h1>
                  <p className="text-sm text-gray-600">
                    {getSpecialtyDisplayName()} • {bookmarks.length} saved questions • {availableSystems.length} systems available
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Dr. {user.name}</p>
                <p className="text-xs text-gray-500">{currentTime.toLocaleDateString()}</p>
              </div>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {bookmarks.length === 0 ? (
          // Empty State
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Bookmark className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Bookmarks Yet</h2>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Start practicing and bookmark important questions to build your personalized review collection.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              📚 {availableSystems.length} medical systems available for {getSpecialtyDisplayName()} specialty
            </p>
            <Button 
              onClick={() => onNavigate('dashboard')}
              className={theme.button}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Start Practicing
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats */}
            <Card className={`${theme.border} ${theme.bg}`}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${theme.text}`}>{bookmarks.length}</div>
                    <div className="text-sm text-gray-600">Total Bookmarks</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${theme.text}`}>{availableSystems.length}</div>
                    <div className="text-sm text-gray-600">Systems Available</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${theme.text}`}>
                      {Array.from(new Set(bookmarks.map(b => b.system))).length}
                    </div>
                    <div className="text-sm text-gray-600">Systems Covered</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${theme.text}`}>
                      {bookmarks.filter(b => {
                        const daysSince = Math.floor((Date.now() - new Date(b.bookmarkedAt).getTime()) / (1000 * 60 * 60 * 24));
                        return daysSince <= 7;
                      }).length}
                    </div>
                    <div className="text-sm text-gray-600">Added This Week</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search bookmarks..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={selectedSystem} onValueChange={setSelectedSystem}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Systems ({availableSystems.length} available)</SelectItem>
                      {availableSystems.map(system => {
                        const bookmarkCount = bookmarks.filter(b => b.system === system).length;
                        return (
                          <SelectItem key={system} value={system}>
                            {system} {bookmarkCount > 0 && `(${bookmarkCount})`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filter Info */}
                <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                  <div>
                    Showing {filteredBookmarks.length} of {bookmarks.length} bookmarks
                    {selectedSystem !== 'all' && ` from ${selectedSystem}`}
                  </div>
                  <div>
                    💡 All {availableSystems.length} systems available for filtering
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bookmarks List */}
            {filteredBookmarks.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks found</h3>
                <p className="text-gray-500">Try adjusting your search terms or filters.</p>
                {selectedSystem !== 'all' && (
                  <p className="text-sm text-gray-400 mt-2">
                    No bookmarks in "{selectedSystem}" yet. Start practicing this system to add bookmarks!
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredBookmarks.map((bookmark) => (
                  <Card key={bookmark.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className={`${theme.text} ${theme.bg} ${theme.border}`}>
                            {bookmark.system}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {bookmark.difficulty}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(bookmark.bookmarkedAt)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleEditNote(bookmark)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Note
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteBookmark(bookmark.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="font-medium text-gray-900 mb-2">{bookmark.question}</p>
                        <div className="space-y-1">
                          {bookmark.options.map((option, index) => (
                            <div 
                              key={index} 
                              className={`text-sm p-2 rounded ${
                                index === bookmark.correctAnswer 
                                  ? 'bg-green-100 text-green-800 font-medium' 
                                  : 'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {String.fromCharCode(65 + index)}. {option}
                            </div>
                          ))}
                        </div>
                      </div>

                      {bookmark.note && (
                        <div className={`${theme.bg} ${theme.border} border rounded p-3 mb-4`}>
                          <p className="text-sm text-gray-700">{bookmark.note}</p>
                        </div>
                      )}

                      <div className="text-sm text-gray-600">
                        <strong>Explanation:</strong> {bookmark.explanation}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Note Modal */}
      <Dialog open={!!editingBookmark} onOpenChange={() => setEditingBookmark(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bookmark Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note">Personal Note</Label>
              <Textarea
                id="note"
                placeholder="Add a note to help you remember why this question is important..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingBookmark(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNote} className={theme.button}>
                Save Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};