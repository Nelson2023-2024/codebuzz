// src/pages/guests/GuestPage.jsx

import React, { useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import { useGetAllGuests, useDeleteGuest } from "../../hooks/useGuests";

// Skeleton Component for Loading State
const GuestsTableSkeleton = () => {
  return (
    <div className="p-6">
      {/* Header Section Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>

      {/* Search and Filter Section Skeleton */}
      <div className="flex gap-4 mb-6">
        {/* Search Input Skeleton */}
        <div className="relative flex-1">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Company Filter Skeleton */}
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>

        {/* Status Filter Skeleton */}
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
              </TableHead>
              <TableHead>
                <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
              </TableHead>
              <TableHead>
                <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
              </TableHead>
              <TableHead>
                <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
              </TableHead>
              <TableHead>
                <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Generate 8 skeleton rows */}
            {Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={index}>
                {/* Name Column Skeleton */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-40 animate-pulse"></div>
                    </div>
                  </div>
                </TableCell>
                
                {/* Company Column Skeleton */}
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </TableCell>
                
                {/* Phone Column Skeleton */}
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                </TableCell>
                
                {/* Status Column Skeleton */}
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                </TableCell>
                
                {/* Actions Column Skeleton */}
                <TableCell>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const GuestPage = () => {
  const { guests, isLoading, isError, error } = useGetAllGuests();
  const { deleteGuest, isDeleting } = useDeleteGuest();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Handle delete guest with confirmation
  const handleDeleteGuest = (guest) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${guest.firstName} ${guest.lastName}? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      deleteGuest(guest._id);
    }
  };

  if (isLoading) {
    return <GuestsTableSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        Error: {error.message}
      </div>
    );
  }

  // Filter guests based on search term, company, and status
  const filteredGuests = guests.filter((guest) => {
    const fullName = `${guest.firstName} ${guest.lastName}`;
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          guest.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCompany = selectedCompany === "All" || guest.company === selectedCompany;
    const matchesStatus = selectedStatus === "All" || 
                         (selectedStatus === "Active" && guest.isActive) ||
                         (selectedStatus === "Inactive" && !guest.isActive);

    return matchesSearch && matchesCompany && matchesStatus;
  });

  // Extract unique companies for the filter dropdown
  const uniqueCompanies = [
    "All",
    ...new Set(guests.map((guest) => guest.company).filter(Boolean)),
  ];

  // Status options
  const uniqueStatuses = ["All", "Active", "Inactive"];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Guest Management</h1>
        <Button className="flex items-center gap-2">
          <span className="text-xl">+</span> Add Guest
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search guests..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
        </div>

        {/* Company Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              {selectedCompany} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {uniqueCompanies.map((company) => (
              <DropdownMenuItem
                key={company}
                onClick={() => setSelectedCompany(company)}
              >
                {company}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              {selectedStatus} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {uniqueStatuses.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Guest Table */}
      <div className="rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuests.map((guest) => (
              <TableRow key={guest._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold text-sm">
                      {`${guest.firstName[0]}${guest.lastName[0]}`.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{`${guest.firstName} ${guest.lastName}`}</div>
                      <div className="text-sm text-gray-500">
                        {guest.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{guest.company || 'N/A'}</TableCell>
                <TableCell>{guest.phone}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      guest.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {guest.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={isDeleting}>
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View guest</DropdownMenuItem>
                      <DropdownMenuItem>Edit guest</DropdownMenuItem>
                      <DropdownMenuItem>Send invitation</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600" 
                        onClick={() => handleDeleteGuest(guest)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting..." : "Delete guest"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredGuests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                  No guests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GuestPage;