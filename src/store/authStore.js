import { create } from 'zustand';
import { auth } from '../firebase/config';
import { getUserProfile } from '../firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,

  initAuthListener: () => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Try to fetch the extra user data (name, university)
          const profileData = await getUserProfile(currentUser.uid);
          set({ user: currentUser, profile: profileData, loading: false });
        } catch (error) {
          // If Firestore fails, log the error but STOP the loading screen!
          console.error("Firestore Error:", error);
          set({ user: currentUser, profile: null, loading: false });
        }
      } else {
        // No user is logged in
        set({ user: null, profile: null, loading: false });
      }
    });
  }
}));