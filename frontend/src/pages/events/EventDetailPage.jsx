import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group"; // Imported RadioGroup

import {
  Loader2,
  Calendar,
  MapPin,
  Users,
  Clock,
  AlertCircle,
  ArrowLeft,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Timer,
  Info,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { useGetEvent, useSubmitRSVP } from "../../hooks/useEvents";

// RSVP Modal Component
const RSVPModal = ({ isOpen, onClose, event, onRsvpSuccess }) => {
  const [formData, setFormData] = useState({
    token: '',
    status: 'confirmed', // Default to confirmed
    specialRequests: '',
    dietaryRestrictions: ''
  });

  const { mutate: submitRSVP, isLoading: isSubmitting } = useSubmitRSVP();

  // Handles changes for all form inputs
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handles the submission of the RSVP form
  const handleSubmitRSVP = async (e) => {
    e.preventDefault();

    // Basic validation for invitation token
    if (!formData.token.trim()) {
      toast.error('Invitation token is required');
      return;
    }

    // Prepare data for submission to the backend
    const rsvpData = {
      ...formData,
      eventId: event._id
    };

    // Call the submitRSVP mutation
    submitRSVP(rsvpData, {
      onSuccess: (result) => {
        // Call the success callback if provided
        if (onRsvpSuccess) {
          onRsvpSuccess(result);
        }
        // Close the modal on successful submission
        onClose();
      },
      onError: (error) => {
        // Display error message from the backend
        toast.error(error.message || 'Failed to submit RSVP');
      }
    });
  };

  // Effect to reset form data when the modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        token: '',
        status: 'confirmed', // Reset to default status
        specialRequests: '',
        dietaryRestrictions: ''
      });
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            RSVP for {event?.name}
          </DialogTitle>
          <DialogDescription>
            Please fill in your details to confirm your attendance for this event.
            <br />
            <span className="text-sm text-muted-foreground mt-2 block">
              Event ID: <code className="bg-muted px-1 py-0.5 rounded text-xs">{event?._id}</code>
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitRSVP} className="space-y-4">
          {/* Invitation Token Input */}
          <div className="space-y-2">
            <Label htmlFor="token">Invitation Token *</Label>
            <Input
              id="token"
              type="text"
              placeholder="Enter your invitation token"
              value={formData.token}
              onChange={(e) => handleInputChange('token', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              This token was provided to you in your invitation email
            </p>
          </div>

          {/* RSVP Status Radio Group */}
          <div className="space-y-2">
            <Label htmlFor="status">Response *</Label>
            <RadioGroup
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2 p-2 border rounded-md">
                <RadioGroupItem value="confirmed" id="r1" />
                <Label htmlFor="r1" className="flex items-center gap-2 cursor-pointer">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  I will attend
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-2 border rounded-md">
                <RadioGroupItem value="declined" id="r2" />
                <Label htmlFor="r2" className="flex items-center gap-2 cursor-pointer">
                  <XCircle className="h-4 w-4 text-red-600" />
                  I cannot attend
                </Label>
              </div>
              {event?.waitlistEnabled && ( // Conditionally show waitlist option
                <div className="flex items-center space-x-2 p-2 border rounded-md">
                  <RadioGroupItem value="waitlisted" id="r3" />
                  <Label htmlFor="r3" className="flex items-center gap-2 cursor-pointer">
                    <Timer className="h-4 w-4 text-orange-600" />
                    Add me to waitlist
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Special Requests Textarea */}
          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              placeholder="Any special accommodations or requests..."
              value={formData.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              rows={3}
            />
          </div>

          {/* Dietary Restrictions Input */}
          <div className="space-y-2">
            <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
            <Input
              id="dietaryRestrictions"
              type="text"
              placeholder="e.g., Vegetarian, Gluten-free, Allergies..."
              value={formData.dietaryRestrictions}
              onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Submit RSVP
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Main EventDetailPage Component
const EventDetailPage = () => {
  const { eventId } = useParams(); // Get eventId from URL parameters
  const navigate = useNavigate(); // Hook for navigation
  const { authUser } = useAuth(); // Get authenticated user (though not directly used for guest RSVP)

  const [showRSVPModal, setShowRSVPModal] = useState(false); // State to control RSVP modal visibility
  const [copied, setCopied] = useState(false); // State for copy button feedback

  // Fetch event data using a custom hook
  const { data: event, isLoading, error } = useGetEvent(eventId);

  // Helper function to format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A"; // Handle cases where dateString might be null or undefined
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to calculate days until the event
  const getDaysUntilEvent = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    // Set both dates to start of day to ensure accurate day difference
    today.setHours(0, 0, 0, 0);
    event.setHours(0, 0, 0, 0);
    const diffTime = event.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Handle copy to clipboard functionality for Event ID
  const handleCopyEventId = async () => {
    if (event?._id) {
      try {
        await navigator.clipboard.writeText(event._id);
        setCopied(true);
        toast.success("Event ID copied to clipboard!");
        setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
      } catch (err) {
        console.error("Failed to copy event ID: ", err);
        toast.error("Failed to copy Event ID.");
      }
    }
  };

  // Callback for when RSVP is successfully submitted
  const handleRSVPSuccess = (result) => {
    toast.success("RSVP submitted successfully!");
    console.log('RSVP Success:', result);
    // Optionally, you might want to refetch the event data to update stats immediately
    // queryClient.invalidateQueries(['event', eventId]);
  };

  // Show loading state while fetching event data
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  // Show error state if event data fetching fails or event is not found
  if (error || !event) {
    return (
      <div className="container max-w-2xl py-8 mx-auto">
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <span>{error?.message || "Event not found"}</span> {/* Use error.message if available */}
        </div>
        <Button
          onClick={() => navigate('/events')}
          className="mt-4"
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>
      </div>
    );
  }

  // Calculate derived states for event display and RSVP logic
  const daysUntilEvent = getDaysUntilEvent(event.eventDate);
  const isEventPast = daysUntilEvent < 0;
  const isEventToday = daysUntilEvent === 0;
  // Determine if registration is open based on event status, capacity, and deadline
  const isRegistrationOpen = event.isActive && !isEventPast && (!event.registrationDeadline || new Date() < new Date(event.registrationDeadline));
  const spotsRemaining = event.maxCapacity - (event.currentReservations || 0);

  return (
    <div className="container max-w-4xl py-8 mx-auto px-4">
      {/* Back Button to navigate to the events list */}
      <Button
        onClick={() => navigate('/events')}
        className="mb-6"
        variant="outline"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>

      {/* Event Header Card displaying basic event info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold mb-2">
                {event.name}
              </CardTitle>
              <div className="flex flex-col gap-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span className="text-lg">{formatDate(event.eventDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  <span className="text-lg">{event.venue}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              {/* Badge indicating event status (Past, Today, Active, Inactive) */}
              <Badge
                variant={isEventPast ? "destructive" : event.isActive ? "default" : "secondary"}
                className="text-sm px-3 py-1"
              >
                {isEventPast ? "Past Event" : isEventToday ? "Today" : event.isActive ? "Active" : "Inactive"}
              </Badge>
              {/* Badge showing days remaining if it's an upcoming event */}
              {daysUntilEvent > 0 && (
                <Badge variant="outline" className="text-sm">
                  {daysUntilEvent} days to go
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Event Details Grid - Main content and sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Description Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Event Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {event.description || "No description provided for this event."}
              </p>
            </CardContent>
          </Card>

          {/* Event Information Card (ID and Registration Deadline) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium">Event ID:</span>
                  <code className="bg-background px-2 py-1 rounded text-sm font-mono flex-grow">
                    {event._id}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyEventId}
                    aria-label="Copy event ID"
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {event.registrationDeadline && (
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="font-medium">Registration Deadline:</span>
                    <span className="text-sm">
                      {formatDate(event.registrationDeadline)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          {/* Event Statistics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Event Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Capacity:</span>
                <span className="font-semibold">{event.maxCapacity}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Registered:</span>
                <span className="font-semibold">{event.currentReservations || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Spots Remaining:</span>
                <span className={`font-semibold ${spotsRemaining <= 5 && spotsRemaining > 0 ? 'text-orange-600' : spotsRemaining <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {spotsRemaining}
                </span>
              </div>
              {event.waitlistCount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Waitlist:</span>
                  <span className="font-semibold">{event.waitlistCount}</span>
                </div>
              )}

              {/* Progress Bar for capacity */}
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(((event.currentReservations || 0) / event.maxCapacity) * 100, 100)}%`
                  }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {Math.round(((event.currentReservations || 0) / event.maxCapacity) * 100)}% full
              </p>
            </CardContent>
          </Card>

          {/* RSVP Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                RSVP
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEventPast ? (
                <div className="text-center p-4">
                  <XCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">This event has already ended</p>
                </div>
              ) : !isRegistrationOpen ? (
                <div className="text-center p-4">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Registration is currently closed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Click below to confirm your attendance
                  </p>
                  <Button
                    onClick={() => setShowRSVPModal(true)}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <UserCheck className="mr-2 h-5 w-5" />
                    Confirm RSVP
                  </Button>
                  {spotsRemaining <= 5 && spotsRemaining > 0 && (
                    <p className="text-xs text-orange-600 text-center">
                      Only {spotsRemaining} spots remaining!
                    </p>
                  )}
                  {spotsRemaining === 0 && (
                    <p className="text-xs text-red-600 text-center">
                      Event is full - You'll be added to the waitlist
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* RSVP Modal Component */}
      <RSVPModal
        isOpen={showRSVPModal}
        onClose={() => setShowRSVPModal(false)}
        event={event}
        onRsvpSuccess={handleRSVPSuccess}
      />
    </div>
  );
};

export default EventDetailPage;