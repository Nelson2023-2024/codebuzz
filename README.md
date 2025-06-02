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

## Database Design Image
![Entity Relationship Diagram](./prisma-erd.svg)


## Trade-offs and Considerations
### Technology Choices
**MongoDB vs PostgreSQL**

* Chosen: MongoDB for flexible schema and horizontal scaling
* Trade-off: Less strict data consistency for better performance
* Rationale: Document-based storage suits varying guest data structures

**Bull Queue vs AWS SQS**

* Chosen: Bull Queue with Redis for cost-effectiveness
* Trade-off: Self-managed infrastructure vs managed service
* Rationale: Better control over queue processing and lower costs

**Monolith vs Microservices**

* Chosen: Microservices architecture

* Trade-off: Higher operational complexity vs independent service deployment and scalability

* Rationale: Services are containerized independently (frontend, backend, Redis, MongoDB, Redis Commander), enabling modular development, easier debugging, and future scalability.

**⚛️ React vs Other Frontend Libraries (e.g., Vue, Angular, Svelte)**
| Criteria | React |       Vue / Angular / Svelte                  |  TradeOffs                     |
| ------ | ------ |-----------------------|-----------------------|
| Flexibility | Library only — BYO routing, state, etc. |Vue and Angular are more opinionated|React gives freedom, but this can lead to inconsistent patterns in large teams.
| Community | Massive ecosystem, mature tools |Vue is growing; Angular is stable|React has the widest plugin/library support.
| Performance |Great with optimizations |Svelte often beats others in raw speed|React has good performance, but needs tuning (memo, virtualization, etc).


**🚀 Node.js + Express vs Other Backend Frameworks (e.g., Django, Spring Boot, Laravel)**
| Criteria | Node.js + Express |       Alternatives (Django, Spring, etc.)                  |  TradeOffs                     |
| ------ | ------ |-----------------------|-----------------------|
| Learning Curve | Easy for JS developers; minimal setup |Django (Python), Spring (Java) are more structured and verbose|Express is fast to start with, but can lead to messy architecture without discipline..
| Scalability | Horizontal scaling is easy |Spring Boot is better for enterprise-level scaling|Express suits microservices and startups better; heavy apps may benefit from more opinionated frameworks.
| Performance |	Non-blocking I/O allows high concurrency |Blocking or thread-based models can be slower under I/O load|Node.js excels at handling many simultaneous connections efficiently.



