// Updated EmailManagementPage.jsx
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  useEmailStats,
  useSendBulkInvitations,
  useSendSingleEmail,
  useSendReminderEmails
} from "../../hooks/useEmailLogs";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import {
  Mail,
  Send,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BarChart3,
  Loader2
} from "lucide-react";

const EmailManagementPage = () => {
  const { authUser } = useAuth();
  const isAdmin = authUser?.role === "admin";

  // State for forms
  const [selectedEventId, setSelectedEventId] = useState("");
  const [singleEmailData, setSingleEmailData] = useState({
    email: "", // CHANGED: from guestId to email
    eventId: "",
    emailType: "invitation"
  });

  // Mutations
  const sendBulkMutation = useSendBulkInvitations();
  const sendSingleMutation = useSendSingleEmail();
  const sendReminderMutation = useSendReminderEmails();

  // Stats query
  const { data: statsData, isLoading: statsLoading } = useEmailStats(selectedEventId);

  // Handle bulk invitation sending
  const handleSendBulkInvitations = () => {
    if (!selectedEventId) {
      toast.error("Please select an event");
      return;
    }
    sendBulkMutation.mutate(selectedEventId);
  };

  // Handle single email sending
  const handleSendSingleEmail = () => {
    if (!singleEmailData.email || !singleEmailData.eventId) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(singleEmailData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    sendSingleMutation.mutate(singleEmailData);
  };

  // Handle reminder emails
  const handleSendReminders = () => {
    if (!selectedEventId) {
      toast.error("Please select an event");
      return;
    }
    sendReminderMutation.mutate(selectedEventId);
  };

  // Statistics cards component
  const StatsCards = () => {
    if (statsLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    const stats = statsData?.data?.overall || {
      totalEmails: 0,
      sentEmails: 0,
      failedEmails: 0,
      pendingEmails: 0,
      bouncedEmails: 0
    };

    const statCards = [
      {
        title: "Total Emails",
        value: stats.totalEmails,
        icon: Mail,
        color: "text-blue-600"
      },
      {
        title: "Sent Successfully",
        value: stats.sentEmails,
        icon: CheckCircle,
        color: "text-green-600"
      },
      {
        title: "Failed",
        value: stats.failedEmails,
        icon: XCircle,
        color: "text-red-600"
      },
      {
        title: "Pending",
        value: stats.pendingEmails,
        icon: Clock,
        color: "text-yellow-600"
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Email type breakdown
  const EmailTypeBreakdown = () => {
    const emailTypes = statsData?.data?.byEmailType || [];

    if (emailTypes.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Email Types Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-4">
              No email data available
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Email Types Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {emailTypes.map((type, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="capitalize font-medium">{type._id}</span>
                <span className="text-muted-foreground">{type.count} emails</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="border-yellow-200">
          <CardContent className="pt-6">
            <div className="text-center text-yellow-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Access denied. Admin privileges required.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Email Management</h1>
        <p className="text-muted-foreground">
          Send and manage email communications for events
        </p>
      </div>

      {/* Email Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Email Statistics</h2>
          {/* Event filter for stats */}
          <div className="flex items-center gap-2">
            <Label htmlFor="statsEventFilter">Filter by Event:</Label>
            <select
              id="statsEventFilter"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-[200px] p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Events</option>
              {/* You would populate this with actual events */}
              <option value="event1">Sample Event 1</option>
              <option value="event2">Sample Event 2</option>
            </select>
          </div>
        </div>

        <StatsCards />
        <EmailTypeBreakdown />
      </div>

      <Separator />

      {/* Email Actions */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Email Actions</h2>

        {/* Single Email */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Individual Email
            </CardTitle>
            <CardDescription>
              Send a specific email to an individual guest by email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="singleGuestEmail">Guest Email</Label>
                <Input
                  id="singleGuestEmail"
                  type="email"
                  placeholder="Enter guest email address"
                  value={singleEmailData.email}
                  onChange={(e) => setSingleEmailData(prev => ({
                    ...prev,
                    email: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="singleEventId">Event ID</Label>
                <Input
                  id="singleEventId"
                  placeholder="Enter event ID"
                  value={singleEmailData.eventId}
                  onChange={(e) => setSingleEmailData(prev => ({
                    ...prev,
                    eventId: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="singleEmailType">Email Type</Label>
                <select
                  id="singleEmailType"
                  value={singleEmailData.emailType}
                  onChange={(e) => setSingleEmailData(prev => ({
                    ...prev,
                    emailType: e.target.value
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="invitation">Invitation</option>
                  <option value="reminder">Reminder</option>
                  <option value="confirmation">Confirmation</option>
                  <option value="cancellation">Cancellation</option>
                </select>
              </div>
            </div>
            <Button
              onClick={handleSendSingleEmail}
              disabled={sendSingleMutation.isPending}
              className="mt-4"
            >
              {sendSingleMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Email
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailManagementPage;