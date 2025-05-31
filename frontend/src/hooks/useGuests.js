// src/hooks/useGuests.js

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export function useDeleteGuest() {
  const queryClient = useQueryClient();

  const {
    mutate: deleteGuest,
    isPending: isDeleting,
    isError,
    error,
  } = useMutation({
    mutationFn: async (guestId) => {
      try {
        const response = await fetch(`http://localhost:5000/api/admin-guests/${guestId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important for sending cookies/tokens
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete guest");
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error deleting guest:", error);
        throw error;
      }
    },
    onSuccess: (data, guestId) => {
      // Invalidate and refetch the guests query to update the UI
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      toast.success("Guest deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete guest");
    },
  });

  return { deleteGuest, isDeleting, isError, error };
}

export function useCreateGuest() {
  const queryClient = useQueryClient();

  const {
    mutate: createGuest,
    isPending: isCreating,
    isError,
    error,
  } = useMutation({
    mutationFn: async (guestData) => {
      try {
        const response = await fetch("http://localhost:5000/api/admin-guests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(guestData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create guest");
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error creating guest:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate and refetch the guests query to update the UI
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      toast.success("Guest created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create guest");
    },
  });

  return { createGuest, isCreating, isError, error };
}