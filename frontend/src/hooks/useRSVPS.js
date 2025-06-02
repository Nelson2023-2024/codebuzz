// hooks/useRSVPS.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Custom hook to fetch all RSVPs (admin only)
export function useGetAllRSVPs() {
  return useQuery({
    queryKey: ['rsvps', 'all'],
    queryFn: async () => {
      const res = await fetch('http://localhost:5000/api/rsvp/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch RSVPs');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Custom hook to fetch user's own RSVP data
export function useGetUserRSVP() {
  return useQuery({
    queryKey: ['rsvp', 'user'],
    queryFn: async () => {
      const res = await fetch('http://localhost:5000/api/rsvp/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch RSVP data');
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Custom hook to create/update RSVP
export function useCreateRSVP() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rsvpData) => {
      const res = await fetch('http://localhost:5000/api/rsvp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(rsvpData),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit RSVP');
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'RSVP submitted successfully!');
      // Invalidate and refetch user RSVP data
      queryClient.invalidateQueries({ queryKey: ['rsvp', 'user'] });
      // Also invalidate admin RSVP data if it exists
      queryClient.invalidateQueries({ queryKey: ['rsvps', 'all'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit RSVP');
    },
  });
}