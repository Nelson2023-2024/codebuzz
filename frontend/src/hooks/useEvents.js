// hooks/useEvents.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Custom hook for fetching events
export const useGetEvents = () => {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/admin/events", {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch events");
      }

      const data = await response.json();
      return data;
    },
  });
};

// Custom hook for fetching a single event
export const useGetEvent = (eventId) => {
  return useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5000/api/admin/events/${eventId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch event");
      }

      const data = await response.json();
      return data;
    },
    enabled: !!eventId, // Only run query if eventId exists
  });
};

// Custom hook for creating a new event (admin only)
export function useCreateEvent() {
  const queryClient = useQueryClient();

  const { mutate: createEvent, isLoading } = useMutation({
    mutationFn: async (eventData) => {
      const res = await fetch("http://localhost:5000/api/admin/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
        credentials: "include",
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create event");
      }
      return data;
    },
    onSuccess: (payload) => {
      // Invalidate events to refresh the list
      queryClient.invalidateQueries(["events"]);
      
      // Show success notification
      toast.success(payload.message || "Event created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Could not create event");
    },
  });

  return { createEvent, isLoading };
}

// Custom hook for updating an event
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, eventData }) => {
      const res = await fetch(`http://localhost:5000/api/admin/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update event');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast.success('Event updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update event');
    }
  });
}

// Custom hook for deleting an event
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId) => {
      const res = await fetch(`http://localhost:5000/api/admin/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete event');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast.success('Event deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete event');
    }
  });
}

// Custom hook for toggling event active status
export function useToggleEventStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId) => {
      const res = await fetch(`http://localhost:5000/api/admin/events/${eventId}/toggle-status`, {
        method: 'PATCH',
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle event status');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast.success('Event status updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update event status');
    }
  });
}

// Custom hook for sending bulk invitations
export function useSendBulkInvitations() {
  return useMutation({
    mutationFn: async (eventId) => {
      const res = await fetch(`http://localhost:5000/api/email/send-bulk-invitations/${eventId}`, {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send bulk invitations');
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Bulk invitations sent successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send bulk invitations');
    }
  });
}

// Custom hook for RSVP submission
export function useSubmitRSVP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rsvpData) => {
      const res = await fetch('http://localhost:5000/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rsvpData),
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit RSVP');
      return data;
    },
    onSuccess: (data) => {
      // Invalidate event queries to refresh data
      queryClient.invalidateQueries(['event']);
      queryClient.invalidateQueries(['events']);
      toast.success(data.message || 'RSVP submitted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit RSVP');
    }
  });
}