# RideFlow Application Documentation

## Table of Contents
1. [Application Structure Overview](#1-application-structure-overview)
2. [File Execution and Rendering Flow](#2-file-execution-and-rendering-flow)
3. [Folder Duties](#3-folder-duties)
4. [Page/Component Hierarchy](#4-pagecomponent-hierarchy)
5. [Detailed Workflow](#5-detailed-workflow)
6. [State Management](#6-state-management)
7. [API Integration](#7-api-integration)
8. [Conditional Rendering](#8-conditional-rendering)
9. [Styling and UI](#9-styling-and-ui)
10. [Security Features](#10-security-features)
11. [Email Configuration](#11-email-configuration)

## 1. Application Structure Overview

### Core Components
- **App.tsx**: Root component managing main routing
- **AuthProvider**: Global authentication context provider
- **Dashboard**: Main application hub after authentication
- **LandingPage**: Initial entry point for non-authenticated users

### Authentication Flow
```
LandingPage -> Google Sign In -> Dashboard
```

## 2. File Execution and Rendering Flow

### Entry Point Flow
```
index.html -> main.tsx -> App.tsx -> Router -> [Protected/Public Routes]
```

### Component Rendering Hierarchy
```
App.tsx
├── AuthProvider
│   └── Router
│       ├── Public Routes
│       │   └── LandingPage
│       │       ├── Features.tsx
│       │       ├── Footer.tsx
│       │       └── GoogleSignInButton.tsx
│       │
│       └── Protected Routes (RequireAuth.tsx)
│           ├── Dashboard
│           │   ├── AdminDashboard
│           │   │   ├── DashboardStats.tsx
│           │   │   └── AdminControls.tsx
│           │   ├── DriverDashboard
│           │   │   ├── RideQueue.tsx
│           │   │   └── VehicleStatus.tsx
│           │   └── CustomerDashboard
│           │       ├── BookingWidget.tsx
│           │       └── RideHistory.tsx
│           │
│           ├── BookRidePage
│           │   ├── LocationPicker.tsx
│           │   ├── DateTimePicker.tsx
│           │   └── RideOptions.tsx
│           │
│           ├── ManageRidesPage
│           │   ├── RidesList.tsx
│           │   └── RideFilters.tsx
│           │
│           └── ManageUsersPage
│               ├── UsersList.tsx
│               └── UserFilters.tsx
```

### Authentication Flow Details
```
main.tsx
└── App.tsx
    └── AuthProvider (auth-context.tsx)
        ├── useAuth.tsx (Custom Hook)
        ├── GoogleAuthService.ts
        └── Protected Routes
```

### API Service Integration Flow
```
Component
└── API Service (api-service.ts)
    ├── Axios Instance
    │   └── Interceptors
    │       ├── Request Interceptor (Auth Headers)
    │       └── Response Interceptor (Error Handling)
    │
    └── API Endpoints
        ├── auth.api.ts
        ├── rides.api.ts
        ├── users.api.ts
        └── drivers.api.ts
```

### State Management Flow
```
Component
├── Global State (AuthContext)
│   └── useAuth Hook
│
└── Local State
    ├── useState
    └── useReducer
```

## 3. Folder Duties

### `/src` - Source Code Root
- Main application source code
- Entry point files (main.tsx, App.tsx)
- Global type definitions

### `/src/components` - Reusable UI Components
- **`/common`**: Shared UI components used across multiple pages
  - `Button.tsx` - Custom button component with variants
  - `Input.tsx` - Form input components with validation
  - `Modal.tsx` - Reusable modal dialog component
  - `Card.tsx` - Container component for content sections
  - `LoadingSpinner.tsx` - Loading state indicator
  - `ErrorMessage.tsx` - Error display component

- **`/layout`**: Page layout components
  - `Sidebar.tsx` - Navigation sidebar with role-based menu
  - `Header.tsx` - Top navigation bar
  - `Footer.tsx` - Page footer with links
  - `PageContainer.tsx` - Standard page wrapper

- **`/forms`**: Form-related components
  - `LocationPicker.tsx` - Google Maps location selector
  - `DateTimePicker.tsx` - Date and time selection
  - `RideOptionsForm.tsx` - Ride customization options
  - `ValidationWrapper.tsx` - Form validation container

### `/src/pages` - Page Components
- **`/auth`**: Authentication related pages
  - `LoginPage.tsx` - User login handling
  - `RegisterPage.tsx` - New user registration
  - `ForgotPassword.tsx` - Password recovery

- **`/dashboard`**: Dashboard views
  - `AdminDashboard.tsx` - Admin control panel
  - `DriverDashboard.tsx` - Driver ride management
  - `CustomerDashboard.tsx` - User booking interface

- **`/rides`**: Ride management pages
  - `BookRide.tsx` - Ride booking form
  - `RideHistory.tsx` - Past rides list
  - `RideDetails.tsx` - Individual ride information
  - `ManageRides.tsx` - Admin ride management

### `/src/services` - Business Logic and API Integration
- **`/api`**: API integration
  - `api-client.ts` - Axios instance configuration
  - `auth.api.ts` - Authentication endpoints
  - `rides.api.ts` - Ride management endpoints
  - `users.api.ts` - User management endpoints

- **`/hooks`**: Custom React hooks
  - `useAuth.tsx` - Authentication state management
  - `useRides.tsx` - Ride data management
  - `useGeolocation.tsx` - Location services
  - `useNotifications.tsx` - Notification system

### `/src/context` - Global State Management
- `AuthContext.tsx` - Authentication state provider
- `RideContext.tsx` - Ride management state
- `ThemeContext.tsx` - UI theme configuration
- `NotificationContext.tsx` - Global notifications

### `/src/utils` - Helper Functions
- `validation.ts` - Form validation helpers
- `date-formatter.ts` - Date manipulation utilities
- `price-calculator.ts` - Ride pricing logic
- `geo-utils.ts` - Geolocation helpers

### `/src/styles` - Styling Files
- `globals.css` - Global styles and Tailwind imports
- `components.css` - Component-specific styles
- `animations.css` - Custom animations
- `variables.css` - CSS variables and theming

### `/src/types` - TypeScript Type Definitions
- `ride.types.ts` - Ride-related interfaces
- `user.types.ts` - User-related interfaces
- `api.types.ts` - API response types
- `common.types.ts` - Shared type definitions

### `/public` - Static Assets
- `images/` - Image assets
- `icons/` - Icon files
- `fonts/` - Custom fonts
- `locales/` - Internationalization files

### `/tests` - Testing Files
- `unit/` - Unit test files
- `integration/` - Integration tests
- `e2e/` - End-to-end tests
- `mocks/` - Test mock data

## 4. Page/Component Hierarchy

### Public Pages
- **LandingPage**
  - Features component
  - Footer component
  - Google authentication button

### Protected Pages (Requires Authentication)
- **Dashboard**
  - AdminDashboard (for admin/developer roles)
  - DriverDashboard (for driver role)
  - CustomerDashboard (default view)
- **BookRidePage**
- **ManageRidesPage** (admin only)
- **ManageUsersPage** (admin only)
- **ManageDriversPage** (admin only)
- **MyRidesPage** (driver only)
- **RideHistoryPage**

### Shared Components
- **Sidebar**
- **LoadingSpinner**
- **ErrorMessage**
- **EmptyState**
- **GoogleMapsWrapper**
- **LocationAutocomplete**

## 5. Detailed Workflow

### Authentication Flow
1. User lands on `LandingPage`
2. Clicks "Sign in with Google" button
3. `useAuth` context handles Google authentication
4. On successful auth, redirects to `Dashboard`

### Role-Based Routing
```
Routes:
/ -> LandingPage (public)
/dashboard -> Dashboard (protected)
/book-ride -> BookRidePage (protected)
/my-rides -> MyRidesPage (protected, driver only)
/ride-history -> RideHistoryPage (protected)
/manage-rides -> ManageRidesPage (protected, admin/developer)
/manage-drivers -> ManageDriversPage (protected, admin/developer)
/manage-users -> ManageUsersPage (protected, admin only)
```

### Dashboard Workflows

#### Admin Dashboard
- Displays metrics and statistics
- Shows all rides across the system
- Access to management pages
- Export functionality for data

#### Driver Dashboard
- Shows assigned rides
- Ability to update ride status
- Vehicle and profile management
- Real-time ride tracking

#### Customer Dashboard
- Book new rides
- View ride history
- Track current rides
- Cancel pending rides

### Booking Flow
1. User navigates to `BookRidePage`
2. Enters ride details:
   - Pickup/Dropoff locations (using Google Places Autocomplete)
   - Date and time
   - Additional notes
   - Private ride option
   - Return ride option
3. Submits booking
4. Redirects to Dashboard with success message

## 6. State Management

### Global State
- **AuthContext**: Manages user authentication state and roles
  - User information
  - Authentication status
  - User roles
  - Sign-in/Sign-out functions

### Local State Management
- Each page maintains its own local state for:
  - Form data
  - Loading states
  - Error messages
  - Filter/search parameters

## 7. API Integration

### Backend Routes
```
/api/users - User management
/api/rides - Ride management
/api/health - System health check
/api/test - Testing endpoint
```

### Data Flow
1. Components make API calls using the `api` service
2. Responses update local state
3. UI updates reflect the new data
4. Error handling shows appropriate messages

## 8. Conditional Rendering

### Role-Based Access
```javascript
userRoles.includes('admin') || isDeveloper() ? 
  <AdminDashboard /> : 
userRoles.includes('driver') ?
  <DriverDashboard /> :
  <CustomerDashboard />
```

### Loading States
```javascript
{loading ? (
  <LoadingSpinner />
) : error ? (
  <ErrorMessage message={error} />
) : data.length === 0 ? (
  <EmptyState />
) : (
  // Main content
)}
```

## 9. Styling and UI

### Framework
- Tailwind CSS for styling
- Responsive design with mobile-first approach
- Custom gradients and animations
- Icon integration with react-icons

### Components
- Custom UI components for consistency
- Responsive sidebar navigation
- Loading states and error messages
- Empty state placeholders

## 10. Security Features

- Protected routes using authentication checks
- Role-based access control
- Token-based authentication
- API request logging
- CORS configuration

## 11. Email Configuration

The application uses Gmail SMTP for sending email notifications. To set up email notifications:

1. Create a Gmail account or use an existing one
2. Enable 2-Step Verification in your Google Account
3. Generate an App Password:
   - Go to Google Account settings
   - Navigate to Security > 2-Step Verification > App passwords
   - Generate a new app password for "Mail"
4. Add the following to your .env file:   ```
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_APP_PASSWORD=your-app-specific-password   ```

Email notifications are sent for:
- New ride bookings
- Ride cancellations
- Driver assignments
- Ride completions

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run development server: `npm run dev`

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
