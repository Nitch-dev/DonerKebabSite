import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import 'dotenv/config';
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import axios from "axios"; // Import axios for making HTTP requests from your backend

// app config
const app = express();
const port = 4000;

// middleware
app.use(express.json()); // To parse JSON request bodies
app.use(cors()); // Enable CORS for your backend to allow requests from your frontend

// db connection
connectDB();

// Google Maps API Key (IMPORTANT: Store this securely in your .env file in a real application)
const Maps_API_KEY = process.env.Maps_API_KEY || "AIzaSyBiwvnZ8ecIlMHrcRPBD9jh4Cb0ni6YFu4"; // Use process.env for security

// =========================================================
// NEW: Store Status Management
// =========================================================
// In-memory variable for store status.
// In a real application, this should be stored persistently in a database.
let isStoreOpen = true; // Default state: store is open

// Endpoint to get the current store status
app.get('/api/store-status', (req, res) => {
    res.json({ isOpen: isStoreOpen });
});

// Endpoint for admin to change the store status
// This endpoint should ideally be protected by authentication/authorization middleware
app.post('/api/set-store-status', (req, res) => {
    const { status } = req.body; // Expects { status: true/false }

    if (typeof status === 'boolean') {
        isStoreOpen = status;
        console.log(`Store status changed to: ${isStoreOpen ? 'Open' : 'Closed'}`);
        res.json({ success: true, newStatus: isStoreOpen, message: `Store is now ${isStoreOpen ? 'Open' : 'Closed'}.` });
    } else {
        res.status(400).json({ success: false, message: "Invalid status provided. 'status' must be a boolean (true or false)." });
    }
});
// =========================================================


// =========================================================
// NEW ENDPOINT FOR DISTANCE CALCULATION (PROXY)
// =========================================================
app.post('/api/distance', async (req, res) => {
    const { origins, destinations } = req.body;

    // Basic validation
    if (!origins || !destinations) {
        return res.status(400).json({ success: false, message: "Origin and destination addresses are required." });
    }

    try {
        // Make the request to the Google Maps Distance Matrix API
        // This is a server-to-server request, so CORS is not an issue here.
        const googleMapsResponse = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
            params: {
                origins: origins,
                destinations: destinations,
                key: Maps_API_KEY,
            },
        });

        // Forward Google's response data back to the frontend
        res.json(googleMapsResponse.data);

    } catch (error) {
        console.error("Error calling Google Distance Matrix API from backend:", error.message);
        // Log more details for debugging if needed
        if (error.response) {
            console.error("Google API Response Data:", error.response.data);
            console.error("Google API Response Status:", error.response.status);
            console.error("Google API Response Headers:", error.response.headers);
        } else if (error.request) {
            console.error("No response received from Google API. Request:", error.request);
        } else {
            console.error("Error setting up request to Google API:", error.message);
        }
        res.status(500).json({ success: false, message: "Failed to get distance from Google Maps API. Please try again later." });
    }
});
// =========================================================

// api endpoints (your existing routes)
app.use("/api/food", foodRouter);
app.use("/images", express.static('uploads'));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
    res.send("API Working");
});

app.listen(port, () => {
    console.log(`Server Started on localHost:${port}`);
});