import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import axios from "axios";

// Configure axios with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL || "http://localhost:5000",
});

// Define types for auth state and context
interface User {
  id: string;
  name: string;
  email: string;
  faculty?: string;
  role?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    password: string,
    faculty?: string
  ) => Promise<boolean>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<boolean>;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: true,
    user: null,
    token: null,
    loading: true,
  });

  // Set up axios interceptor to include auth token in all requests
  useEffect(() => {
    const interceptor = api.interceptors.request.use(
      (config) => {
        if (authState.token) {
          config.headers.Authorization = `Bearer ${authState.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Clean up interceptor on unmount
    return () => {
      api.interceptors.request.eject(interceptor);
    };
  }, [authState.token]);

  // Load auth state from localStorage on startup
  useEffect(() => {
    const loadAuthState = async () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");

      console.log(token, user);

      if (token && user) {
        try {
          // Verify token is still valid
          // Correct way
          await api.post(
            "/api/auth/verify",
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          // Token is valid
          setAuthState({
            isAuthenticated: true,
            user: JSON.parse(user),
            token,
            loading: false,
          });
        } catch (error) {
          // Token is invalid
          console.error("Error verifying token:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            loading: false,
          });
        }
      } else {
        setAuthState((prev) => ({ ...prev, loading: false }));
      }
    };

    loadAuthState();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post("/api/auth/login", { email, password });
      const data = response.data;

      // Save auth state
      console.log("Login response:", data);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      console.log("User data:", data.user);
      console.log("Token:", data.token);

      setAuthState({
        isAuthenticated: true,
        user: data.user,
        token: data.token,
        loading: false,
      });

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  // Register function
  const register = async (
    name: string,
    email: string,
    password: string,
    faculty?: string
  ): Promise<boolean> => {
    try {
      await api.post("/api/auth/register", { name, email, password, faculty });

      // Auto login after successful registration
      return await login(email, password);
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    console.log("Logging out...");
    // localStorage.removeItem('token');
    // localStorage.removeItem('user');

    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
    });
  };

  // Update user data
  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!authState.token) {
        return false;
      }

      const response = await api.put("/api/auth/profile", userData);
      const data = response.data;

      // Update user in state and localStorage
      const updatedUser = { ...authState.user, ...data.user } as User;
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
      }));

      return true;
    } catch (error) {
      console.error("Update user error:", error);
      return false;
    }
  };

  // Provide auth context to the component tree
  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
