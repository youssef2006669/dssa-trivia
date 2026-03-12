import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useGameRoom } from '../hooks/useGameRoom';

// --- HELPER FUNCTION: Calculates typos (Levenshtein Distance) ---
function getEditDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export default function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // FIXED: Pulled overrideAnswer from the hook
  const { roomData, packData, loading, error, startGame, submitAnswer, nextQuestion, overrideAnswer } = useGameRoom(roomId);

  const [timeLeft, setTimeLeft] = useState(30); 
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  
  const [selectedOption, setSelectedOption] = useState(null); 
  const [textAnswer, setTextAnswer] = useState(''); 
  const [wager, setWager] = useState(null); 

  useEffect(() => {
    if (roomData?.status === 'playing' && packData) {
      const allPlayersAnswered = roomData.players?.every(p => p.answeredCurrentQuestion);
      
      if (timeLeft > 0 && !showAnswer && !allPlayersAnswered) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      } else if (timeLeft === 0 || allPlayersAnswered) {
        setShowAnswer(true);
      }
    }
  }, [timeLeft, showAnswer, roomData, packData]);

  useEffect(() => {
    if (roomData?.status === 'playing') {
      setHasAnswered(false);
      setShowAnswer(false);
      setTimeLeft(30);
      setSelectedOption(null);
      setTextAnswer('');
      setWager(null);
    }
  }, [roomData?.currentQuestionIndex, roomData?.status]);


  if (loading) return <div className="p-10 text-center text-xl font-bold text-dssa-blue">Connecting to Room...</div>;
  if (error) return <div className="p-10 text-center text-xl font-bold text-red-600">{error}</div>;
  if (!roomData) return null;

  const isHost = user?.uid === roomData.hostId;
  const currentPlayer = roomData.players?.find(p => p.uid === user?.uid);
  const usedWagers = currentPlayer?.usedWagers || [];

  // ------------------------------------------
  // WAITING ROOM STATE
  // ------------------------------------------
  if (roomData.status === 'waiting') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <div className="bg-white p-10 rounded-xl shadow-card border-t-8 border-dssa-blue mb-8">
          <h2 className="text-gray-500 font-semibold mb-2 text-lg uppercase tracking-wider">Join at DSSA Trivia with code:</h2>
          <h1 className="text-6xl font-black text-dssa-gold tracking-widest mb-6">{roomData.roomCode}</h1>
          <p className="text-xl text-dssa-blue font-bold">{packData?.title || 'Loading Pack...'}</p>
        </div>

        <div className="flex justify-between items-center mb-6 px-4">
          <h3 className="text-2xl font-bold text-dssa-blue">
            Players ({roomData.players?.length || 0})
          </h3>
          {isHost && (
            <button 
              onClick={startGame}
              disabled={!roomData.players || roomData.players.length === 0}
              className="px-8 py-3 bg-dssa-blue text-white rounded-lg font-bold text-lg hover:bg-opacity-90 disabled:opacity-50 transition-colors shadow-md"
            >
              Start Game
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {roomData.players?.length > 0 ? (
            roomData.players.map((player, index) => (
              <div key={index} className="bg-dssa-light py-4 px-2 rounded-lg border-2 border-dssa-grey font-bold text-dssa-blue shadow-sm animate-fade-in-up">
                {player.name}
              </div>
            ))
          ) : (
            <div className="col-span-full py-10 text-gray-400 italic font-medium">
              Waiting for players to join...
            </div>
          )}
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // PLAYING STATE (Live Game Loop)
  // ------------------------------------------
  if (roomData.status === 'playing' && packData) {
    const currentQ = packData.questions[roomData.currentQuestionIndex];
    const isWritten = currentQ.type === 'written'; 
    
    const handleLockIn = () => {
      if (hasAnswered || isHost || showAnswer || !wager) return;
      
      let isCorrect = false;
      let rawAnswer = ''; // FIXED: Grab exactly what they answered

      if (isWritten) {
        const playerText = textAnswer.trim().toLowerCase();
        const correctText = (currentQ.correctAnswerText || '').trim().toLowerCase();
        rawAnswer = textAnswer.trim(); 
        
        if (playerText === correctText) {
          isCorrect = true;
        } else {
          const typos = getEditDistance(playerText, correctText);
          const allowedTypos = correctText.length > 5 ? 2 : 1;
          isCorrect = typos <= allowedTypos;
        }
      } else {
        isCorrect = selectedOption === currentQ.correctAnswer;
        rawAnswer = String(selectedOption);
      }

      setHasAnswered(true);
      // FIXED: Send the raw answer to the database
      submitAnswer(user.uid, isCorrect, Number(wager), rawAnswer);
    };

    const handleNext = () => {
      const isLastQuestion = roomData.currentQuestionIndex >= packData.questions.length - 1;
      nextQuestion(roomData.currentQuestionIndex + 1, isLastQuestion);
    };

    const isSubmitDisabled = hasAnswered || showAnswer || !wager || (isWritten ? !textAnswer.trim() : selectedOption === null);

    let textInputBgClass = "border-gray-300 focus:border-dssa-blue text-dssa-blue";
    if (showAnswer && isWritten && !isHost) {
      // Dynamic color now relies on the database's truth, so overrides change their screen!
      const isCurrentlyCorrect = currentPlayer?.isCurrentlyCorrect;
      
      if (isCurrentlyCorrect) {
        textInputBgClass = 'border-green-500 bg-green-50 text-green-700'; 
      } else {
        textInputBgClass = 'border-red-500 bg-red-50 text-red-700'; 
      }
    } else if (hasAnswered) {
      textInputBgClass = 'border-dssa-blue bg-gray-50 text-dssa-blue';
    }

    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <span className="text-xl font-bold text-dssa-blue bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
            Question {roomData.currentQuestionIndex + 1} / {packData.questions.length}
          </span>
          <div className={`text-3xl font-black px-6 py-3 rounded-xl shadow-md transition-colors ${timeLeft <= 5 && !showAnswer ? 'bg-red-500 text-white animate-pulse' : 'bg-dssa-gold text-white'}`}>
            {timeLeft}s
          </div>
        </div>

        <div className="bg-white p-10 rounded-2xl shadow-card border-b-8 border-dssa-blue mb-8 text-center min-h-[200px] flex flex-col items-center justify-center">
          <h2 className="text-3xl md:text-4xl font-bold text-dssa-blue leading-tight mb-4">
            {currentQ.question}
          </h2>
          {isWritten && <span className="text-gray-400 font-semibold uppercase tracking-wider text-sm">Written Question</span>}
        </div>

        {/* --- ANSWER UI SECTION --- */}
        {isWritten && !isHost ? (
          <div className="mb-8">
            <input 
              type="text" 
              placeholder="Type your exact answer here..."
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              disabled={hasAnswered || showAnswer}
              className={`w-full p-6 text-2xl font-bold border-4 rounded-xl outline-none transition-colors shadow-sm text-center ${textInputBgClass}`}
            />
            {showAnswer && (
              <div className="mt-6 text-2xl font-black text-green-600 text-center animate-fade-in-up">
                Correct Answer: <span className="underline decoration-4 underline-offset-4">{currentQ.correctAnswerText}</span>
              </div>
            )}
          </div>
        ) : (!isHost && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {currentQ.options?.map((option, index) => {
              let bgClass = "bg-white hover:bg-gray-50 border-gray-200 text-dssa-blue cursor-pointer";
              if (showAnswer) {
                // Check if host overrode this option to be correct/wrong
                if (currentPlayer?.currentAnswerText === String(index) && currentPlayer?.isCurrentlyCorrect) {
                  bgClass = "bg-green-500 text-white border-green-600 scale-[1.02] shadow-lg z-10"; 
                } else if (index === currentQ.correctAnswer) {
                  bgClass = "bg-green-500 text-white border-green-600 opacity-70"; 
                } else if (currentPlayer?.currentAnswerText === String(index)) {
                  bgClass = "bg-red-500 text-white border-red-600 shadow-md"; 
                } else {
                  bgClass = "bg-gray-100 text-gray-400 border-gray-200 opacity-50 cursor-default"; 
                }
              } else if (hasAnswered) {
                 if (index === selectedOption) bgClass = "bg-dssa-blue text-white border-dssa-blue shadow-md scale-[1.02]";
                 else bgClass = "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50"; 
              } else if (index === selectedOption) {
                 bgClass = "bg-blue-100 text-dssa-blue border-dssa-blue shadow-md scale-[1.02]";
              }

              return (
                <button
                  key={index}
                  onClick={() => setSelectedOption(index)}
                  disabled={hasAnswered || showAnswer}
                  className={`p-6 text-xl font-bold rounded-xl border-4 transition-all duration-200 ${bgClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ))}

        {/* --- BRAND NEW TILED WAGER UI --- */}
        {!isHost && (
          <div className="flex flex-col items-center justify-center bg-gray-50 p-6 rounded-2xl border-2 border-gray-200 mb-8">
            <div className="w-full mb-8">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">Select Your Wager</h3>
              
              <div className="grid grid-cols-5 md:grid-cols-10 gap-2 sm:gap-3">
                {[...Array(20)].map((_, i) => {
                  const points = i + 1;
                  const isUsed = usedWagers.includes(points);
                  const isSelected = wager === points;
                  
                  let btnClass = "py-3 rounded-xl font-black text-lg sm:text-xl border-b-4 transition-all duration-200 flex items-center justify-center shadow-sm ";
                  
                  if (isUsed) {
                    btnClass += "bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-50 translate-y-1 border-b-0"; 
                  } else if (isSelected) {
                    btnClass += "bg-dssa-gold text-white border-yellow-600 scale-110 shadow-lg z-10 transform -translate-y-1"; 
                  } else {
                    btnClass += "bg-white text-dssa-blue border-gray-300 hover:border-dssa-blue hover:text-dssa-blue active:border-b-0 active:translate-y-1 cursor-pointer"; 
                  }

                  return (
                    <button
                      key={points}
                      onClick={() => setWager(points)}
                      disabled={isUsed || hasAnswered || showAnswer}
                      className={btnClass}
                    >
                      {points}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <button 
              onClick={handleLockIn}
              disabled={isSubmitDisabled}
              className={`w-full max-w-md px-8 py-5 font-black text-2xl rounded-xl transition-all shadow-xl ${
                hasAnswered 
                  ? 'bg-green-500 text-white opacity-100 border-b-4 border-green-700' 
                  : isSubmitDisabled 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed border-b-4 border-gray-400 translate-y-1 border-b-0' 
                      : 'bg-dssa-blue text-white hover:bg-opacity-90 active:border-b-0 active:translate-y-1 border-b-4 border-blue-900'
              }`}
            >
              {hasAnswered ? 'Answer Locked! 🔒' : 'Lock In Answer'}
            </button>
          </div>
        )}

        {/* --- HOST CONTROLS & OVERRIDE UI --- */}
        {isHost && showAnswer && (
          <div className="mt-10 animate-fade-in-up w-full max-w-4xl mx-auto">
            
            {/* NEW: The Review Panel */}
            <div className="bg-white p-6 rounded-2xl shadow-card border-2 border-gray-200 mb-8">
              <h3 className="text-xl font-bold text-dssa-blue mb-4 border-b-2 border-gray-100 pb-3 flex items-center justify-between">
                <span>Host Override: Review Answers</span>
                <span className="text-sm font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">DSSA Live Control</span>
              </h3>
              
              <div className="space-y-3">
                {roomData.players?.map((p, idx) => {
                  if (!p.answeredCurrentQuestion) return null;

                  // Format what they answered
                  let displayAnswer = p.currentAnswerText;
                  if (!isWritten && p.currentAnswerText !== undefined) {
                     displayAnswer = currentQ.options[Number(p.currentAnswerText)] || "No Answer";
                  }

                  return (
                    <div key={idx} className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="mb-4 md:mb-0 text-left w-full md:w-auto">
                        <span className="font-bold text-lg text-dssa-blue block">{p.name}</span>
                        <span className="text-gray-600 font-medium">
                          Answered: <strong className="text-black bg-white px-2 py-1 rounded border shadow-sm ml-1">"{displayAnswer}"</strong>
                        </span>
                        <span className="text-gray-500 ml-3 text-sm font-bold bg-dssa-gold text-white px-2 py-1 rounded-full">{p.currentWager} pts</span>
                      </div>
                      
                      <div className="flex space-x-2 w-full md:w-auto">
                        <button
                          onClick={() => overrideAnswer(p.uid, true)}
                          disabled={p.isCurrentlyCorrect}
                          className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold transition-all ${p.isCurrentlyCorrect ? 'bg-green-500 text-white cursor-default shadow-inner' : 'bg-white border-2 border-green-500 text-green-600 hover:bg-green-50 active:scale-95'}`}
                        >
                          {p.isCurrentlyCorrect ? 'Correct ✓' : 'Force Correct'}
                        </button>
                        <button
                          onClick={() => overrideAnswer(p.uid, false)}
                          disabled={!p.isCurrentlyCorrect}
                          className={`flex-1 md:flex-none px-4 py-2 rounded-lg font-bold transition-all ${!p.isCurrentlyCorrect ? 'bg-red-500 text-white cursor-default shadow-inner' : 'bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 active:scale-95'}`}
                        >
                          {!p.isCurrentlyCorrect ? 'Wrong ✗' : 'Force Wrong'}
                        </button>
                      </div>
                    </div>
                  )
                })}
                {roomData.players?.every(p => !p.answeredCurrentQuestion) && (
                  <p className="text-gray-500 italic text-center py-4">No players submitted an answer this round.</p>
                )}
              </div>
            </div>

            <div className="text-center">
              <button 
                onClick={handleNext}
                className="px-10 py-4 bg-dssa-blue text-white rounded-xl font-black text-xl hover:bg-opacity-90 shadow-xl transition-transform hover:-translate-y-1 border-b-4 border-blue-900 active:border-b-0 active:translate-y-1"
              >
                {roomData.currentQuestionIndex >= packData.questions.length - 1 ? 'End Game & Show Results' : 'Next Question ➔'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ------------------------------------------
  // FINISHED STATE (Leaderboard)
  // ------------------------------------------
  if (roomData.status === 'finished') {
    const sortedPlayers = [...(roomData.players || [])].sort((a, b) => b.score - a.score);

    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center animate-fade-in-up">
        <h1 className="text-5xl font-black text-dssa-blue mb-2">Game Over!</h1>
        <p className="text-xl text-dssa-gold font-bold mb-10">Final Results</p>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden border-t-8 border-dssa-gold max-w-2xl mx-auto">
          {sortedPlayers.length > 0 ? (
            sortedPlayers.map((player, index) => (
              <div key={index} className={`flex justify-between items-center p-6 border-b border-gray-100 transition-all hover:bg-gray-50 ${index === 0 ? 'bg-yellow-50/50' : ''}`}>
                <div className="flex items-center space-x-6">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${
                    index === 0 ? 'bg-yellow-400 scale-110' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-dssa-blue'                            
                  }`}>
                    {index + 1}
                  </span>
                  <span className={`text-2xl font-bold ${index === 0 ? 'text-yellow-600' : 'text-dssa-blue'}`}>
                    {player.name}
                  </span>
                </div>
                <span className="text-2xl font-black text-dssa-gold">
                  {player.score} <span className="text-sm text-gray-400 font-semibold">pts</span>
                </span>
              </div>
            ))
          ) : (
            <div className="p-10 text-gray-500 font-medium">No players joined this game.</div>
          )}
        </div>

        <div className="mt-12">
          <button onClick={() => navigate('/dashboard')} className="px-10 py-4 bg-dssa-blue text-white rounded-xl font-bold text-xl hover:bg-opacity-90 shadow-lg transition-transform hover:-translate-y-1">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <div className="p-10 text-center text-3xl font-black text-dssa-gold mt-20">Game Over!</div>;
}