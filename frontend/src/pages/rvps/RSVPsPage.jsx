import React, { useState } from 'react';
import { useGetAllRSVPs } from '../../hooks/useRSVPS';
import { Calendar, Users, MapPin, Clock, Search, Filter, Download, User, Mail, Phone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'confirmed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'declined':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'waitlisted':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading RSVPs</h2>
            <p className="text-red-600 mb-4">{error.message}</p>
            <button 
              onClick={() => refetch()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RSVP Management</h1>
          <p className="text-gray-600">Manage and view all event RSVPs</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total RSVPs</p>
                <p className="text-2xl font-bold text-gray-900">{data?.count || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredRSVPs.filter(rsvp => rsvp.status === 'confirmed').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <XCircle className="w-8 h-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Declined</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredRSVPs.filter(rsvp => rsvp.status === 'declined').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Waitlisted</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredRSVPs.filter(rsvp => rsvp.status === 'waitlisted').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 md:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search guests or events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Events</option>
                {uniqueEvents.map(event => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* RSVPs Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredRSVPs.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No RSVPs Found</h3>
              <p className="text-gray-500">No RSVPs match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RSVP Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRSVPs.map((rsvp) => (
                    <tr key={rsvp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {rsvp.guest.firstName} {rsvp.guest.lastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {rsvp.guest.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{rsvp.event.name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {rsvp.event.venue}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(rsvp.event.eventDate)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(rsvp.status)}
                          <span className={`ml-2 ${getStatusBadge(rsvp.status)}`}>
                            {rsvp.status.charAt(0).toUpperCase() + rsvp.status.slice(1)}
                          </span>
                        </div>
                        {rsvp.seatNumber && (
                          <div className="text-xs text-gray-500 mt-1">
                            Seat #{rsvp.seatNumber}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(rsvp.rsvpDate)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {rsvp.specialRequests && (
                            <div className="mb-1">
                              <span className="font-medium">Special Requests:</span> {rsvp.specialRequests}
                            </div>
                          )}
                          {rsvp.dietaryRestrictions && (
                            <div>
                              <span className="font-medium">Dietary:</span> {rsvp.dietaryRestrictions}
                            </div>
                          )}
                          {!rsvp.specialRequests && !rsvp.dietaryRestrictions && (
                            <span className="text-gray-400">No special requirements</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {filteredRSVPs.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {filteredRSVPs.length} of {data?.count || 0} RSVPs
          </div>
        )}
      </div>
    </div>
  );
};

export default RSVPsPage;