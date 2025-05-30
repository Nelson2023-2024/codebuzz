// hooks/useAuth.js
import { useQuery } from "@tanstack/react-query";

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
  const {
    data: authUser,
    isLoading, // This refers to the initial fetch or a fetch with no initialData
    isFetching, // This indicates if a background fetch is happening
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
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.warn("User not authenticated or forbidden. Clearing local storage.");
            localStorage.removeItem("authUser");
            return null;
          }
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch user data: ${response.status}`);
        }

        const data = await response.json();
        console.log("Auth user data fetched:", data);
        localStorage.setItem("authUser", JSON.stringify(data)); // Keep localStorage updated
        return data;
      } catch (err) {
        console.error("Error fetching auth user:", err);
        localStorage.removeItem("authUser");
        throw err;
      }
    },
    initialData: getAuthUserFromLocalStorage(), // <-- THIS IS THE KEY!
    // To make it clear in logs when initialData is used vs. actual fetch
    initialDataUpdatedAt: getAuthUserFromLocalStorage() ? Date.now() : 0, // Helps react-query manage staleness
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 1,
  });

  return { authUser, isLoading, isError, error, isFetching }; // Return isFetching too for more granular control
}