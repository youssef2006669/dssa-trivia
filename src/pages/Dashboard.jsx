import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Welcome Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-dssa-blue">
          Welcome back, {profile?.name?.split(' ')[0] || 'Doc'}!
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Ready to test your knowledge or challenge your colleagues?
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Join Game Card */}
        <div className="bg-white p-8 rounded-xl shadow-card border-t-4 border-dssa-gold hover:-translate-y-1 transition-transform cursor-pointer">
          <h2 className="text-2xl font-bold text-dssa-blue mb-2">Join a Game</h2>
          <p className="text-gray-500 mb-6">Have a room code? Jump right into an active trivia match.</p>
          <button 
            onClick={() => navigate('/lobby')}
            className="w-full py-3 bg-dssa-blue text-white rounded-lg font-semibold hover:bg-opacity-90"
          >
            Enter Room Code
          </button>
        </div>

        {/* Create Pack Card */}
        <div className="bg-white p-8 rounded-xl shadow-card border-t-4 border-dssa-blue hover:-translate-y-1 transition-transform cursor-pointer">
          <h2 className="text-2xl font-bold text-dssa-blue mb-2">Create Pack</h2>
          <p className="text-gray-500 mb-6">Author your own medical or general trivia questions.</p>
          <button 
            onClick={() => navigate('/packs/create')}
            className="w-full py-3 bg-dssa-light text-dssa-blue border border-dssa-blue rounded-lg font-semibold hover:bg-dssa-blue hover:text-white transition-colors"
          >
            Build Questions
          </button>
        </div>

        {/* My Packs Card */}
        <div className="bg-white p-8 rounded-xl shadow-card border-t-4 border-gray-300 hover:-translate-y-1 transition-transform cursor-pointer">
          <h2 className="text-2xl font-bold text-dssa-blue mb-2">My Library</h2>
          <p className="text-gray-500 mb-6">Manage your existing question packs and host a game.</p>
          <button 
            onClick={() => navigate('/packs')}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
          >
            View Library
          </button>
        </div>

      </div>
    </div>
  );
}