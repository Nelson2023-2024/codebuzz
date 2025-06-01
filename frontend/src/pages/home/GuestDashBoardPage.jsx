import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  CheckCircle, 
  Mail, 
  Clock,
  MapPin,
  AlertCircle,
  Activity,
  User,
  CalendarCheck,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";

// Custom hook for guest dashboard metrics
function useGuestDashboardMetrics() {
  const {
    data: metrics,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["guest-dashboard-metrics"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:5000/api/admin-dashboard/guest-metrics", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch guest dashboard metrics");
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching guest dashboard metrics:", error);
        throw error;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to load dashboard metrics.");
    },
    refetchInterval: 60000, // Refetch every minute
  });

  return { metrics, isLoading, isError, error };
}

// Metric Card Component
const MetricCard = ({ title, value, icon: Icon, color = "blue", subtext }) => {
  const colorClasses = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    red: "text-red-600",
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-bold">{value}</p>
            </div>
            {subtext && <p className="text-sm text-muted-foreground">{subtext}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-muted ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Status Badge Component
const StatusBadge = ({ status, variant = "secondary" }) => {
  const getStatusVariant = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'checked_in':
        return 'default';
      case 'not_arrived':
        return 'outline';
      case 'sent':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Badge variant={getStatusVariant(status)}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
};

// Recent RSVPs Component
const RecentRSVPs = ({ rsvps }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent RSVPs
        </CardTitle>
        <CardDescription>Your latest event registrations</CardDescription>
      </CardHeader>
      <CardContent>
        {rsvps?.length === 0 ? (
          <div className="text-center py-8">
            <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recent RSVPs</p>
          </div>
        ) : (
          <div className="space-y-4">
            {rsvps?.map((rsvp, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{rsvp.eventName}</h4>
                      <div className="flex items-center mt-2 space-x-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(rsvp.eventDate)}
                        </div>
                      </div>
                      <div className="flex items-center mt-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-1" />
                        RSVP'd on {formatDate(rsvp.rsvpDate)}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <StatusBadge status={rsvp.status} />
                      <div className="text-sm">
                        <StatusBadge status={rsvp.checkInStatus} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Upcoming Events Component
const UpcomingEvents = ({ events }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
        <CardDescription>Events you're registered for</CardDescription>
      </CardHeader>
      <CardContent>
        {events?.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events?.map((event, index) => (
              <Card key={index} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{event.eventName}</h4>
                      <div className="flex items-center mt-3 space-x-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(event.eventDate)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={event.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Status Breakdown Component
const StatusBreakdown = ({ title, data, icon: Icon }) => {
  const total = Object.values(data || {}).reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-muted-foreground text-center py-4">No data available</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(data || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge status={status} />
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main Guest Dashboard Component
const GuestDashBoardPage = () => {
  const { metrics, isLoading, isError, error } = useGuestDashboardMetrics();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
            <p className="text-muted-foreground mb-4">{error?.message || "Something went wrong"}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Your event activity and upcoming events</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Total Invitations"
            value={metrics?.totalInvitedEvents || 0}
            icon={Mail}
            color="blue"
            subtext="Events you're invited to"
          />
          <MetricCard
            title="Confirmed RSVPs"
            value={metrics?.rsvpStatusCounts?.confirmed || 0}
            icon={CheckCircle}
            color="green"
            subtext="Events you'll attend"
          />
          <MetricCard
            title="Pending RSVPs"
            value={metrics?.rsvpStatusCounts?.pending || 0}
            icon={Clock}
            color="orange"
            subtext="Awaiting your response"
          />
        </div>

        {/* Status Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatusBreakdown 
            title="RSVP Status"
            data={metrics?.rsvpStatusCounts}
            icon={CalendarCheck}
          />
          <StatusBreakdown 
            title="Check-in Status"
            data={metrics?.checkInStatusCounts}
            icon={CheckCircle}
          />
          <StatusBreakdown 
            title="Email Status"
            data={metrics?.emailStatusCounts}
            icon={MessageSquare}
          />
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentRSVPs rsvps={metrics?.recentRSVPs} />
          <UpcomingEvents events={metrics?.upcomingEvents} />
        </div>
      </div>
    </div>
  );
};

export default GuestDashBoardPage;