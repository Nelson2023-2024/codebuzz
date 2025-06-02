// Updated useEmailLogs.js hook
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Hook for sending single email - UPDATED to use email instead of guestId
export function useSendSingleEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ email, eventId, emailType = "invitation" }) => {
      const response = await fetch(
        "http://localhost:5000/api/email/send-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, eventId, emailType }), // CHANGED: email instead of guestId
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send email");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Email sent successfully!");
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["emailStats"] });
      queryClient.invalidateQueries({ queryKey: ["allEmailLogs"] });
      queryClient.invalidateQueries({ queryKey: ["myEmailLogs"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send email");
    },
  });
}

// Other hooks remain the same...
export function useMyEmailLogs(page = 1, limit = 10, emailType, status) {
  return useQuery({
    queryKey: ["myEmailLogs", page, limit, emailType, status],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (emailType) params.append("emailType", emailType);
      if (status) params.append("status", status);
      
      const response = await fetch(
        `http://localhost:5000/api/email/logs/my-emails?${params}`,
        {
          credentials: "include",
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch email logs");
      }
      
      return response.json();
    },
  });
}

export function useAllEmailLogs(page = 1, limit = 20, emailType, status, guestId, eventId) {
  return useQuery({
    queryKey: ["allEmailLogs", page, limit, emailType, status, guestId, eventId],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (emailType) params.append("emailType", emailType);
      if (status) params.append("status", status);
      if (guestId) params.append("guestId", guestId);
      if (eventId) params.append("eventId", eventId);
      
      const response = await fetch(
        `http://localhost:5000/api/email/logs/all?${params}`,
        {
          credentials: "include",
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch all email logs");
      }
      
      return response.json();
    },
  });
}

export function useEmailStats(eventId = null) {
  return useQuery({
    queryKey: ["emailStats", eventId],
    queryFn: async () => {
      const params = eventId ? `?eventId=${eventId}` : "";
      
      const response = await fetch(
        `http://localhost:5000/api/email/logs/stats${params}`,
        {
          credentials: "include",
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch email statistics");
      }
      
      return response.json();
    },
  });
}

export function useSendBulkInvitations() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId) => {
      const response = await fetch(
        `http://localhost:5000/api/email/send-bulk-invitations/${eventId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send bulk invitations");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Bulk invitations sent successfully!");
      queryClient.invalidateQueries({ queryKey: ["emailStats"] });
      queryClient.invalidateQueries({ queryKey: ["allEmailLogs"] });
      queryClient.invalidateQueries({ queryKey: ["myEmailLogs"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send bulk invitations");
    },
  });
}

export function useSendReminderEmails() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId) => {
      const response = await fetch(
        `http://localhost:5000/api/email/send-reminders/${eventId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send reminder emails");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Reminder emails sent successfully!");
      queryClient.invalidateQueries({ queryKey: ["emailStats"] });
      queryClient.invalidateQueries({ queryKey: ["allEmailLogs"] });
      queryClient.invalidateQueries({ queryKey: ["myEmailLogs"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send reminder emails");
    },
  });
}