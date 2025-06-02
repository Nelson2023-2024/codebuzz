// components/dashboard/EmailDashboard.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useEmailStats, useMyEmailLogs } from "../../hooks/useEmailLogs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  TrendingUp
} from "lucide-react";

const EmailDashboard = () => {
  const { authUser } = useAuth();
  const isAdmin = authUser?.role === "admin";
  
  // Fetch email statistics (admin only)
  const { data: statsData, isLoading: statsLoading } = useEmailStats();
  
  // Fetch recent email logs for current user
  const { data: recentEmailsData, isLoading: emailsLoading } = useMyEmailLogs(1, 5);

  // Stats cards for admin
  const AdminStatsSection = () => {
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
      pendingEmails: 0
    };

    const statCards = [
      {
        title: "Total Sent",
        value: stats.totalEmails,
        icon: Mail,
        color: "text-blue-600",
        bgColor: "bg-blue-100"
      },
      {
        title: "Successful",
        value: stats.sentEmails,
        icon: CheckCircle,
        color: "text-green-600",
        bgColor: "bg-green-100"
      },
      {
        title: "Failed",
        value: stats.failedEmails,
        icon: XCircle,
        color: "text-red-600",
        bgColor: "bg-red-100"
      },
      {
        title: "Pending",
        value: stats.pendingEmails,
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100"
      }
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Email Statistics</h3>
          <Link to="/email-management">
            <Button variant="outline" size="sm">
              Manage Emails
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
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
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Recent emails section
  const RecentEmailsSection = () => {
    if (emailsLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Recent Email Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    const recentEmails = recentEmailsData?.data || [];

    const getStatusBadge = (status) => {
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

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Email Activity</CardTitle>
              <CardDescription>
                {isAdmin ? "Latest email communications" : "Your recent emails"}
              </CardDescription>
            </div>
            <Link to="/email-logs">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentEmails.length === 0 ? (
            <div className="text-center py-6">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No recent email activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentEmails.map((email) => (
                <div key={email._id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {email.emailType}
                      </Badge>
                      {getStatusBadge(email.status)}
                    </div>
                    <p className="text-sm font-medium">
                      {email.event?.title || "Unknown Event"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(email.createdAt).toLocaleDateString()} at{" "}
                      {new Date(email.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Send className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Quick actions for admin
  const QuickActionsSection = () => {
    if (!isAdmin) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common email management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link to="/email-management">
              <Button className="w-full justify-start" variant="outline">
                <Send className="mr-2 h-4 w-4" />
                Send Bulk Invitations
              </Button>
            </Link>
            <Link to="/email-management">
              <Button className="w-full justify-start" variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Send Reminders
              </Button>
            </Link>
            <Link to="/email-logs">
              <Button className="w-full justify-start" variant="outline">
                <Mail className="mr-2 h-4 w-4" />
                View All Emails
              </Button>
            </Link>
            <Link to="/email-management">
              <Button className="w-full justify-start" variant="outline">
                <AlertCircle className="mr-2 h-4 w-4" />
                Check Failed Emails
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Admin gets full stats, users get simplified view */}
      {isAdmin && <AdminStatsSection />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentEmailsSection />
        <QuickActionsSection />
      </div>
    </div>
  );
};

export default EmailDashboard;