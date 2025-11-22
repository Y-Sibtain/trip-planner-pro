import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useBooking } from '@/contexts/BookingContext';
import { User, Settings, BookOpen, Heart, LogOut, LogIn } from 'lucide-react';

export const UserMenu = () => {
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated } = useBooking();

  const handleSignOut = () => {
    setIsAuthenticated(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        onClick={() => navigate('/auth')}
        className="bg-background/80 backdrop-blur-sm"
      >
        <LogIn className="w-4 h-4 mr-2" />
        Sign In
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-background/80 backdrop-blur-sm flex items-center gap-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              JD
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:inline">John Doe</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile & Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/my-bookings')}>
          <BookOpen className="mr-2 h-4 w-4" />
          <span>My Bookings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/saved-itineraries')}>
          <Heart className="mr-2 h-4 w-4" />
          <span>Saved Itineraries</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
