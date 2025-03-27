import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Flame } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-lg border-b border-border/40 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold text-primary">
          <Flame className="h-6 w-6 text-purple-500" />
          <span>BLAZE</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-purple-600 hover:bg-purple-700">Sign Up</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;