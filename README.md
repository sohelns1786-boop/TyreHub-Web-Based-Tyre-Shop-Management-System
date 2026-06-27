# TyreHub – Web-Based Tyre Shop Management System

TyreHub is a comprehensive, full-stack shop management platform designed specifically for tyre dealerships and service centers. Built with high-performance modern web technologies, it streamlines inventory control, customer enquiries, sales reporting, and user administration. 

The application features a decoupled architecture with a React + Vite frontend and a Node.js + Express backend, integrating MongoDB Atlas for core business storage and Firebase Authentication for secure user logins.

---

## Key Features

### 🔐 Security & Authentication
- **Multi-Factor Login**: Standard Email & Password sign-in coupled with one-click Google Authentication.
- **Email Verification**: Automatic verification link dispatching upon Email/Password sign-up to prevent spam.
- **Forgot Password**: Secure self-service password reset workflow using Firebase.
- **Dual Session Sync**: Frontend token states seamlessly exchange credentials with the backend via a secure `/api/auth/firebase-sync` exchange to issue local JWT tokens.
- **Role-Based Access Control (RBAC)**: Strict access guards separating **Admins** (control panel access, CRUD on inventory/enquiries/stats) from **Regular Users** (browsing tyres, looking up stock counts, profile management, and submitting queries).

### 📦 Inventory & Catalogue Management
- **Interactive Catalogue**: Filter products by vehicle type (Bike, Car, Auto, Lorry), brands, sizes, price ranges, and search keywords.
- **Stock Status Badging**: Automated stock counters highlighting "In Stock", "Low Stock", and "Out of Stock" thresholds.
- **Admin Control Panel**: Full Create, Read, Update, and Delete (CRUD) operations on products, brands, categories, and inventory items.
- **WhatsApp Enquiries**: One-click customer contact links prepopulated with vehicle/tyre specific data.

### 📊 Admin Analytics & Reporting
- **Business Dashboard**: Real-time indicators showing total products, active tyre categories, low-stock alerts, and pending customer call-back requests.
- **Sales Logging**: Tracking sales transactions, stock deduction updates, and overall sales histories.
- **Enquiry Manager**: Complete listing of client callbacks with easy callback resolution controls.

---

## Technologies Used

- **Frontend**: React (v18), Vite, Tailwind CSS, Framer Motion, Axios.
- **Backend**: Node.js, Express.js, JWT, BcryptJS, Multer (image uploads).
- **Authentication**: Firebase Authentication SDK (v10).
- **Database**: MongoDB Atlas (with Mongoose ORM) / Local Mongoose.
- **Security Middlewares**: Helmet, Express Rate Limit, CORS.

---

## Project Structure

```text
├── backend/
│   ├── config/              # MongoDB database configuration & Mock DB handlers
│   ├── controllers/         # Authentication, product, sale, and admin controllers
│   ├── data/                # Mock DB local storage files
│   ├── middleware/          # JWT authorization guard, admin checks, error handlers
│   ├── models/              # Mongoose schemas for User, Product, Service, Enquiry, and Sale
│   ├── routes/              # Express API endpoints
│   ├── uploads/             # Static product image storage
│   ├── seed.js              # Database populator script
│   └── server.js            # Node express entry point
│
└── frontend/
    ├── src/
    │   ├── api/             # Axios configs, base routes, and mock definitions
    │   ├── components/      # Common components: Layout, ProtectedRoute, Footer, etc.
    │   ├── context/         # AuthContext (Firebase) and ToastContext (custom alerts)
    │   ├── pages/           # Pages (Home, Tyres, Contact, Login, Register, Profile, Admin)
    │   ├── utils/           # Helper functions for localStorage sessions
    │   ├── firebase.js      # Firebase SDK client initialization
    │   ├── App.jsx          # Route manager
    │   └── main.jsx         # App mounting point
```

---

## Installation & Setup

### Prerequisites
- Node.js installed locally.
- MongoDB instance (Atlas cluster or local service running on `mongodb://127.0.0.1:27017`).
- A Firebase project with Email/Password & Google sign-in methods enabled.

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Update the `.env` parameters:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/tyrehub
   JWT_SECRET=supersecretkey
   NODE_ENV=development
   PORT=5000
   FIREBASE_PROJECT_ID=your-firebase-project-id
   ```
5. Seed database mock records (creates initial admin accounts and product listings):
   ```bash
   npm run seed
   ```
6. Launch the server in development mode:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Open another terminal in the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Configure your client-side variables:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_FIREBASE_API_KEY=your-firebase-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
   VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
   VITE_FIREBASE_APP_ID=your-firebase-app-id
   ```
5. Start the frontend React client:
   ```bash
   npm run dev
   ```

---

## Verification & Accounts

For sandbox testing, the database seeding script registers three default Admin emails. If they are registered/logged in via Firebase, the backend promotes them to **Admin** status automatically:
- `admin@tyrehub.com` (Seed password: `admin123`)
- `rasheedtyresplanet@gmail.com`
- `sohelns1786@gmail.com`

*All other newly created accounts are registered with the `user` role.*

---

## Deployment

### Serviced Frontend Build (Combined Node Deployment)
To host both backend and frontend together:
1. Build the frontend client:
   ```bash
   cd frontend && npm run build
   ```
2. Launch the Node server in production:
   ```bash
   cd ../backend
   NODE_ENV=production PORT=5000 npm start
   ```
The Express server will automatically serve the built static production index file from the `frontend/dist/` bundle on `http://localhost:5000`.

---

## License
Distributed under the MIT License. See `LICENSE` for more information.

## Author Information
Developed by **Rasheed Tyres Planet** / **Sohel NS**. 
For enquiries or business assistance, contact us at rasheedtyresplanet@gmail.com.
