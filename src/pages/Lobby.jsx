import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { joinGameRoom } from '../firebase/firestore';

export default function Lobby() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (roomCode.length !== 6) {
      setError('Room code must be exactly 6 characters.');
      return;
    }

    setError('');
    setLoading(true);

    const userData = { uid: user.uid, name: profile?.name || 'Player' };
    const { roomId, error: joinError } = await joinGameRoom(roomCode, userData);

    setLoading(false);

    if (joinError) {
      setError(joinError);
    } else {
      // Success! Send them to the game room
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-card border-t-4 border-dssa-gold text-center">
        <h1 className="text-3xl font-bold text-dssa-blue mb-2">Join Game</h1>
        <p className="text-gray-500 mb-8">Enter the 6-digit room code from your host.</p>

        {error && <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

        <form onSubmit={handleJoin} className="space-y-6">
          <input
            type="text"
            maxLength={6}
            placeholder="e.g. A7X9TQ"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            className="w-full text-center text-4xl tracking-widest font-bold text-dssa-blue px-4 py-4 border-2 border-dssa-grey rounded-lg focus:outline-none focus:border-dssa-gold uppercase transition-colors"
            required
          />
          
          <button
            type="submit"
            disabled={loading || roomCode.length < 6}
            className="w-full py-4 text-lg text-white transition-colors rounded-lg bg-dssa-blue hover:bg-opacity-90 disabled:opacity-50 font-bold shadow-md"
          >
            {loading ? 'Joining...' : 'Enter Room'}
          </button>
        </form>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="mt-6 text-sm text-gray-500 hover:text-dssa-blue hover:underline font-medium"
        >
          Cancel and return to Dashboard
        </button>
      </div>
    </div>
  );
}