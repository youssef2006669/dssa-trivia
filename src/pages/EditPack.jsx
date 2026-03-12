import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getQuestionPack, updateQuestionPack } from '../firebase/firestore';

export default function EditPack() {
  const { packId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [pack, setPack] = useState({ title: '', description: '', isPublic: true });
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchPack = async () => {
      const packData = await getQuestionPack(packId);
      
      if (!packData) {
        setError("Error: This question pack could not be found or is corrupted.");
      } else if (packData.createdBy !== user.uid) {
        setError("You don't have permission to edit this pack.");
      } else {
        setPack({ 
          title: packData.title || '', 
          description: packData.description || '', 
          isPublic: packData.isPublic !== undefined ? packData.isPublic : true 
        });
        
        const loadedQuestions = (packData.questions || []).map(q => ({
          ...q,
          type: q.type || 'mcq',
          correctAnswerText: q.correctAnswerText || '',
          options: q.options || ['', '', '', ''],
          correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0
        }));
        
        setQuestions(loadedQuestions);
      }
      setLoading(false);
    };
    
    fetchPack();
  }, [packId, user.uid]);

  const handlePackChange = (e) => {
    setPack({ ...pack, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options[optIndex] = value;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { type: 'mcq', question: '', options: ['', '', '', ''], correctAnswer: 0, correctAnswerText: '' }]);
  };

  const removeQuestion = (indexToRemove) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, index) => index !== indexToRemove));
    } else {
      alert("You must have at least one question in a pack!");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const cleanedQuestions = questions.map(q => {
      if (q.type === 'written') {
        return { type: 'written', question: q.question, correctAnswerText: q.correctAnswerText };
      } else {
        return { type: 'mcq', question: q.question, options: q.options, correctAnswer: q.correctAnswer };
      }
    });

    const fullPackData = { ...pack, questions: cleanedQuestions };
    const { error } = await updateQuestionPack(packId, fullPackData);
    setSaving(false);
    
    if (!error) navigate('/dashboard'); 
    else alert(error);
  };

  if (loading) return <div className="p-10 text-center text-xl font-bold text-dssa-blue">Loading Pack Editor...</div>;
  if (error) return <div className="p-10 text-center text-xl font-bold text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-card border-t-8 border-dssa-blue">
        <h1 className="text-2xl sm:text-3xl font-black text-dssa-blue mb-6">Edit Question Pack</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Pack Details */}
          <div className="space-y-4 border-b border-gray-200 pb-6">
            <input type="text" name="title" placeholder="Pack Title" required value={pack.title} className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-lg focus:border-dssa-gold outline-none font-bold text-dssa-blue" onChange={handlePackChange} />
            <textarea name="description" placeholder="Short description..." required value={pack.description} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-dssa-gold outline-none" onChange={handlePackChange} />
            
            <div className="flex items-start sm:items-center space-x-3 pt-2">
              <input 
                type="checkbox" 
                id="isPublic"
                checked={pack.isPublic}
                onChange={(e) => setPack({ ...pack, isPublic: e.target.checked })}
                className="w-5 h-5 mt-1 sm:mt-0 text-dssa-blue cursor-pointer flex-shrink-0" 
              />
              <label htmlFor="isPublic" className="text-gray-600 font-semibold cursor-pointer text-sm sm:text-base">
                Make this pack public (Visible in DSSA Global Library)
              </label>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl sm:text-2xl font-bold text-dssa-blue">Questions</h2>
              <span className="bg-dssa-light text-dssa-blue px-4 py-1 rounded-full font-bold text-sm">
                Total: {questions.length}
              </span>
            </div>

            {questions.map((q, qIndex) => (
              <div key={qIndex} className="p-4 sm:p-6 bg-gray-50 rounded-xl border-2 border-gray-200 relative animate-fade-in-up">
                
                {/* Header: Number & Controls (Mobile Fixed) */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <span className="bg-dssa-blue text-white w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full font-black shadow-md">
                      {qIndex + 1}
                    </span>
                    
                    <select 
                      value={q.type} 
                      onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)}
                      className="w-full px-3 py-2 bg-white border-2 border-gray-300 rounded-lg font-bold text-dssa-blue outline-none cursor-pointer focus:border-dssa-gold text-sm sm:text-base"
                    >
                      <option value="mcq">Multiple Choice</option>
                      <option value="written">Written Answer</option>
                    </select>
                  </div>
                  
                  <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700 font-bold px-3 py-2 rounded-lg hover:bg-red-50 transition-colors self-end sm:self-auto flex-shrink-0">
                    Delete
                  </button>
                </div>

                <input type="text" placeholder="Type the question here..." required className="w-full px-4 py-3 mb-6 border-2 border-gray-300 rounded-lg outline-none focus:border-dssa-blue text-base sm:text-lg font-semibold" value={q.question} onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)} />
                
                {q.type === 'written' ? (
                  <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-dashed border-dssa-gold text-center">
                    <label className="block text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">Accepted Correct Answer</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Mandible" 
                      required 
                      className="w-full max-w-md mx-auto px-4 py-3 border-2 border-green-400 bg-green-50 text-green-800 rounded-lg outline-none text-center font-bold text-lg sm:text-xl" 
                      value={q.correctAnswerText} 
                      onChange={(e) => handleQuestionChange(qIndex, 'correctAnswerText', e.target.value)} 
                    />
                    <p className="text-xs text-gray-400 mt-3 font-medium">Note: Answers are not case-sensitive.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors ${q.correctAnswer === optIndex ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
                        <input type="radio" name={`correct-${qIndex}`} required checked={q.correctAnswer === optIndex} onChange={() => handleQuestionChange(qIndex, 'correctAnswer', optIndex)} className="w-5 h-5 text-green-500 cursor-pointer flex-shrink-0" />
                        <input type="text" placeholder={`Option ${optIndex + 1}`} required className="w-full px-2 py-1 bg-transparent outline-none font-semibold text-gray-700 text-sm sm:text-base" value={opt} onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)} />
                      </div>
                    ))}
                  </div>
                )}
                
              </div>
            ))}
          </div>

          {/* Form Actions (Mobile Fixed) */}
          <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-6 border-t border-gray-200">
            <button type="button" onClick={addQuestion} className="w-full sm:w-auto px-6 py-4 sm:py-3 border-2 border-dssa-blue text-dssa-blue rounded-xl font-black hover:bg-dssa-blue hover:text-white transition-all shadow-sm">
              + Add Another Question
            </button>
            <button type="submit" disabled={saving} className="w-full sm:w-auto px-6 py-4 bg-dssa-gold text-white rounded-xl font-black text-lg sm:text-xl hover:bg-opacity-90 disabled:opacity-50 transition-all shadow-xl hover:-translate-y-1">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}