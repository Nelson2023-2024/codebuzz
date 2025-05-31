// src/hooks/useGuests.js

import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useGetAllGuests() {
  const {
    data: guests,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["guests"], // Unique key for this query
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:5000/api/admin-guests", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important for sending cookies/tokens
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch guests");
        }

        const data = await response.json();
        // The backend returns { guests: [...] }, so we need to access data.guests
        return data.guests;
      } catch (error) {
        console.error("Error fetching guests:", error);
        throw error;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to load guests.");
    },
  });

  return { guests, isLoading, isError, error };
}