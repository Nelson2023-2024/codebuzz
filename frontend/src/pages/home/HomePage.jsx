import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  UserPlus, 
  Mail, 
  TrendingUp,
  Clock,
  MapPin,
  AlertCircle,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
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

// Custom hook for dashboard metrics
function useDashboardMetrics() {
  const {
    data: metrics,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:5000/api/admin-dashboard/metrics", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch dashboard metrics");
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching dashboard metrics:", error);
        throw error;
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to load dashboard metrics.");
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return { metrics, isLoading, isError, error };
}

// Metric Card Component using shadcn Card
const MetricCard = ({ title, value, icon: Icon, color = "blue", subtext, trend }) => {
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
              {trend && (
                <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trend > 0 ? '+' : ''}{trend}%
                </span>
              )}
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

// Status Badge Component using shadcn Badge
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

// Recent RSVPs Table Component
const RecentRSVPsTable = ({ rsvps }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
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
        <CardDescription>Latest guest registrations and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Guest</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Event</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Seat</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">RSVP Date</th>
              </tr>
            </thead>
            <tbody>
              {rsvps?.map((rsvp) => (
                <tr key={rsvp._id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium">
                        {rsvp.guest?.firstName} {rsvp.guest?.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">{rsvp.guest?.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium">{rsvp.event?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(rsvp.event?.eventDate)}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={rsvp.status} />
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="outline">#{rsvp.seatNumber}</Badge>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {formatDate(rsvp.rsvpDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <CardDescription>Events scheduled for the near future</CardDescription>
      </CardHeader>
      <CardContent>
        {events?.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events?.map((event) => (
              <Card key={event._id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{event.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      <div className="flex items-center mt-3 space-x-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(event.eventDate)}
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-1" />
                          {event.venue}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <div className="text-sm font-medium">
                        {event.currentReservations}/{event.maxCapacity}
                      </div>
                      <Badge variant="secondary">
                        {Math.round((event.currentReservations / event.maxCapacity) * 100)}% Full
                      </Badge>
                      {event.waitlistCount > 0 && (
                        <Badge variant="outline">
                          {event.waitlistCount} Waitlisted
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((event.currentReservations / event.maxCapacity) * 100, 100)}%` 
                        }}
                      ></div>
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

// Breakdown Stats Component
const BreakdownStats = ({ title, data, icon: Icon }) => {
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

// Main Dashboard Component
const HomePage = () => {
  const { metrics, isLoading, isError, error } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
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
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your event management system</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Guests"
            value={metrics?.totalGuests || 0}
            icon={Users}
            color="blue"
            subtext="Registered users"
          />
          <MetricCard
            title="Total Events"
            value={metrics?.totalEvents || 0}
            icon={Calendar}
            color="green"
            subtext={`${metrics?.activeEvents || 0} active`}
          />
          <MetricCard
            title="Total RSVPs"
            value={metrics?.totalRSVPs || 0}
            icon={CheckCircle}
            color="purple"
            subtext="All time"
          />
          <MetricCard
            title="Active Events"
            value={metrics?.activeEvents || 0}
            icon={Activity}
            color="orange"
            subtext="Currently running"
          />
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BreakdownStats 
            title="RSVP Status"
            data={metrics?.rsvpBreakdown}
            icon={UserPlus}
          />
          <BreakdownStats 
            title="Check-in Status"
            data={metrics?.checkInStatusBreakdown}
            icon={CheckCircle}
          />
          <BreakdownStats 
            title="Email Status"
            data={metrics?.emailStats}
            icon={Mail}
          />
        </div>

        {/* Data Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentRSVPsTable rsvps={metrics?.recentRSVPs} />
          <UpcomingEvents events={metrics?.upcomingEvents} />
        </div>
      </div>
    </div>
  );
};

export default HomePage;