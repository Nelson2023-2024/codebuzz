// hooks/useAuth.js
import { useQuery, useQueryClient } from "@tanstack/react-query";

const getAuthUserFromLocalStorage = () => {
  try {
    const user = localStorage.getItem("authUser");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error parsing authUser from localStorage:", error);
    localStorage.removeItem("authUser");
    return null;
  }
};

export function useAuth() {
  const queryClient = useQueryClient();
  
  const {
    data: authUser,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      console.log("Fetching auth user from API...");
      try {
        const response = await fetch("http://localhost:5000/api/auth/me", {
          method: "GET",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.warn("User not authenticated or forbidden. Clearing local storage.");
            localStorage.removeItem("authUser");
            // Clear the query cache as well
            queryClient.setQueryData(["authUser"], null);
            return null;
          }
          if (response.status === 404) {
            console.error("Auth endpoint not found (404). Check your backend route.");
            throw new Error("Authentication endpoint not found");
          }
          
          let errorMessage;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Auth user data fetched:", data);
        
        // Update localStorage and ensure cache consistency
        localStorage.setItem("authUser", JSON.stringify(data));
        
        // Explicitly set the query data to ensure all components get the same data
        queryClient.setQueryData(["authUser"], data);
        
        return data;
      } catch (err) {
        console.error("Error fetching auth user:", err);
        // Only clear localStorage if it's an auth error, not a network error
        if (err.message.includes("401") || err.message.includes("403") || err.message.includes("not authenticated")) {
          localStorage.removeItem("authUser");
          queryClient.setQueryData(["authUser"], null);
        }
        throw err;
      }
    },
    initialData: getAuthUserFromLocalStorage(),
    initialDataUpdatedAt: getAuthUserFromLocalStorage() ? Date.now() : 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false, // Don't refetch if we have recent data
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: (failureCount, error) => {
      // Don't retry on 404 or auth errors
      if (error.message.includes("404") || 
          error.message.includes("401") || 
          error.message.includes("403")) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Debug logging
  console.log("useAuth hook called - authUser:", authUser, "isLoading:", isLoading);

  return { authUser, isLoading, isError, error, isFetching };
}