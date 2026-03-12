import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getUserPacks, createGameRoom, deleteQuestionPack } from '../firebase/firestore';

export default function MyPacks() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hostingId, setHostingId] = useState(null);

  useEffect(() => {
    const fetchPacks = async () => {
      if (user) {
        const userPacks = await getUserPacks(user.uid);
        setPacks(userPacks);
      }
      setLoading(false);
    };
    fetchPacks();
  }, [user]);

  const handleHostGame = async (packId) => {
    setHostingId(packId);
    const { roomId, error } = await createGameRoom(packId, user.uid);
    setHostingId(null);
    if (error) alert("Failed to create room: " + error);
    else navigate(`/room/${roomId}`);
  };

  // NEW: Delete Handler
  const handleDelete = async (packId) => {
    // Standard browser confirmation to prevent accidental clicks
    if (window.confirm("Are you sure you want to delete this pack? This cannot be undone.")) {
      const { error } = await deleteQuestionPack(packId);
      if (!error) {
        // Remove it from the screen immediately without reloading
        setPacks(packs.filter(p => p.id !== packId));
      } else {
        alert("Failed to delete pack: " + error);
      }
    }
  };

  if (loading) return <div className="p-10 text-center text-dssa-blue font-bold">Loading Library...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-dssa-blue">My Question Library</h1>
        <button 
          onClick={() => navigate('/packs/create')}
          className="px-6 py-2 bg-dssa-blue text-white rounded-lg font-semibold hover:bg-opacity-90"
        >
          + New Pack
        </button>
      </div>

      {packs.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow-card text-center text-gray-500 border border-gray-200">
          You haven't created any question packs yet!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <div key={pack.id} className="bg-white p-6 rounded-xl shadow-card border-t-4 border-dssa-blue flex flex-col relative">
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold text-dssa-blue pr-4 line-clamp-2">{pack.title}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${pack.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {pack.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-3">{pack.description}</p>
                <p className="text-xs font-semibold text-dssa-gold mb-4">{pack.questions?.length || 0} Questions</p>
              </div>
              
              {/* NEW: Edit and Delete Buttons */}
              <div className="flex justify-between items-center mb-4 pt-4 border-t border-gray-100">
                <button 
                  onClick={() => navigate(`/packs/edit/${pack.id}`)}
                  className="text-sm font-semibold text-dssa-blue hover:underline"
                >
                  Edit Pack
                </button>
                <button 
                  onClick={() => handleDelete(pack.id)}
                  className="text-sm font-semibold text-red-500 hover:text-red-700 hover:underline"
                >
                  Delete
                </button>
              </div>

              <button 
                onClick={() => handleHostGame(pack.id)}
                disabled={hostingId === pack.id}
                className="w-full py-2 bg-dssa-gold text-white rounded-lg font-bold hover:bg-opacity-90 disabled:opacity-50 transition-colors"
              >
                {hostingId === pack.id ? 'Starting...' : 'Host Game'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}