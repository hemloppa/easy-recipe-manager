
import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { 
  auth,
  db,
  doc,
  setDoc,
  getDoc,
  subscribeToAuth,
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  createOrUpdateUserDocument
} from "../lib/firebase";

interface User {
  uid: string;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((authUser) => {
      if (authUser) {
        setUser({
          uid: authUser.uid,
          email: authUser.email
        });
        
        // Ensure the user document exists whenever a user logs in
        createOrUpdateUserDocument(authUser.uid, authUser.email)
          .catch(err => console.error("Error ensuring user document exists:", err));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await registerWithEmail(email, password);
      const user = userCredential.user;

      // Create user document in Firestore with explicit fields
      await createOrUpdateUserDocument(user.uid, user.email);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred during sign up");
      }
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await loginWithEmail(email, password);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred during sign in");
      }
      throw error;
    }
  };

  const logOut = async () => {
    try {
      setError(null);
      await logoutUser();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred during logout");
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, logOut, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
