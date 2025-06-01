import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Building,
  Save,
  AlertCircle,
  Link as LinkIcon,
  Copy, // Import the Copy icon
  Check, // Import the Check icon for feedback
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useUpdateProfile } from "../../hooks/useUpdateProfile";
import toast from "react-hot-toast"; // Import toast for notifications

const ProfilePage = () => {
  const { authUser, isLoading: authLoading } = useAuth();
  const { updateProfile, isLoading: isUpdating } = useUpdateProfile();

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    company: "",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false); // State for copy button feedback

  // Initialize form with user data
  useEffect(() => {
    if (authUser) {
      setFormData({
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        phone: authUser.phone || "",
        company: authUser.company || "",
      });
    }
  }, [authUser]);

  // Track changes
  useEffect(() => {
    if (authUser) {
      const originalData = {
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        phone: authUser.phone || "",
        company: authUser.company || "",
      };

      const hasChanged = Object.keys(formData).some(
        (key) => formData[key] !== originalData[key]
      );

      setHasChanges(hasChanged);
    }
  }, [formData, authUser]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Only send fields that have values
    const updateData = {};
    if (formData.firstName.trim())
      updateData.firstName = formData.firstName.trim();
    if (formData.lastName.trim())
      updateData.lastName = formData.lastName.trim();
    if (formData.phone.trim()) updateData.phone = formData.phone.trim();
    if (formData.company.trim()) updateData.company = formData.company.trim();

    updateProfile(updateData);
  };

  // Reset form to original values
  const handleReset = () => {
    if (authUser) {
      setFormData({
        firstName: authUser.firstName || "",
        lastName: authUser.lastName || "",
        phone: authUser.phone || "",
        company: authUser.company || "",
      });
    }
  };

  // Handle copy to clipboard functionality
  const handleCopyInvitationToken = async () => {
    if (authUser?.invitationToken) {
      try {
        await navigator.clipboard.writeText(authUser.invitationToken);
        setCopied(true);
        toast.success("Invitation token copied to clipboard!");
        setTimeout(() => setCopied(false), 2000); // Reset copied state after 2 seconds
      } catch (err) {
        console.error("Failed to copy invitation token: ", err);
        toast.error("Failed to copy token.");
      }
    }
  };

  if (authLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto py-8">
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5" />
            <span>Please login to view your profile</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {authUser.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Role</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {authUser.role}
                  </p>
                </div>
              </div>
            </div>
            {/* Invitation Token Display */}
            {authUser.invitationToken && (
              <div className="space-y-2"> {/* Use space-y to separate token and warning */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <LinkIcon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-grow">
                    <p className="text-sm font-medium">Invitation Token</p>
                    <p className="text-sm text-muted-foreground break-all">
                      {authUser.invitationToken}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyInvitationToken}
                    aria-label="Copy invitation token"
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="p-3 bg-yellow-100 text-yellow-800 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-grow">Never share this invitation token with anyone else. It grants access.</span>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4"> {/* Adjusted margin for new elements */}
              Email and role cannot be changed. Contact support if you need to
              update these fields.
            </p>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update your personal information below
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
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
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>

              {/* Company Field */}
              <div className="space-y-2">
                <Label htmlFor="company" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Company
                </Label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Enter your company name"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={!hasChanges || isUpdating}
                  className="flex-1"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;