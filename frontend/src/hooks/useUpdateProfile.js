import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  const {
    mutate: updateProfile,
    isLoading,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ firstName, lastName, phone, company }) => {
      console.log("Attempting to update profile with:", { firstName, lastName, phone, company });
      
      try {
        const response = await fetch("http://localhost:5000/api/auth/update-profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Important for sending cookies/auth
          body: JSON.stringify({ firstName, lastName, phone, company }),
        });
        
        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Response data:", data);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(data.message || "User not found");
          } else if (response.status === 401) {
            throw new Error("Unauthorized. Please login again.");
          } else {
            throw new Error(data.message || `Update failed (${response.status})`);
          }
        }
        
        // Update localStorage with new user data
        const currentUser = JSON.parse(localStorage.getItem("authUser") || "{}");
        const updatedUser = { ...currentUser, ...data.user };
        localStorage.setItem("authUser", JSON.stringify(updatedUser));
        
        return data;
      } catch (error) {
        console.error("Update profile error:", error);
        throw error;
      }
    },
    
    onSuccess: (data) => {
      console.log("Profile update successful:", data);
      // Invalidate and refetch auth user data
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Profile updated successfully!");
    },
    
    onError: (error) => {
      toast.error(error.message || "Failed to update profile. Please try again.");
    },
  });
  
  return { updateProfile, isLoading, isError, error };
}