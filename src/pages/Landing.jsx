import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center text-center px-4">
      <div className="max-w-4xl space-y-8 animate-fade-in-up">
        {/* Hero Title */}
        <h1 className="text-6xl md:text-8xl font-black text-dssa-blue tracking-tight leading-tight">
          DSSA <span className="text-dssa-gold">Trivia</span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-gray-600 font-medium max-w-2xl mx-auto">
          The official clinical knowledge battleground for the Dental Students' Scientific Association.
        </p>
        
        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
          <button 
            onClick={() => navigate('/lobby')}
            className="w-full sm:w-auto px-12 py-5 bg-dssa-gold text-white rounded-2xl font-black text-2xl hover:bg-opacity-90 shadow-xl transition-transform hover:-translate-y-1"
          >
            Join a Game
          </button>
          
          <button 
            onClick={() => navigate(user ? '/dashboard' : '/auth')}
            className="w-full sm:w-auto px-12 py-5 border-4 border-dssa-blue text-dssa-blue rounded-2xl font-black text-2xl hover:bg-dssa-blue hover:text-white shadow-xl transition-all hover:-translate-y-1"
          >
            {user ? 'Go to Dashboard' : 'Host a Game'}
          </button>
        </div>
      </div>

      {/* Footer / Decorative element */}
      <div className="absolute bottom-10 text-gray-400 font-semibold text-sm">
        Powered by DSSA Alexandria
      </div>
    </div>
  );
}