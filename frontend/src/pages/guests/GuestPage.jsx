// src/pages/guests/GuestPage.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { ChevronDown, MoreHorizontal, Users, Download } from "lucide-react";
import { useGetAllGuests, useDeleteGuest, useCreateGuest } from "../../hooks/useGuests";

// Skeleton Component for Loading State
const GuestsTableSkeleton = () => {
  return (
    <div className="p-6">
      {/* Header Section Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
      </div>

      {/* Stats Section Skeleton */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded animate-pulse"></div>
              <div>
                <div className="h-4 bg-muted rounded w-24 animate-pulse mb-2"></div>
                <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section Skeleton */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <div className="h-10 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
      </div>

      {/* Table Skeleton */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="h-5 bg-muted rounded w-16 animate-pulse"></div>
              </TableHead>
              <TableHead>
                <div className="h-5 bg-muted rounded w-24 animate-pulse"></div>
              </TableHead>
              <TableHead>
                <div className="h-5 bg-muted rounded w-20 animate-pulse"></div>
              </TableHead>
              <TableHead>
                <div className="h-5 bg-muted rounded w-16 animate-pulse"></div>
              </TableHead>
              <TableHead>
                <div className="h-5 bg-muted rounded w-20 animate-pulse"></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-muted animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                      <div className="h-3 bg-muted rounded w-40 animate-pulse"></div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-muted rounded w-28 animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-muted rounded-full w-16 animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

const GuestPage = () => {
  const navigate = useNavigate();
  const { guests, totalCount, isLoading, isError, error } = useGetAllGuests();
  const { deleteGuest, isDeleting } = useDeleteGuest();
  const { createGuest, isCreating } = useCreateGuest();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    password: ""
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    createGuest(formData, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          company: "",
          password: ""
        });
      }
    });
  };

  // Handle view guest - navigate to detail page
  const handleViewGuest = (guest) => {
    navigate(`/guests/${guest._id}`);
  };

  // Handle delete guest with confirmation
  const handleDeleteGuest = (guest) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${guest.firstName} ${guest.lastName}? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      deleteGuest(guest._id);
    }
  };

  // Export guests to CSV
  const exportToCSV = () => {
    if (!filteredGuests.length) return;
    
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Status', 'Created Date'];
    const csvData = filteredGuests.map(guest => [
      guest.firstName,
      guest.lastName,
      guest.email,
      guest.phone,
      guest.company || 'N/A',
      guest.isActive ? 'Active' : 'Inactive',
      guest.createdAt ? new Date(guest.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : 'N/A'
    ]);
    
    const csvContent = [headers, ...csvData].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guests-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <GuestsTableSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full text-destructive">
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={exportToCSV} 
            className="flex items-center gap-2"
            disabled={filteredGuests.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <span className="text-xl">+</span> Add Guest
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Guest</DialogTitle>
                <DialogDescription>
                  Create a new guest account. Fill in all the required information.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      disabled={isCreating}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      disabled={isCreating}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={isCreating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    disabled={isCreating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    disabled={isCreating}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={isCreating}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Guest"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Total Guest Count Display */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Guests</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
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

      {/* Results Summary */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {filteredGuests.length} of {totalCount} guests
          {searchTerm && ` for "${searchTerm}"`}
          {selectedCompany !== "All" && ` in ${selectedCompany}`}
          {selectedStatus !== "All" && ` with ${selectedStatus.toLowerCase()} status`}
        </p>
      </div>

      {/* Guest Table */}
      <Card>
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
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {`${guest.firstName[0]}${guest.lastName[0]}`.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{`${guest.firstName} ${guest.lastName}`}</div>
                      <div className="text-sm text-muted-foreground">
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
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
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
                      <DropdownMenuItem onClick={() => handleViewGuest(guest)}>
                        View guest
                      </DropdownMenuItem>
                      <DropdownMenuItem>Edit guest</DropdownMenuItem>
                      <DropdownMenuItem>Send invitation</DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive" 
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
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                  No guests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default GuestPage;