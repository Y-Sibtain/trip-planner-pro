# Trip Planner Pro

An AI-powered travel planning application that helps users create personalized itineraries with flights, hotels, activities, and dining recommendations.

## Features

- AI-powered trip planning with personalized recommendations
- Flight, hotel, and activity booking integration
- Budget breakdown and cost management
- Day-by-day itinerary planning
- Support for multiple destinations (up to 3)
- Dark mode support
- Multi-language support (English, Urdu, Spanish, Arabic)
- User profiles and authentication
- Responsive design for all devices
- Secure payment processing

## Getting Started

### Prerequisites

- Node.js & npm (Install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- Git

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd trip-planner-pro

# Step 3: Install dependencies
npm install

# Step 4: Start the development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

- `src/` - Source code
  - `components/` - Reusable React components
  - `pages/` - Page components
  - `contexts/` - React context providers
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions
  - `integrations/` - Third-party service integrations
- `public/` - Static assets
- `server/` - Backend API routes

## Technologies Used

- **Frontend Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn-ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI Integration**: Claude API

## Development

### Build

```sh
npm run build
```

### Run Tests

```sh
npm run test
```

### Format Code

```sh
npm run format
```

## Deployment

Build the project and deploy the `dist/` folder to your hosting provider of choice.

```sh
npm run build
```

## Contributing

Feel free to open issues and pull requests for any improvements.



