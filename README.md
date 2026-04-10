# Saloon Manager

A comprehensive saloon booking management system built as a monorepo with TypeScript. This project provides a two-sided mobile application for customers to book appointments at local saloons and for saloon owners to manage their businesses.

## 🚀 Features

### For Customers
- Browse nearby saloons with details (services, hours, location)
- View saloon availability and book time slots
- Track booking status (pending, accepted, rejected, completed)
- Cancel pending bookings
- Multi-language support (English + Hindi)

### For Saloon Owners
- Register and manage saloon profile
- Set working hours and slot durations
- Manage time slots and block/unblock availability
- Accept or reject booking requests
- View booking history and customer details
- Toggle saloon open/closed status

## 🏗️ Architecture

This is a pnpm workspace monorepo containing:

- **Mobile App** (`artifacts/saloon/`): Expo/React Native app with Expo Router
- **API Server** (`artifacts/api-server/`): Express.js REST API with JWT authentication
- **Mockup Sandbox** (`artifacts/mockup-sandbox/`): Vite/React prototyping environment
- **Shared Libraries**:
  - `lib/api-client-react/`: React hooks for API calls
  - `lib/api-zod/`: Zod schemas for API validation
  - `lib/db/`: MongoDB models and connection management
  - `lib/api-spec/`: OpenAPI specification

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo, Expo Router
- **Backend**: Node.js, Express.js, MongoDB with Mongoose
- **Authentication**: JWT tokens
- **State Management**: React Context + React Query
- **Styling**: Native components with custom themes
- **Language**: TypeScript
- **Package Manager**: pnpm workspaces
- **Testing**: Jest
- **Code Generation**: Orval (API client from OpenAPI)

## 📋 Prerequisites

- Node.js 24+
- pnpm
- MongoDB (local or cloud instance)
- Expo CLI (for mobile development)

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Saloon_manager
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and other configs
   ```

4. **Start the API server**
   ```bash
   cd artifacts/api-server
   pnpm run dev
   ```
   The API will be available at `http://localhost:3001`

5. **Start the mobile app**
   ```bash
   cd artifacts/saloon
   pnpm run dev
   ```
   Use Expo Go app on your phone or run in simulator

## 📱 Development

### Available Scripts

- `pnpm run build` - Build all packages
- `pnpm run typecheck` - Type check across all packages
- `pnpm run test` - Run tests across all packages

### Package-specific commands:

**API Server:**
```bash
cd artifacts/api-server
pnpm run dev      # Start development server
pnpm run build    # Build for production
pnpm run start    # Start production server
pnpm run test     # Run tests
```

**Mobile App:**
```bash
cd artifacts/saloon
pnpm run dev      # Start Expo development server
pnpm run build    # Build for production
pnpm run test     # Run tests
```

**Mockup Sandbox:**
```bash
cd artifacts/mockup-sandbox
pnpm run dev      # Start Vite development server
pnpm run build    # Build for production
pnpm run preview  # Preview production build
```

## 🗄️ Database Schema

The application uses MongoDB with the following main entities:

- **Users**: Customers and saloon owners (name, phone, password, role)
- **Saloons**: Saloon profiles (owner info, services, hours, location)
- **TimeSlots**: Available booking slots (date, time, blocked status)
- **Bookings**: Customer booking requests (slot, service, status)

## 🔐 Authentication

- JWT-based authentication
- Two user roles: `customer` and `owner`
- Tokens stored in AsyncStorage (mobile) and HTTP-only cookies (web)

## 🌐 API Endpoints

The REST API provides endpoints for:
- Health checks
- User authentication (register/login)
- Saloon management
- Time slot management
- Booking operations

See `lib/api-spec/openapi.yaml` for complete API specification.

## 🧪 Testing

The project includes unit and integration tests:
- API server tests with Jest and Supertest
- Mobile app component tests
- Database integration tests with MongoDB Memory Server

## 📦 Deployment

### API Server
The API server can be deployed to any Node.js hosting platform:
```bash
cd artifacts/api-server
pnpm run build
pnpm run start
```

### Mobile App
Build and submit to app stores using Expo:
```bash
cd artifacts/saloon
expo build:android  # or build:ios
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm run test`
5. Run typecheck: `pnpm run typecheck`
6. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built for local Indian saloon shops
- Supports English and Hindi languages
- Designed for ease of use by both customers and business owners</content>
<parameter name="filePath">C:\Users\Intel\WebstormProjects\Saloon_manager\README.md
