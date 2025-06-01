// pages/eventsPage.jsx
import React, { useState, useEffect } from "react";
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
  Loader2,
  Calendar,
  MapPin,
  Users,
  Clock,
  AlertCircle,
  Trash2,
  Edit,
  Plus,
  UserCheck,
  UserX,
  CalendarCheck
} from "lucide-react";
import {
  useGetEvents,
  useDeleteEvent,
  useToggleEventStatus,
} from "../../hooks/useEvents";
import { toast } from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import CreateEventModal from "./CreateEventModal";

const EventCard = ({ event, authUser, isAdmin }) => {
  const { mutate: deleteEvent, isLoading: isDeleting } = useDeleteEvent();
  const { mutate: toggleStatus, isLoading: isToggling } = useToggleEventStatus();

  // Format dates
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate days until event
  const getDaysUntilEvent = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    const diffTime = event - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilEvent = getDaysUntilEvent(event.eventDate);
  const isEventPast = daysUntilEvent < 0;
  const isEventToday = daysUntilEvent === 0;
  const isRegistrationOpen = event.isRegistrationOpen && !isEventPast;

  // Handle delete event
  const handleDeleteEvent = () => {
    if (window.confirm(`Are you sure you want to delete "${event.name}"?`)) {
      deleteEvent(event.id);
    }
  };

  // Handle toggle status
  const handleToggleStatus = () => {
    toggleStatus(event.id);
  };

  // Get event status color
  const getEventStatusColor = () => {
    if (isEventPast) return "destructive";
    if (isEventToday) return "default";
    if (!event.isActive) return "secondary";
    if (event.isFull) return "outline";
    return "default";
  };

  // Get event status text
  const getEventStatusText = () => {
    if (isEventPast) return "Past Event";
    if (isEventToday) return "Today";
    if (!event.isActive) return "Inactive";
    if (event.isFull) return "Full";
    if (isRegistrationOpen) return "Open";
    return "Registration Closed";
  };

  return (
    <Card className="flex flex-col justify-between overflow-hidden transition-all hover:shadow-lg border-t-4 max-w-2xl"
          style={{ borderTopColor: event.isActive ? "#22c55e" : "#64748b" }}>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-left">{event.name}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-2 text-left">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.eventDate)}</span>
            </CardDescription>
            <CardDescription className="mt-1 flex items-center gap-2 text-left">
              <MapPin className="h-4 w-4" />
              <span>{event.venue}</span>
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge variant={getEventStatusColor()} className="shrink-0">
              {getEventStatusText()}
            </Badge>
            {daysUntilEvent > 0 && (
              <Badge variant="outline" className="shrink-0">
                {daysUntilEvent} days to go
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1">
        <p className="text-sm text-muted-foreground leading-relaxed mb-3 text-left">
          {event.description}
        </p>

        {/* Event Stats */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-medium">{event.currentReservations || 0}/{event.maxCapacity}</div>
              <div className="text-muted-foreground">Registered</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-medium">{event.spotsRemaining || event.maxCapacity}</div>
              <div className="text-muted-foreground">Spots Left</div>
            </div>
          </div>
        </div>

        {/* Registration Deadline */}
        {event.registrationDeadline && (
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Registration closes: {formatDate(event.registrationDeadline)}
            </span>
          </div>
        )}

        {/* Waitlist Info */}
        {event.waitlistCount > 0 && (
          <Badge variant="outline" className="mb-2">
            {event.waitlistCount} on waitlist
          </Badge>
        )}
      </CardContent>

      <CardFooter className="bg-muted/50 pt-2 pb-2">
        <div className="w-full flex gap-2">
          {/* Toggle Status Button - Always visible for admins */}
          {isAdmin && (
            <Button
              className="flex-1 cursor-pointer"
              variant={event.isActive ? "destructive" : "default"}
              size="sm"
              onClick={handleToggleStatus}
              disabled={isToggling}
            >
              {isToggling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : event.isActive ? (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
          )}

          {/* Edit Button - only for admins */}
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.success("Edit functionality coming soon!");
                // TODO: Implement edit modal
              }}
              className="cursor-pointer flex-shrink-0"
              title="Edit event"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}

          {/* Delete Button - only for admins */}
          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteEvent}
              disabled={isDeleting}
              className="cursor-pointer flex-shrink-0"
              title="Delete event"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* For non-admin users, show registration status */}
          {!isAdmin && (
            <div className="flex-1 text-center py-2">
              <span className="text-sm text-muted-foreground">
                {isRegistrationOpen ? "Registration Open" : "Registration Closed"}
              </span>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

// Skeleton Card Component for Loading State
const SkeletonEventCard = () => {
  return (
    <Card className="overflow-hidden border-t-4 border-gray-200 animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Title skeleton */}
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            {/* Date skeleton */}
            <div className="flex items-center gap-2 mb-1">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
            {/* Venue skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          {/* Badge skeleton */}
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/50 pt-2 pb-2">
        <div className="w-full flex gap-2">
          <div className="flex-1 h-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </CardFooter>
    </Card>
  );
};

const EventsPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { authUser, isLoading: authLoading, isError: authError } = useAuth();

  // Wait for auth to load before determining admin status
  const isAdmin = authUser?.role === "admin";

  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsError,
    error,
  } = useGetEvents();

  // Debug logging with more detail
  useEffect(() => {
    console.log("EventsPage - Auth state:", {
      authUser,
      authLoading,
      authError,
      isAdmin,
      role: authUser?.role
    });
  }, [authUser, authLoading, authError, isAdmin]);

  // Show loading if either auth or events are loading
  const isLoading = authLoading || eventsLoading;

  // Loading state with skeleton cards
  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Events Management</h1>
            <p className="mt-2 flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
              <div className="h-5 bg-gray-200 rounded w-64 animate-pulse"></div>
            </p>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonEventCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (authError || eventsError) {
    return (
      <div className="container max-w-2xl py-8 mx-auto">
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <span>{error?.message || "Failed to load events"}</span>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalEvents = eventsData?.count || 0;
  const activeEvents = eventsData?.events?.filter(event => event.isActive).length || 0;
  const upcomingEvents = eventsData?.events?.filter(event => {
    const eventDate = new Date(event.eventDate);
    const today = new Date();
    return eventDate > today && event.isActive;
  }).length || 0;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Events Management</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            <span>
              {totalEvents} total events • {activeEvents} active • {upcomingEvents} upcoming
            </span>
          </p>
        </div>

        {/* Create Event Button - only for admins */}
        {isAdmin && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{totalEvents}</p>
              </div>
              <CalendarCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Events</p>
                <p className="text-2xl font-bold">{activeEvents}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                <p className="text-2xl font-bold">{upcomingEvents}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventsData?.events?.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            authUser={authUser}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {/* Empty State */}
      {eventsData?.events?.length === 0 && (
        <div className="text-center py-12">
          <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first event</p>
          {isAdmin && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};

export default EventsPage;