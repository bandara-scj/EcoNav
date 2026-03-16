import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Amadeus from "amadeus";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Amadeus client
  let amadeus: any = null;
  const getAmadeus = () => {
    if (!amadeus) {
      const clientId = process.env.AMADEUS_CLIENT_ID;
      const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        throw new Error("AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables are required");
      }
      amadeus = new Amadeus({
        clientId,
        clientSecret,
      });
    }
    return amadeus;
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Search Flights
  app.post("/api/flights/search", async (req, res) => {
    try {
      const { originLocationCode, destinationLocationCode, departureDate, adults } = req.body;
      const amadeusClient = getAmadeus();
      
      const response = await amadeusClient.shopping.flightOffersSearch.get({
        originLocationCode,
        destinationLocationCode,
        departureDate,
        adults: adults || 1,
        max: 5,
      });
      
      res.json(response.data);
    } catch (error: any) {
      console.error("Flight search error:", error);
      res.status(500).json({ error: error.message || "Failed to search flights" });
    }
  });

  // Search Hotels
  app.post("/api/hotels/search", async (req, res) => {
    try {
      const { cityCode } = req.body;
      const amadeusClient = getAmadeus();
      
      // First, find hotels in the city
      const hotelsResponse = await amadeusClient.referenceData.locations.hotels.byCity.get({
        cityCode,
      });
      
      res.json(hotelsResponse.data);
    } catch (error: any) {
      console.error("Hotel search error:", error);
      res.status(500).json({ error: error.message || "Failed to search hotels" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
