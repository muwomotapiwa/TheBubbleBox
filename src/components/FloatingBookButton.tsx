import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export function FloatingBookButton() {
  const location = useLocation();
  
  // Don't show on booking page or admin
  if (location.pathname === '/booking' || location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 md:hidden bg-black border-t border-gray-800 p-4 z-40">
      <Link
        to="/booking"
        className="flex items-center justify-center gap-2 w-full bg-[#e14171] text-white py-3 rounded-full font-semibold hover:bg-[#c73562] transition-colors shadow-lg"
      >
        <ShoppingBag className="h-5 w-5" />
        <span>Book Now</span>
      </Link>
    </div>
  );
}
