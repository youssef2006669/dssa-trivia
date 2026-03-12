import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { logoutUser } from '../../firebase/auth';

export default function Navbar() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/auth');
  };

  // If there's no user logged in, we don't render the navbar
  if (!user) return null;

  return (
    <nav className="bg-white border-b border-dssa-grey shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo / Brand */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => navigate('/dashboard')}
          >
            <span className="text-2xl font-bold text-dssa-blue tracking-tight">
              DSSA <span className="text-dssa-gold">Alex</span>
            </span>
          </div>

          {/* User Controls */}
          <div className="flex items-center space-x-6">
            <div className="text-sm text-right hidden md:block">
              <p className="font-semibold text-dssa-blue">{profile?.name || 'Player'}</p>
              <p className="text-xs text-gray-500">{profile?.university || 'University'}</p>
            </div>
            
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-dssa-blue bg-dssa-light rounded-md hover:bg-gray-200 transition-colors"
            >
              Log Out
            </button>
          </div>
          
        </div>
      </div>
    </nav>
  );
}