import React, { useState } from 'react';
import { Calendar, Users, MapPin, Clock, CheckCircle, XCircle, AlertCircle, User, Mail, Filter, Search } from 'lucide-react';
import { useGetUserRSVP } from '../../hooks/useRSVPS';

const UserRSVPPage = () => {
  const { data, isLoading, error } = useGetUserRSVP();
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'declined':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'waitlisted':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'waitlisted':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCheckInStatus = (status) => {
    switch (status) {
      case 'checked_in':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'not_arrived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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

  const filteredRSVPs = data?.rsvps?.filter(rsvp => {
    const matchesStatus = statusFilter === 'all' || rsvp.status === statusFilter;
    const matchesSearch = 
      rsvp.event?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rsvp.event?.venue?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  const statusCounts = data?.rsvps?.reduce((acc, rsvp) => {
    acc[rsvp.status] = (acc[rsvp.status] || 0) + 1;
    return acc;
  }, {}) || {};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Your RSVPs</h2>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
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
      <div className="container mx-auto max-w-6xl p-6 space-y-8">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My RSVPs</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {data?.guest?.firstName} {data?.guest?.lastName}
              </p>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <Mail className="w-4 h-4 mr-1" />
                {data?.guest?.email}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{data?.totalRsvps || 0}</p>
              <p className="text-sm text-gray-500">Total RSVPs</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.confirmed || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Waitlisted</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.waitlisted || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Declined</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts.declined || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Checked In</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.rsvps?.filter(rsvp => rsvp.checkInStatus === 'checked_in').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        {/* RSVPs List */}
        <div className="space-y-6">
          {filteredRSVPs.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No RSVPs Found</h3>
              <p className="text-gray-500">
                {data?.rsvps?.length === 0 
                  ? "You haven't RSVP'd to any events yet." 
                  : "No RSVPs match your current filters."
                }
              </p>
            </div>
          ) : (
            filteredRSVPs.map((rsvp) => (
              <div key={rsvp.rsvpId} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {rsvp.event?.name || 'Unknown Event'}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusVariant(rsvp.status)}`}>
                          {rsvp.status.charAt(0).toUpperCase() + rsvp.status.slice(1)}
                        </span>
                        {rsvp.checkInStatus === 'checked_in' && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCheckInStatus(rsvp.checkInStatus)}`}>
                            Checked In
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-4">{rsvp.event?.description || 'No description available'}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center text-gray-500">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{formatDate(rsvp.event?.eventDate)}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{rsvp.event?.venue || 'N/A'}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Users className="w-4 h-4 mr-2" />
                          <span>
                            {rsvp.event?.currentReservations || 0}/{rsvp.event?.maxCapacity || 0} attending
                          </span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>RSVP'd {formatDate(rsvp.rsvpDate)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 lg:mt-0 lg:ml-6">
                      {rsvp.seatNumber && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center mb-2">
                          <p className="text-sm font-medium text-blue-800">Seat Number</p>
                          <p className="text-lg font-bold text-blue-900">{rsvp.seatNumber}</p>
                        </div>
                      )}
                      
                      {rsvp.event?.isRegistrationOpen ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          Registration Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          Registration Closed
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {(rsvp.specialRequests || rsvp.dietaryRestrictions) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {rsvp.specialRequests && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Special Requests:</p>
                            <p className="text-sm text-gray-600">{rsvp.specialRequests}</p>
                          </div>
                        )}
                        {rsvp.dietaryRestrictions && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Dietary Restrictions:</p>
                            <p className="text-sm text-gray-600">{rsvp.dietaryRestrictions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {rsvp.event?.spotsRemaining <= 5 && rsvp.event?.spotsRemaining > 0 && rsvp.status === 'confirmed' && (
                  <div className="bg-yellow-50 border-t border-yellow-200 px-6 py-3">
                    <p className="text-sm text-yellow-800">
                      ⚠ Only {rsvp.event.spotsRemaining} spots remaining for this event
                    </p>
                  </div>
                )}
                
                {rsvp.event?.isFull && rsvp.status === 'waitlisted' && (
                  <div className="bg-blue-50 border-t border-blue-200 px-6 py-3">
                    <p className="text-sm text-blue-800">
                      ℹ You're on the waitlist. We'll notify you if a spot opens up.
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Results Summary */}
        {filteredRSVPs.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            Showing {filteredRSVPs.length} of {data?.totalRsvps || 0} RSVPs
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRSVPPage;