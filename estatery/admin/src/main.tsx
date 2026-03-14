/**
 * Application entry point.
 * Mounts the React app into #root and loads global styles.
 */
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Create React root and render the main App component into the DOM element with id "root"
createRoot(document.getElementById("root")!).render(<App />);