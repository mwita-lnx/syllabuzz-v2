'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  BookmarkPlus, 
  Search, 
  User,
  Menu,
  X,
  Home,
  LogOut,
  BookA,
  GraduationCap,
  BookCopy,
  FileText,
  Upload,
  ExternalLink,
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Separator } from '../components/ui/separator';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext'; // Import the auth hook
import { getSavedItems, SavedItem } from '../services/saved-items-servicei'; // Import the saved items service

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth(); // Use the auth context
  
  // State management
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState<boolean>(true);
  
  // Theme colors
  const colors = {
    primary: '#FF6B6B',         // Coral Red
    secondary: '#4ECDC4',       // Turquoise
    tertiary: '#FFD166',        // Golden Yellow
    quaternary: '#6A0572',      // Deep Purple
    background: '#FFFFFF',      // White
    surface: '#F7F9FC',         // Ice Blue
    elevatedSurface: '#FFFFFF', // White for elevated surfaces
    textPrimary: '#2D3748',     // Deep Blue-Gray
    textSecondary: '#4A5568',   // Medium Gray
    textMuted: '#718096',       // Soft Gray
    border: '#E2E8F0',          // Soft Gray border
  };
  
  // Add custom CSS for animations and custom font
  // Fetch saved items
  useEffect(() => {
    const fetchSavedItems = async () => {
      try {
        setIsLoadingSaved(true);
        const response = await getSavedItems();
        if (response.status === 'success') {
          setSavedItems(response.data);
        }
      } catch (error) {
        console.error('Error fetching saved items:', error);
      } finally {
        setIsLoadingSaved(false);
      }
    };

    if (isAuthenticated) {
      fetchSavedItems();
    }
    
    // Refresh saved items every 5 minutes
    const intervalId = setInterval(() => {
      if (isAuthenticated) {
        fetchSavedItems();
      }
    }, 300000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=DynaPuff:wght@400;600;800&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=Righteous&display=swap');
      
      /* Apply custom fonts */
      body {
        font-family: 'DynaPuff', sans-serif;
        background-color: ${colors.background};
        color: ${colors.textPrimary};
      }

      h1, h2, h3, .title-font {
        font-family: 'DynaPuff', sans-serif;
        font-weight: 700;
      }
      
      /* Custom animations */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes slideIn {
        from { transform: translateX(-20px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      @keyframes glowPulse {
        0% { box-shadow: 0 0 5px ${colors.primary}80; }
        50% { box-shadow: 0 0 15px ${colors.primary}; }
        100% { box-shadow: 0 0 5px ${colors.primary}80; }
      }
      
      .animate-fadeIn {
        animation: fadeIn 0.5s ease forwards;
      }
      
      .animate-slideIn {
        animation: slideIn 0.5s ease forwards;
      }
      
      .hover-scale {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .hover-scale:hover {
        transform: scale(1.03);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }
      
      .pulse {
        animation: pulse 2s infinite;
      }
      
      .glow-effect {
        animation: glowPulse 2s infinite;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent): void => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    // Navigate to search results
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };
  
  // Handle logout
  const handleLogout = (): void => {
    logout();
    router.push('/login');
    setIsMenuOpen(false);
  };
  
  // Check if route is active
  const isActiveRoute = (route: string): boolean => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  };
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ backgroundColor: colors.background }}>
        <BookOpen className="w-16 h-16 mb-4" style={{ color: colors.primary }} />
        <h1 className="text-2xl font-bold mb-6 title-font" style={{ color: colors.primary }}>SyllaBuzz</h1>
        <p className="mb-6" style={{ color: colors.textPrimary }}>Please log in to access SyllaBuzz</p>
        <Button 
          onClick={() => router.push('/login')}
          style={{ backgroundColor: colors.primary, color: colors.textPrimary }}
        >
          Go to Login
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <header 
        className="border-b sticky top-0 z-10" 
        style={{ 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}
      >
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 animate-slideIn cursor-pointer" onClick={() => router.push('/')}>
            <BookOpen className="w-6 h-6" style={{ color: colors.primary }} />
            <h1 className="text-xl font-bold title-font" style={{ color: colors.primary }}>SyllaBuzz</h1>
          </div>
          
          <div className="hidden md:block w-1/3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" style={{ color: colors.textSecondary }} />
              <Input
                type="text"
                placeholder="Search notes, units, papers..."
                className="w-full pl-10 border-2 focus:ring-2 focus:border-transparent transition-all"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: colors.primary,
                  borderRadius: '0.5rem',
                  color: colors.textPrimary
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{ color: colors.textPrimary }}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            
            <div className="hidden md:flex items-center gap-4">
              <Button
                variant="ghost"
                className="flex items-center gap-1 hover:bg-opacity-20 transition-colors"
                onClick={handleLogout}
                style={{ color: colors.textPrimary }}
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </Button>

              <Avatar className="border-2" style={{ borderColor: colors.primary }}>
                <AvatarFallback style={{ backgroundColor: colors.primary, color: colors.textPrimary }}>
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <span className="font-medium" style={{ color: colors.textPrimary }}>{user?.name || 'Guest'}</span>
                <p className="text-xs" style={{ color: colors.textSecondary }}>{user?.faculty || ''}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Search */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" style={{ color: colors.textSecondary }} />
            <Input
              type="text"
              placeholder="Search notes, units, papers..."
              className="w-full pl-10 border-2 focus:ring-2 focus:border-transparent transition-all"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: colors.primary,
                borderRadius: '0.5rem',
                color: colors.textPrimary
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div 
            className="md:hidden border-t p-4 flex flex-col gap-2 animate-fadeIn" 
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border 
            }}
          >
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors" 
              onClick={() => {router.push('/'); setIsMenuOpen(false);}}
              style={{ color: isActiveRoute('/') ? colors.primary : colors.textPrimary }}
            >
              <Home className="w-4 h-4 mr-2" /> Home
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors" 
              onClick={() => {router.push('/units'); setIsMenuOpen(false);}}
              style={{ color: isActiveRoute('/units') ? colors.primary : colors.textPrimary }}
            >
              <BookA className="w-4 h-4 mr-2" /> Units
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors" 
              onClick={() => {router.push('/saved'); setIsMenuOpen(false);}}
              style={{ color: isActiveRoute('/saved') ? colors.primary : colors.textPrimary }}
            >
              <BookmarkPlus className="w-4 h-4 mr-2" /> Saved Content
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors" 
              onClick={() => {router.push('/notes'); setIsMenuOpen(false);}}
              style={{ color: isActiveRoute('/notes') ? colors.primary : colors.textPrimary }}
            >
              <BookCopy className="w-4 h-4 mr-2" /> Notes
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors" 
              onClick={() => {router.push('/pastpapers'); setIsMenuOpen(false);}}
              style={{ color: isActiveRoute('/pastpapers') ? colors.primary : colors.textPrimary }}
            >
              <FileText className="w-4 h-4 mr-2" /> Past Papers
            </Button>
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors" 
              onClick={() => {router.push('/revision'); setIsMenuOpen(false);}}
              style={{ color: isActiveRoute('/revision') ? colors.primary : colors.textPrimary }}
            >
              <GraduationCap className="w-4 h-4 mr-2" /> Revision Room
            </Button>
            {/* Added Search link for mobile */}
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors" 
              onClick={() => {router.push('/search'); setIsMenuOpen(false);}}
              style={{ color: isActiveRoute('/search') ? colors.primary : colors.textPrimary }}
            >
              <Search className="w-4 h-4 mr-2" /> Advanced Search
            </Button>
            {/* Added Upload link for mobile */}
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors" 
              onClick={() => {router.push('/upload'); setIsMenuOpen(false);}}
              style={{ color: isActiveRoute('/upload') ? colors.primary : colors.textPrimary }}
            >
              <Upload className="w-4 h-4 mr-2" /> Upload Material
            </Button>
            <Separator className="my-2" style={{ backgroundColor: colors.border }} />
            <div className="flex items-center gap-2 p-2">
              <Avatar className="border-2" style={{ borderColor: colors.primary }}>
                <AvatarFallback style={{ backgroundColor: colors.primary, color: colors.textPrimary }}>
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium" style={{ color: colors.textPrimary }}>{user?.name || 'Guest'}</p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>{user?.email || ''}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="justify-start hover:bg-opacity-20 transition-colors mt-2" 
              onClick={handleLogout}
              style={{ color: colors.textPrimary }}
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation (Desktop) */}
          <aside className="hidden md:block w-64 space-y-2 animate-slideIn">
            <Button 
              variant={isActiveRoute('/') && !isActiveRoute('/units') && !isActiveRoute('/notes') && !isActiveRoute('/revision') && !isActiveRoute('/pastpapers') ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors font-medium"
              onClick={() => router.push('/')}
              style={{ 
                backgroundColor: isActiveRoute('/') && !isActiveRoute('/units') && !isActiveRoute('/notes') && !isActiveRoute('/revision') && !isActiveRoute('/pastpapers') ? colors.primary : 'transparent',
                color: isActiveRoute('/') && !isActiveRoute('/units') && !isActiveRoute('/notes') && !isActiveRoute('/revision') && !isActiveRoute('/pastpapers') ? colors.textPrimary : colors.textPrimary
              }}
            >
              <Home className="w-4 h-4 mr-2" /> Home
            </Button>
            <Button 
              variant={isActiveRoute('/units') ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors font-medium"
              onClick={() => router.push('/units')}
              style={{ 
                backgroundColor: isActiveRoute('/units') ? colors.primary : 'transparent',
                color: isActiveRoute('/units') ? colors.textPrimary : colors.textPrimary
              }}
            >
              <BookA className="w-4 h-4 mr-2" /> Units
            </Button>
            <Button 
              variant={isActiveRoute('/notes') ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors font-medium"
              onClick={() => router.push('/notes')}
              style={{ 
                backgroundColor: isActiveRoute('/notes') ? colors.primary : 'transparent',
                color: isActiveRoute('/notes') ? colors.textPrimary : colors.textPrimary
              }}
            >
              <BookCopy className="w-4 h-4 mr-2" /> Notes
            </Button>
            <Button 
              variant={isActiveRoute('/pastpapers') ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors font-medium"
              onClick={() => router.push('/pastpapers')}
              style={{ 
                backgroundColor: isActiveRoute('/pastpapers') ? colors.primary : 'transparent',
                color: isActiveRoute('/pastpapers') ? colors.textPrimary : colors.textPrimary
              }}
            >
              <FileText className="w-4 h-4 mr-2" /> Past Papers
            </Button>
            <Button 
              variant={isActiveRoute('/revision') ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors font-medium"
              onClick={() => router.push('/revision')}
              style={{ 
                backgroundColor: isActiveRoute('/revision') ? colors.primary : 'transparent',
                color: isActiveRoute('/revision') ? colors.textPrimary : colors.textPrimary
              }}
            >
              <GraduationCap className="w-4 h-4 mr-2" /> Revision Room
            </Button>
            {/* Added Search link for desktop */}
            <Button 
              variant={isActiveRoute('/search') ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors font-medium"
              onClick={() => router.push('/search')}
              style={{ 
                backgroundColor: isActiveRoute('/search') ? colors.primary : 'transparent',
                color: isActiveRoute('/search') ? colors.textPrimary : colors.textPrimary
              }}
            >
              <Search className="w-4 h-4 mr-2" /> Advanced Search
            </Button>
            {/* Added Upload link for desktop */}
            <Button 
              variant={isActiveRoute('/upload') ? 'default' : 'ghost'} 
              className="w-full justify-start transition-colors font-medium"
              onClick={() => router.push('/upload')}
              style={{ 
                backgroundColor: isActiveRoute('/upload') ? colors.primary : 'transparent',
                color: isActiveRoute('/upload') ? colors.textPrimary : colors.textPrimary
              }}
            >
              <Upload className="w-4 h-4 mr-2" /> Upload Material
            </Button>

            <Separator className="my-4" style={{ backgroundColor: colors.border }} />

            {/* Bookmarked/Saved Content Section */}
            <div 
              className="p-4 rounded-lg border-2" 
              style={{ 
                borderColor: colors.primary, 
                backgroundColor: colors.surface,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
              }}
            >
              <h3 className="font-bold mb-2 title-font flex items-center gap-2" style={{ color: colors.primary }}>
                <BookmarkPlus className="w-4 h-4" /> Saved Content
              </h3>
              <div className="space-y-1 overflow-auto" style={{ maxHeight: '12rem' }}>
                {isLoadingSaved ? (
                  <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>
                    Loading your saved content...
                  </p>
                ) : savedItems.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: colors.textSecondary }}>
                    You haven't saved any content yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedItems.slice(0, 5).map((item) => {
                      // Determine title and route based on item type
                      let title = '';
                      let route = '';
                      let icon = null;
                      
                      if (item.details) {
                        if (item.item_type === 'unit') {
                          title = item.details.name || item.details.code || 'Unit';
                          route = `/units/${item.item_id}`;
                          icon = <BookA className="w-3 h-3 flex-shrink-0" style={{ color: colors.primary }} />;
                        } else if (item.item_type === 'note') {
                          title = item.details.title || 'Note';
                          route = `/notes/${item.item_id}`;
                          icon = <BookCopy className="w-3 h-3 flex-shrink-0" style={{ color: colors.primary }} />;
                        } else if (item.item_type === 'pastpaper') {
                          title = item.details.title || `${item.details.year || ''} ${item.details.exam_type || ''}`.trim() || 'Past Paper';
                          route = `/pastpapers/${item.item_id}`;
                          icon = <FileText className="w-3 h-3 flex-shrink-0" style={{ color: colors.primary }} />;
                        }
                      }
                      
                      // Format saved date
                      const savedDate = new Date(item.saved_at);
                      const formattedDate = savedDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      });
                      
                      return (
                        <div 
                          key={item.id}
                          className="p-2 rounded hover:bg-opacity-10 cursor-pointer transition-colors text-sm"
                          style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                          onClick={() => router.push(route)}
                        >
                          <div className="flex items-start gap-2">
                            {icon}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate" style={{ color: colors.textPrimary }}>
                                {title}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" style={{ color: colors.textSecondary }} />
                                <span className="text-xs" style={{ color: colors.textSecondary }}>
                                  {formattedDate}
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="w-3 h-3 mt-1" style={{ color: colors.textSecondary }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <Separator className="my-2" style={{ backgroundColor: colors.border }} />
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2 text-xs"
                  onClick={() => router.push('/saved')}
                  style={{ borderColor: colors.primary, color: colors.primary }}
                  disabled={isLoadingSaved}
                >
                  {isLoadingSaved ? 'Loading...' : `View All Saved Content (${savedItems.length})`}
                </Button>
              </div>
            </div>

            {/* User Profile Section */}
            <div 
              className="p-4 rounded-lg border-2 mt-4" 
              style={{ 
                borderColor: colors.primary, 
                backgroundColor: colors.surface,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)'
              }}
            >
              <h3 className="font-bold mb-2 title-font flex items-center gap-2" style={{ color: colors.primary }}>
                <User className="w-4 h-4" /> Profile
              </h3>
              <div className="flex flex-col items-center gap-2">
                <Avatar className="w-16 h-16 border-2" style={{ borderColor: colors.primary }}>
                  <AvatarFallback style={{ backgroundColor: colors.primary, color: colors.textPrimary, fontSize: '1.5rem' }}>
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-bold" style={{ color: colors.textPrimary }}>{user?.name}</p>
                  <p className="text-xs" style={{ color: colors.textSecondary }}>{user?.email}</p>
                  {user?.faculty && (
                    <p className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                      Faculty: {user.faculty}
                    </p>
                  )}
                </div>
              </div>
              <Separator className="my-2" style={{ backgroundColor: colors.border }} />
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2 text-xs flex items-center justify-center gap-1"
                  onClick={handleLogout}
                  style={{ borderColor: colors.primary, color: colors.primary }}
                >
                  <LogOut className="w-3 h-3" /> Logout
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer 
        className="border-t mt-8" 
        style={{ 
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <BookOpen className="w-5 h-5" style={{ color: colors.primary }} />
              <span className="font-bold title-font" style={{ color: colors.primary }}>SyllaBuzz</span>
            </div>
            
            <div className="text-sm" style={{ color: colors.textSecondary }}>
              © {new Date().getFullYear()} SyllaBuzz. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;