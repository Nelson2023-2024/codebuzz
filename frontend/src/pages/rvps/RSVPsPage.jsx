import React, { useState } from 'react';
import { useGetAllRSVPs } from '../../hooks/useRSVPS';
import { Calendar, Users, MapPin, Clock, Search, Filter, Download, User, Mail, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
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
import { Input } from "../../components/ui/input";

const RSVPsPage = () => {
  const { data, isLoading, error, refetch } = useGetAllRSVPs();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventFilter, setEventFilter] = useState('all');

  // Get unique events for filtering
  const uniqueEvents = data?.rsvps ? 
    [...new Map(data.rsvps.map(rsvp => [rsvp.event.id, rsvp.event])).values()] : [];

  // Filter RSVPs based on search and filters
  const filteredRSVPs = data?.rsvps?.filter(rsvp => {
    const matchesSearch = 
      rsvp.guest.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rsvp.guest.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rsvp.guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rsvp.event.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || rsvp.status === statusFilter;
    const matchesEvent = eventFilter === 'all' || rsvp.event.id === eventFilter;
    
    return matchesSearch && matchesStatus && matchesEvent;
  }) || [];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'waitlisted':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'declined':
        return 'destructive';
      case 'waitlisted':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    if (!filteredRSVPs.length) return;
    
    const headers = ['Guest Name', 'Email', 'Event', 'Status', 'RSVP Date', 'Seat Number', 'Special Requests', 'Dietary Restrictions'];
    const csvData = filteredRSVPs.map(rsvp => [
      `${rsvp.guest.firstName} ${rsvp.guest.lastName}`,
      rsvp.guest.email,
      rsvp.event.name,
      rsvp.status,
      formatDate(rsvp.rsvpDate),
      rsvp.seatNumber || 'N/A',
      rsvp.specialRequests || 'None',
      rsvp.dietaryRestrictions || 'None'
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rsvps-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-7xl">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-16 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-7xl">
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center">
              <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error Loading RSVPs</h2>
              <p className="text-muted-foreground mb-4">{error.message}</p>
              <Button onClick={() => refetch()} variant="destructive">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">RSVP Management</h1>
          <p className="text-muted-foreground">Manage and view all event RSVPs</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total RSVPs</p>
                  <p className="text-2xl font-bold">{data?.count || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold">
                    {filteredRSVPs.filter(rsvp => rsvp.status === 'confirmed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Declined</p>
                  <p className="text-2xl font-bold">
                    {filteredRSVPs.filter(rsvp => rsvp.status === 'declined').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Waitlisted</p>
                  <p className="text-2xl font-bold">
                    {filteredRSVPs.filter(rsvp => rsvp.status === 'waitlisted').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
                {/* Search */}
                <div className="relative flex-1 md:max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search guests or events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                  <option value="waitlisted">Waitlisted</option>
                </select>

                {/* Event Filter */}
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                >
                  <option value="all">All Events</option>
                  {uniqueEvents.map(event => (
                    <option key={event.id} value={event.id}>{event.name}</option>
                  ))}
                </select>
              </div>

              {/* Export Button */}
              <Button onClick={exportToCSV} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RSVPs Table */}
        <Card>
          {filteredRSVPs.length === 0 ? (
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No RSVPs Found</h3>
              <p className="text-muted-foreground">No RSVPs match your current filters.</p>
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Guest</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">RSVP Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRSVPs.map((rsvp) => (
                      <tr key={rsvp.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium">
                                {rsvp.guest.firstName} {rsvp.guest.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center">
                                <Mail className="w-3 h-3 mr-1" />
                                {rsvp.guest.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{rsvp.event.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {rsvp.event.venue}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(rsvp.event.eventDate)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(rsvp.status)}
                            <Badge variant={getStatusVariant(rsvp.status)}>
                              {rsvp.status.charAt(0).toUpperCase() + rsvp.status.slice(1)}
                            </Badge>
                          </div>
                          {rsvp.seatNumber && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              Seat #{rsvp.seatNumber}
                            </Badge>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(rsvp.rsvpDate)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {rsvp.specialRequests && (
                              <div className="mb-1">
                                <span className="font-medium">Special Requests:</span>
                                <span className="text-muted-foreground ml-1">{rsvp.specialRequests}</span>
                              </div>
                            )}
                            {rsvp.dietaryRestrictions && (
                              <div>
                                <span className="font-medium">Dietary:</span>
                                <span className="text-muted-foreground ml-1">{rsvp.dietaryRestrictions}</span>
                              </div>
                            )}
                            {!rsvp.specialRequests && !rsvp.dietaryRestrictions && (
                              <span className="text-muted-foreground">No special requirements</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Results Summary */}
        {filteredRSVPs.length > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            Showing {filteredRSVPs.length} of {data?.count || 0} RSVPs
          </div>
        )}
      </div>
    </div>
  );
};

export default RSVPsPage;