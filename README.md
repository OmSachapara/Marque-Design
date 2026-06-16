# Marque Design

Marque Design is a premium, modern web application that allows users to explore, customize, and order luxury vehicles. Featuring a sleek, dynamic UI and robust backend architecture, it delivers a state-of-the-art car configuration experience.

## Features

- **Luxury Car Showcase**: Browse an exclusive collection of high-end vehicles.
- **Dynamic Customization**: Configure cars with real-time updates to pricing and visuals.
- **User Authentication**: Secure login system supporting Email/Password, Google OAuth, and Apple Sign-In.
- **Profile Dashboard**: Manage personal information, view order history, and save favorite car configurations.
- **Shopping Cart & Checkout**: Seamless ordering process.
- **Admin Panel**: Manage inventory, track user orders, and handle site administration.

## Technology Stack

### Frontend
- **HTML5**: Semantic markup for structural integrity.
- **Vanilla CSS3**: Custom-built styling system (no CSS frameworks) featuring glassmorphism, fluid typography, dark mode, and dynamic micro-animations.
- **Vanilla JavaScript**: Modular client-side scripting for state management, API integration, and DOM manipulation.

### Backend
- **Node.js & Express.js**: Fast, scalable server architecture and RESTful API endpoints.
- **MongoDB**: NoSQL database for flexible data modeling (Users, Cars, Orders, Favorites).
- **Passport.js**: Robust authentication middleware handling local and OAuth strategies.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Atlas account (or local MongoDB instance)
- Google Cloud Console account (for OAuth)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/OmSachapara/Marque-Design.git
   cd Marque-Design/MAJOR-MINOR\ (MARQUE)/MARQUE_DESIGN
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root of `MARQUE_DESIGN` and add the following variables:
   ```env
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```
   *Note: For Google OAuth to function, you must also place your downloaded `google_oauth.json` file inside `src/Google/`.*

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`.

## Project Structure

```text
MARQUE_DESIGN/
├── public/                 # Static frontend assets
│   ├── css/                # Stylesheets (modular design system)
│   ├── js/                 # Client-side scripts
│   ├── images/             # Car imagery and UI assets
│   └── *.html              # Page templates (index, profile, checkout, etc.)
├── src/                    # Backend source code
│   ├── config/             # Configuration files (Passport.js)
│   ├── middleware/         # Custom Express middleware (auth)
│   ├── models/             # Mongoose database schemas
│   ├── routes/             # Express API routes
│   ├── services/           # External service integrations (Email)
│   ├── Google/             # OAuth configuration
│   ├── database.js         # MongoDB connection logic
│   └── server.js           # Express application entry point
├── .env.example            # Example environment variables
├── .gitignore              # Git ignore rules
└── package.json            # Project dependencies and scripts
```

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your suggested changes. Ensure that your code follows the existing style and is well-documented.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
