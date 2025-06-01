// components/modals/CreateEventModal.jsx
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Loader2, Calendar, MapPin, Users, Clock } from "lucide-react";
import { useCreateEvent } from "../../hooks/useEvents";

const CreateEventModal = ({ isOpen, onClose }) => {
  const { createEvent, isLoading } = useCreateEvent();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventDate: "",
    venue: "",
    maxCapacity: 500,
    isActive: true,
    registrationDeadline: "",
  });

  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Event name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Event description is required";
    }

    if (!formData.eventDate) {
      newErrors.eventDate = "Event date is required";
    } else {
      const eventDate = new Date(formData.eventDate);
      const now = new Date();
      if (eventDate <= now) {
        newErrors.eventDate = "Event date must be in the future";
      }
    }

    if (!formData.venue.trim()) {
      newErrors.venue = "Venue is required";
    }

    if (!formData.maxCapacity || formData.maxCapacity <= 0) {
      newErrors.maxCapacity = "Max capacity must be greater than 0";
    }

    // If registration deadline is provided, validate it
    if (formData.registrationDeadline) {
      const regDeadline = new Date(formData.registrationDeadline);
      const eventDate = new Date(formData.eventDate);

      if (regDeadline >= eventDate) {
        newErrors.registrationDeadline =
          "Registration deadline must be before event date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Prepare data for submission
      const eventData = {
        ...formData,
        maxCapacity: parseInt(formData.maxCapacity),
        registrationDeadline: formData.registrationDeadline || undefined,
      };

      await createEvent(eventData);

      // Reset form and close modal
      setFormData({
        name: "",
        description: "",
        eventDate: "",
        venue: "",
        maxCapacity: 500,
        isActive: true,
        registrationDeadline: "",
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      eventDate: "",
      venue: "",
      maxCapacity: 500,
      isActive: true,
      registrationDeadline: "",
    });
    setErrors({});
    onClose();
  };

  // Get min date for datetime-local input (current date + 1 hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create New Event
          </DialogTitle>
          <DialogDescription>
            Set up a new event for your guests. Fill in all the required details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Name */}
          <div className="space-y-2">
            <Label htmlFor="eventName" className="text-sm font-medium">
              Event Name *
            </Label>
            <Input
              id="eventName"
              type="text"
              placeholder="Enter event name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Event Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your event..."
              rows={3}
              value={formData.description}
              onChange={(e) =>
                handleInputChange("description", e.target.value)
              }
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Event Date */}
          <div className="space-y-2">
            <Label htmlFor="eventDate" className="text-sm font-medium">
              Event Date & Time *
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="eventDate"
                type="datetime-local"
                min={getMinDateTime()}
                value={formData.eventDate}
                onChange={(e) =>
                  handleInputChange("eventDate", e.target.value)
                }
                className={`pl-10 ${errors.eventDate ? "border-red-500" : ""}`}
              />
            </div>
            {errors.eventDate && (
              <p className="text-sm text-red-500">{errors.eventDate}</p>
            )}
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <Label htmlFor="venue" className="text-sm font-medium">
              Venue *
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="venue"
                type="text"
                placeholder="Enter venue location"
                value={formData.venue}
                onChange={(e) => handleInputChange("venue", e.target.value)}
                className={`pl-10 ${errors.venue ? "border-red-500" : ""}`}
              />
            </div>
            {errors.venue && (
              <p className="text-sm text-red-500">{errors.venue}</p>
            )}
          </div>

          {/* Max Capacity */}
          <div className="space-y-2">
            <Label htmlFor="maxCapacity" className="text-sm font-medium">
              Maximum Capacity *
            </Label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="maxCapacity"
                type="number"
                min="1"
                placeholder="500"
                value={formData.maxCapacity}
                onChange={(e) =>
                  handleInputChange(
                    "maxCapacity",
                    parseInt(e.target.value) || ""
                  )
                }
                className={`pl-10 ${errors.maxCapacity ? "border-red-500" : ""}`}
              />
            </div>
            {errors.maxCapacity && (
              <p className="text-sm text-red-500">{errors.maxCapacity}</p>
            )}
          </div>

          {/* Registration Deadline (Optional) */}
          <div className="space-y-2">
            <Label
              htmlFor="registrationDeadline"
              className="text-sm font-medium"
            >
              Registration Deadline (Optional)
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="registrationDeadline"
                type="datetime-local"
                min={getMinDateTime()}
                value={formData.registrationDeadline}
                onChange={(e) =>
                  handleInputChange("registrationDeadline", e.target.value)
                }
                className={`pl-10 ${
                  errors.registrationDeadline ? "border-red-500" : ""
                }`}
              />
            </div>
            {errors.registrationDeadline && (
              <p className="text-sm text-red-500">
                {errors.registrationDeadline}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Leave empty to allow registration until the event date
            </p>
          </div>

          {/* Event Status (active/inactive) using a checkbox */}
          <div className="flex items-center space-x-2">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                handleInputChange("isActive", e.target.checked)
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor="isActive" className="text-sm font-medium">
              Event is active (visible to users)
            </Label>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Event"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;
