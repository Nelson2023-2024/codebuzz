// src/pages/guests/GuestDetailPage.jsx

import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Label } from "../../components/ui/label";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Shield,
  Edit,
  Trash2,
  Send
} from "lucide-react";
import { useGetAllGuests, useDeleteGuest } from "../../hooks/useGuests";

// Loading Skeleton for Guest Detail Page
const GuestDetailSkeleton = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-10 h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
      </div>

      {/* Profile Card Skeleton */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Details Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const GuestDetailPage = () => {
  const { guestId } = useParams();
  const navigate = useNavigate();
  const { guests, isLoading, isError, error } = useGetAllGuests();
  const { deleteGuest, isDeleting } = useDeleteGuest();

  // Find the specific guest
  const guest = guests?.find(g => g._id === guestId);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBack = () => {
    navigate('/guests');
  };

  const handleEdit = () => {
    // Navigate to edit page (you can implement this later)
    console.log('Edit guest:', guest._id);
  };

  const handleDelete = () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${guest.firstName} ${guest.lastName}? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      deleteGuest(guest._id, {
        onSuccess: () => {
          navigate('/guests');
        }
      });
    }
  };

  const handleSendInvitation = () => {
    // Implement send invitation logic
    console.log('Send invitation to:', guest.email);
  };

  if (isLoading) {
    return <GuestDetailSkeleton />;
  }

  if (isError) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={handleBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Guests
          </Button>
        </div>
        <div className="text-center text-red-500">
          Error loading guest details: {error?.message}
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button onClick={handleBack} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Guests
          </Button>
        </div>
        <div className="text-center text-gray-500">
          Guest not found. The guest may have been deleted or the ID is invalid.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button onClick={handleBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Guests
        </Button>
        <h1 className="text-2xl font-bold">Guest Details</h1>
      </div>

      {/* Profile Overview Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-2xl">
                {`${guest.firstName[0]}${guest.lastName[0]}`.toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{guest.firstName} {guest.lastName}</h2>
                <p className="text-gray-600 text-lg">{guest.email}</p>
                <Badge 
                  variant={guest.isActive ? "default" : "secondary"}
                  className={guest.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                >
                  {guest.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={handleSendInvitation} variant="outline" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Invite
              </Button>
              <Button 
                onClick={handleDelete} 
                variant="destructive" 
                size="sm"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Detailed Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">First Name</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                {guest.firstName || 'N/A'}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Last Name</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                {guest.lastName || 'N/A'}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                {guest.email || 'N/A'}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                {guest.phone || 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company & Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Company & Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Company</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                {guest.company || 'N/A'}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Account Status
              </Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                <Badge 
                  variant={guest.isActive ? "default" : "secondary"}
                  className={guest.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                >
                  {guest.isActive ? 'Active Account' : 'Inactive Account'}
                </Badge>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Guest ID</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border font-mono text-sm">
                {guest._id}
              </div>
            </div>
            {/* NEW: Invitation Token */}
            {guest.invitationToken && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Invitation Token</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border font-mono text-sm">
                  {guest.invitationToken}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Account Created</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                {formatDate(guest.createdAt)}
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Last Updated</Label>
              <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                {formatDate(guest.updatedAt)}
              </div>
            </div>
            
            {guest.lastLogin && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Last Login</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                  {formatDate(guest.lastLogin)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {guest.registrationSource && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Registration Source</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                  {guest.registrationSource}
                </div>
              </div>
            )}
            
            {guest.invitedBy && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Invited By</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                  {guest.invitedBy}
                </div>
              </div>
            )}
            
            {guest.additionalInfo ? (
              <div>
                <Label className="text-sm font-medium text-gray-700">Additional Information</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md border">
                  {guest.additionalInfo}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No additional information available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuestDetailPage;