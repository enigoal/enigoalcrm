import express from "express";
import { PORT, connection } from "./db/config.js";
import UserRoutes from "./routes/Userroutes.js";
import BookingRoutes from "./routes/BookingRoute.js";
import ServiceRoutes from "./routes/ServiceRoute.js";
import welcomeRoutes from "./routes/WelcomeMail.js";
import cors from "cors";
const app = express();

app.use(express.json());
app.use(cors());

const corsOptions = {
  origin: "*", // Allow all origins
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allow only these HTTP methods
  allowedHeaders: ["Content-Type", "Authorization", "user-role"], // Allow only these headers
  credentials: true, // Allow cookies to be included in the requests
};

app.use(cors(corsOptions));
app.use("/user", UserRoutes);
app.use("/booking", BookingRoutes);
app.use("/services", ServiceRoutes);
app.use("/mail", welcomeRoutes);

app.get("/", (req, res) => {
  res.send("<h1>server is running successfully</h1>");
});

connection()
  .then(() => {
    console.log("connected");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running at http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
