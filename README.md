# Event Management System

## Overview

A scalable event management system designed to handle 500,000+ guests with bulk email distribution, reservation management, and real-time analytics. The system efficiently manages high-volume email invitations and concurrent RSVP processing while maintaining data integrity and security.

## System Architecture
### Technology Stack (MERN)
#### Backend

* **Node.js & Express:** High-performance JavaScript runtime for handling concurrent requests

* **MongoDB:** NoSQL database for flexible document storage and horizontal scaling

* **Redis:** In-memory data store for caching, session management, and queue processing

* **Bull Queue:** Robust job queue system for email processing and background tasks
* **JWT:** Secure token-based authentication
* **Nodemailer:** Email delivery system
* **bcrypt:** Password hashing and security
* **Mongoose:** MongoDB object modeling
* **Bull Dashboard:** Queue monitoring interface

#### Frontend

* **React 19:** Modern UI library with concurrent features
* **Vite:** Fast build tool and development server
* **Tailwind CSS:** Utility-first CSS framework for responsive design
* **Radix UI:** Accessible component library
* **TanStack Query:** Data fetching and state management



## Key Features
1. **Bulk Email Distribution**

* Batch processing of emails to prevent rate limiting
* Personalized invitation links with unique tokens
* Queue-based system using Bull for reliable delivery
* Retry mechanism for failed email deliveries
* Real-time tracking of email status

2. **Reservation System**

* Secure RSVP links with JWT tokens
* Capacity management with automatic waitlisting
*Concurrent request handling for peak traffic
* Duplicate prevention through database constraints
* Real-time seat availability updates

3. **Guest Management**

* Comprehensive guest database with contact information
* RSVP status tracking and history
* Guest information updates through admin interface
* Bulk import/export functionality
* Email delivery logs and analytics

4. **Admin Dashboard**

* Real-time RSVP statistics and analytics
* Guest data export in CSV format
* Email campaign management and monitoring
* Queue status monitoring through Bull Dashboard
* Event capacity management


