import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const useGameRoom = (roomId) => {
  const [roomData, setRoomData] = useState(null);
  const [packData, setPackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    
    const unsubscribe = onSnapshot(roomRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoomData(data);
        
        if (!packData && data.packId) {
          const packRef = doc(db, 'packs', data.packId);
          const packSnap = await getDoc(packRef);
          if (packSnap.exists()) setPackData(packSnap.data());
        }
      } else {
        setError('Room closed.');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId, packData]);

  const startGame = async () => {
    if (!roomId) return;
    await updateDoc(doc(db, 'rooms', roomId), { status: 'playing', currentQuestionIndex: 0 });
  };

// 1. REPLACED: Now saves the raw text and the wager so the host can see it
  const submitAnswer = async (userId, isCorrect, wager, rawAnswer) => {
    if (!roomData) return;
    const roomRef = doc(db, 'rooms', roomId);
    
    const updatedPlayers = roomData.players.map(p => {
      if (p.uid === userId) {
        return { 
          ...p, 
          score: p.score + (isCorrect ? Number(wager) : 0), 
          answeredCurrentQuestion: true,
          usedWagers: [...(p.usedWagers || []), Number(wager)],
          currentAnswerText: rawAnswer, // Store what they typed/picked
          currentWager: Number(wager),  // Track the wager for math reversals
          isCurrentlyCorrect: isCorrect // Track their status
        };
      }
      return p;
    });

    await updateDoc(roomRef, { players: updatedPlayers });
  };

  // 2. NEW: The Host Override function
  const overrideAnswer = async (userId, makeCorrect) => {
    if (!roomData) return;
    const roomRef = doc(db, 'rooms', roomId);

    const updatedPlayers = roomData.players.map(p => {
      if (p.uid === userId) {
        // If they are already marked correctly/wrong, do nothing
        if (p.isCurrentlyCorrect === makeCorrect) return p;

        // The Math: Add the wager if forced correct, subtract if forced wrong
        const scoreAdjustment = makeCorrect ? p.currentWager : -p.currentWager;

        return {
          ...p,
          score: p.score + scoreAdjustment,
          isCurrentlyCorrect: makeCorrect
        };
      }
      return p;
    });

    await updateDoc(roomRef, { players: updatedPlayers });
  };

  // NEW: Host advances the game
  const nextQuestion = async (nextIndex, isGameOver) => {
    if (!roomData) return;
    const roomRef = doc(db, 'rooms', roomId);
    
    // Reset the "answered" status for all players for the new round
    const resetPlayers = roomData.players.map(p => ({ ...p, answeredCurrentQuestion: false }));
    
    await updateDoc(roomRef, {
      currentQuestionIndex: nextIndex,
      players: resetPlayers,
      status: isGameOver ? 'finished' : 'playing'
    });
  };

  return { roomData, packData, loading, error, startGame, submitAnswer, nextQuestion,overrideAnswer };
};