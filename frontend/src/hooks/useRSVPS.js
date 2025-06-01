
// hooks/useEvents.js
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