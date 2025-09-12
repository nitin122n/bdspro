# BDS Pro - Payment Proof System

A comprehensive payment proof system with admin panel functionality built with Next.js, TypeScript, and MySQL.

## Features

- **Payment Proof Upload**: Users can upload payment proof images with secure validation
- **Admin Panel**: Complete admin dashboard for approving/rejecting payments
- **JWT Authentication**: Secure access and refresh token system
- **Database Integration**: MySQL database with user wallets and transaction tracking
- **File Upload Security**: Validated file types and size limits
- **Real-time Updates**: Live admin dashboard with instant status updates

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, JWT Authentication
- **Database**: MySQL with connection pooling
- **File Storage**: Local file system with secure validation
- **Authentication**: JWT with access/refresh token pattern

## Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mahimamj/bdspro.git
   cd bdspro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   MYSQL_HOST=your_mysql_host
   MYSQL_PORT=3306
   MYSQL_USER=your_username
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=your_database

   # JWT Secrets
   JWT_SECRET=your_jwt_secret_key
   JWT_REFRESH_SECRET=your_refresh_secret_key

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # API URL
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Set up the database**
   ```bash
   # Run the database migration
   node backend/database/migration_add_proof_image.sql
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
bdspro/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── admin/         # Admin panel endpoints
│   │   └── upload/        # File upload endpoints
│   ├── admin/             # Admin panel page
│   ├── payment/           # Payment form page
│   └── dashboard/         # User dashboard
├── backend/               # Backend utilities
│   ├── database/          # Database schemas and migrations
│   └── controllers/       # Business logic controllers
├── components/            # React components
├── lib/                   # Utility libraries
└── public/                # Static assets
    └── uploads/           # Uploaded files
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/google` - Google OAuth login

### Payments
- `POST /api/payments` - Submit payment
- `POST /api/upload/proof` - Upload payment proof image

### Admin
- `GET /api/admin/deposits` - Get all deposits
- `POST /api/admin/deposits` - Approve/reject deposits

## Database Schema

### Key Tables
- `users` - User accounts and authentication
- `deposits` - Payment submissions with proof images
- `user_wallets` - User wallet balances
- `transactions` - Transaction history
- `refresh_tokens` - JWT refresh token storage

## Security Features

- **File Upload Validation**: Type and size restrictions
- **SQL Injection Prevention**: Prepared statements
- **JWT Security**: Short-lived access tokens with refresh
- **Input Sanitization**: All user inputs validated
- **CORS Protection**: Configured for production

## Development

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
npm start
```

### Database Migrations
```bash
# Run migration script
node run-migration.js
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub.
