# Market Data Dissemination Simulator Frontend

This is a Next.js-based frontend for visualizing market data from the Market Data Dissemination Simulator. It provides a real-time visualization of orderbook data for different financial instruments.

## Features

- Real-time orderbook visualization
- WebSocket connection to the API server
- Subscribe/unsubscribe to different instruments
- Animated price level changes

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- API server running on port 3001

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/` - Next.js app directory
  - `components/` - React components
    - `Orderbook.tsx` - Orderbook visualization component
  - `page.tsx` - Main page component
  - `globals.css` - Global CSS styles

## Usage

1. Start the API server:

```bash
cd ../api
npm start
```

2. Start the Next.js frontend:

```bash
npm run dev
```

3. Click "Subscribe" on any instrument to see real-time orderbook data.

## Technologies Used

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
