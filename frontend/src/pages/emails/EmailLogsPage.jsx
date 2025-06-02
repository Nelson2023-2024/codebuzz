// pages/emails/EmailLogsPage.jsx
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useMyEmailLogs, useAllEmailLogs } from "../../hooks/useEmailLogs";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
// Removed: import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { ChevronLeft, ChevronRight, Mail, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const EmailLogsPage = () => {
  const { authUser } = useAuth();
  const isAdmin = authUser?.role === "admin";

  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [emailType, setEmailType] = useState("");
  const [status, setStatus] = useState("");
  const [guestId, setGuestId] = useState("");
  const [eventId, setEventId] = useState("");

  const limit = isAdmin ? 20 : 10;

  // Use appropriate hook based on user role
  const { data, isLoading, error } = isAdmin
    ? useAllEmailLogs(page, limit, emailType, status, guestId, eventId)
    : useMyEmailLogs(page, limit, emailType, status);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      sent: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      bounced: { color: "bg-orange-100 text-orange-800", icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  // Email type badge
  const EmailTypeBadge = ({ type }) => {
    const typeColors = {
      invitation: "bg-blue-100 text-blue-800",
      reminder: "bg-purple-100 text-purple-800",
      confirmation: "bg-green-100 text-green-800",
      cancellation: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={typeColors[type] || "bg-gray-100 text-gray-800"}>
        {type}
      </Badge>
    );
  };

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setPage(1); // Reset to first page when filters change

    switch (filterName) {
      case "emailType":
        setEmailType(value === "all" ? "" : value);
        break;
      case "status":
        setStatus(value === "all" ? "" : value);
        break;
      case "guestId":
        setGuestId(value);
        break;
      case "eventId":
        setEventId(value);
        break;
      default:
        break;
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setEmailType("");
    setStatus("");
    setGuestId("");
    setEventId("");
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Mail className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading email logs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <XCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Error loading email logs: {error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const emailLogs = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {isAdmin ? "All Email Logs" : "My Email History"}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "View and manage all email communications across the platform"
            : "View your email history and delivery status"
          }
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Email Type Filter */}
            <div>
              <Label htmlFor="emailType">Email Type</Label>
              <select
                id="emailType"
                value={emailType || "all"}
                onChange={(e) => handleFilterChange("emailType", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" // Basic styling
              >
                <option value="all">All Types</option>
                <option value="invitation">Invitation</option>
                <option value="reminder">Reminder</option>
                <option value="confirmation">Confirmation</option>
                <option value="cancellation">Cancellation</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status || "all"}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" // Basic styling
              >
                <option value="all">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="bounced">Bounced</option>
              </select>
            </div>

            {/* Admin-only filters */}
            {isAdmin && (
              <>
                <div>
                  <Label htmlFor="guestId">Guest ID</Label>
                  <Input
                    id="guestId"
                    placeholder="Enter guest ID"
                    value={guestId}
                    onChange={(e) => handleFilterChange("guestId", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="eventId">Event ID</Label>
                  <Input
                    id="eventId"
                    placeholder="Enter event ID"
                    value={eventId}
                    onChange={(e) => handleFilterChange("eventId", e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Email Logs</CardTitle>
          <CardDescription>
            Showing {emailLogs.length} of {pagination.totalCount || 0} emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailLogs.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No email logs found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Guest</TableHead>}
                    <TableHead>Event</TableHead>
                    {isAdmin && <TableHead>Email ID</TableHead>} {/* Changed 'Email' to 'Email ID' for clarity */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleDateString()}
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <EmailTypeBadge type={log.emailType} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={log.status} />
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {log.guest ? (
                            <div>
                              <div className="font-medium">
                                {log.guest.firstName} {log.guest.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {log.guest.email}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        {log.event ? (
                          <div>
                            <div className="font-medium">{log.event.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.event.eventDate).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            ID: {log._id.slice(-6)}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailLogsPage;