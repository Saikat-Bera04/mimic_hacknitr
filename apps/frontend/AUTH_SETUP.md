# Frontend-Backend Authentication Integration

## ✅ Completed Setup

The frontend sign-in and sign-up pages have been successfully connected to the backend authentication API.

### What Was Done:

1. **Created Authentication Components:**
   - `SignInForm.tsx` - Handles user login
   - `SignUpForm.tsx` - Handles user registration

2. **API Integration:**
   - Sign-in endpoint: `POST /api/auth/signin`
   - Sign-up endpoint: `POST /api/auth/signup`

3. **Features Implemented:**
   - Form validation
   - Loading states during API calls
   - JWT token storage in localStorage
   - User data storage in localStorage
   - Error handling with toast notifications
   - Success notifications
   - Automatic redirect to dashboard on successful authentication

4. **Environment Configuration:**
   - Created `.env.local` with `NEXT_PUBLIC_BACKEND_URL=http://localhost:8000`

## 🚀 How to Run

### Prerequisites:
- **Option 1:** Bun runtime (preferred)
- **Option 2:** Node.js and npm (alternative)

### Installation:

**If using Bun (Option 1):**
```bash
curl -fsSL https://bun.sh/install | bash
```

**If using Node.js (Option 2):**
```bash
cd apps/backend
npm install
```

### Starting the Application:

1. **Start the Backend:**
   
   **With Bun:**
   ```bash
   cd apps/backend
   bun run dev
   ```
   
   **With Node.js:**
   ```bash
   cd apps/backend
   npm run dev:node
   ```
   
   Backend will run on `http://localhost:8000`

2. **Start the Frontend** (in a new terminal):
   ```bash
   cd apps/frontend
   npm run dev
   ```
   Frontend will run on `http://localhost:3000`

## 📝 Usage

1. Navigate to `http://localhost:3000/signup` to create a new account
2. Navigate to `http://localhost:3000/signin` to log in
3. After successful authentication, you'll be redirected to the dashboard

## 🔐 Authentication Flow

1. User submits credentials via the form
2. Frontend sends POST request to backend API
3. Backend validates credentials using Convex database
4. Backend returns JWT token and user data
5. Frontend stores token and user data in localStorage
6. User is redirected to `/dashboard`

## 📊 API Response Format

**Success Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Error Response:**
```json
{
  "error": "Error message here"
}
```

## 🛡️ Security Notes

- Passwords are hashed using bcrypt before storage
- JWT tokens are used for authentication
- Tokens are stored in localStorage (consider httpOnly cookies for production)
- All authentication requests go through the backend API

## 📁 File Structure

```
apps/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── (auth)/
│   │   │       ├── signin/page.tsx
│   │   │       └── signup/page.tsx
│   │   └── components/
│   │       └── auth/
│   │           ├── SignInForm.tsx
│   │           └── SignUpForm.tsx
│   └── .env.local (contains NEXT_PUBLIC_BACKEND_URL)
└── backend/
    └── routes/
        └── auth.ts (authentication endpoints)
```

## 🔧 Environment Variables

**Frontend (.env.local):**
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

**Backend (should already be configured in .env):**
```
CONVEX_URL=your_convex_url
JWT_SECRET=your_jwt_secret
PORT=8000
```

## ⚠️ Important Notes

- Make sure the backend is running before testing authentication
- The backend uses Convex for data storage
- JWT secret should be set in backend environment variables
- Remember to restart the frontend dev server after creating `.env.local`

## 🐛 Troubleshooting

**Backend not starting:**
- Ensure Bun is installed: `bun --version`
- Check if port 8000 is available: `lsof -i :8000`

**CORS errors:**
- Backend is configured to accept requests from `http://localhost:3000`
- Check backend console for CORS-related errors

**Authentication failing:**
- Check backend logs for detailed error messages
- Verify Convex is properly configured
- Ensure JWT_SECRET is set in backend environment
