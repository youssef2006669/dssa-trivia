import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, arrayUnion, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './config'; // <--- THIS WAS THE MISSING LINE!

// Saves a newly created pack
export const createQuestionPack = async (packData, userId) => {
  try {
    const docRef = await addDoc(collection(db, 'packs'), {
      title: packData.title,
      description: packData.description,
      isPublic: packData.isPublic,
      questions: packData.questions,
      createdBy: userId,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    console.error("Error creating pack: ", error);
    return { id: null, error: error.message };
  }
};

// Fetch all packs created by the logged-in user
export const getUserPacks = async (userId) => {
  try {
    const q = query(collection(db, 'packs'), where('createdBy', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching packs:", error);
    return [];
  }
};

// Generate a room code and create the active game session
export const createGameRoom = async (packId, hostId) => {
  try {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const roomRef = await addDoc(collection(db, 'rooms'), {
      roomCode,
      hostId,
      packId,
      status: "waiting",
      currentQuestionIndex: 0,
      players: [],
      createdAt: serverTimestamp()
    });
    return { roomId: roomRef.id, roomCode, error: null };
  } catch (error) {
    console.error("Error creating room:", error);
    return { roomId: null, roomCode: null, error: error.message };
  }
};

// Find a room by its 6-digit code and add the player
export const joinGameRoom = async (roomCode, userData) => {
  try {
    const q = query(collection(db, 'rooms'), where('roomCode', '==', roomCode.toUpperCase()), where('status', '==', 'waiting'));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return { roomId: null, error: "Invalid code or the game has already started." };

    const roomDoc = querySnapshot.docs[0];
    const roomId = roomDoc.id;

    await updateDoc(doc(db, 'rooms', roomId), {
      players: arrayUnion({
        uid: userData.uid,
        name: userData.name,
        score: 0,
        answeredCurrentQuestion: false,
        usedWagers: [] // <--- ADD THIS LINE
      })
    });

    return { roomId, error: null };
  } catch (error) {
    console.error("Error joining room:", error);
    return { roomId: null, error: error.message };
  }
};

// Fetch a single pack by its ID (for editing)
export const getQuestionPack = async (packId) => {
  try {
    const docSnap = await getDoc(doc(db, 'packs', packId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error("Error fetching pack:", error);
    return null;
  }
};

// Update an existing pack
export const updateQuestionPack = async (packId, updatedData) => {
  try {
    await updateDoc(doc(db, 'packs', packId), updatedData);
    return { error: null };
  } catch (error) {
    console.error("Error updating pack:", error);
    return { error: error.message };
  }
};

// Delete a pack
export const deleteQuestionPack = async (packId) => {
  try {
    await deleteDoc(doc(db, 'packs', packId));
    return { error: null };
  } catch (error) {
    console.error("Error deleting pack:", error);
    return { error: error.message };
  }
};