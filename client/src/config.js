// Client configuration
// In production, this will be bundled into the app
// In development, Vite will handle it

const config = {
  devPort: 5173,
  serverUrl: "http://localhost:3002",
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
};

export default config;
