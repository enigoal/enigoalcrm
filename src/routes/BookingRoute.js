import express from "express";
import { BookingModel } from "../models/bookingModel.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

const BookingRoutes = express.Router();
//Addbooking
BookingRoutes.post("/addbooking", authenticateUser, async (req, res) => {
  const {
    user_id,
    bdm,
    branch_name,
    company_name,
    contact_person,
    email,
    contact_no,
    services,
    total_amount,
    term_1,
    term_2,
    term_3,
    term_1_payment_date,
    term_2_payment_date,
    term_3_payment_date,
    closed_by,
    pan,
    gst,
    remark,
    date,
    status,
    bank,
    funddisbursement,
    state,
  } = req.body;

  const requiredFields = {
    branch_name,
    contact_person,
    user_id,
    bdm,
    email,
    services,
    total_amount,
    pan,
    state,
    date,
  };

  // Find missing fields
  const missingFields = Object.entries(requiredFields)
    .filter(
      ([key, value]) =>
        !value ||
        (key === "services" && (!Array.isArray(value) || value.length === 0))
    )
    .map(([key]) => key);

  // If there are missing fields, return them in the response
  if (missingFields.length > 0) {
    return res.status(400).send({
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }
  try {
    const new_booking = {
      user_id: user_id,
      bdm: bdm,
      branch_name: branch_name,
      company_name: company_name ? company_name : "",
      contact_person: contact_person,
      email: email,
      contact_no: contact_no,
      closed_by: closed_by,
      services: services,
      total_amount: total_amount,
      term_1: term_1,
      term_2: term_2,
      term_3: term_3,
      term_1_payment_date: term_1_payment_date,
      term_2_payment_date: term_2_payment_date,
      term_3_payment_date: term_3_payment_date,
      pan: pan,
      gst: gst ? gst : "N/A",
      remark: remark,
      date: date ? date : new Date(),
      status: status,
      bank: bank,
      state: state,
      after_disbursement: funddisbursement,
    };

    const booking = await BookingModel.create(new_booking);
    return res.status(201).send({
      Message: "Booking Created Successfully",
      booking_id: booking._id,
      booking,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: error.message });
  }
});
//Edit booking

BookingRoutes.patch("/editbooking/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  let updates = req.body;

  const user_role = req.headers["user-role"];
  if (!user_role) {
    return res.status(400).send({ message: "User role is required" });
  }

  const { updatedBy, note } = updates;
  delete updates.updatedBy;
  delete updates.note;

  try {
    const oldBooking = await BookingModel.findById(id);
    if (!oldBooking) {
      return res.status(404).send("Booking not found");
    }

    const rolesWithFullAccess = ["dev", "senior admin"];

    if (user_role === "admin") {
      const { services, ...allowedUpdates } = updates;
      updates = allowedUpdates;
    }

    // Detect changed fields
    const changedFields = {};
    for (let key in updates) {
      const oldValue = oldBooking[key];
      const newValue = updates[key];

      // Deep compare for arrays or primitive values
      if (Array.isArray(oldValue)) {
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changedFields[key] = { old: oldValue, new: newValue };
        }
      } else if (oldValue !== newValue) {
        changedFields[key] = { old: oldValue, new: newValue };
      }
    }

    // If nothing changed, exit early
    if (Object.keys(changedFields).length === 0) {
      return res.status(400).send({ message: "No changes detected" });
    }

    // Create updated history entry
    const historyEntry = {
      updatedBy: updatedBy || "Unknown",
      updatedAt: new Date(),
      note: note || "",
      changes: changedFields,
    };

    if (rolesWithFullAccess.includes(user_role) || user_role === "admin") {
      const updatedBooking = await BookingModel.findByIdAndUpdate(
        id,
        {
          $set: updates,
          $push: { updatedhistory: historyEntry },
        },
        { new: true }
      );

      return res.status(200).send({
        message: "Booking Updated Successfully",
        updatedBooking,
      });
    }

    return res.status(403).send({
      message: "You do not have permission to edit this booking",
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
});

// BookingRoutes.patch("/editbooking/:id", authenticateUser, async (req, res) => {
//   const { id } = req.params;
//   let updates = req.body;
//   console.log(req.body);

//   const user_role = req.headers["user-role"];
//   if (!user_role) {
//     return res.status(400).send({ message: "User role is required" });
//   }

//   const { updatedBy, note } = updates; // <-- assuming these are sent from frontend

//   delete updates.updatedBy;
//   delete updates.note;

//   try {
//     const Booking = await BookingModel.findById(id);
//     if (!Booking) {
//       return res.status(404).send("Booking not found");
//     }

//     const rolesWithFullAccess = ["dev", "senior admin"];

//     if (user_role === "admin") {
//       const { services, ...allowedUpdates } = updates;
//       updates = allowedUpdates;
//     }

//     // Prepare history entry
//     const historyEntry = {
//       updatedBy: updatedBy || "Unknown",
//       updatedAt: new Date(),
//       note: note || "",
//     };

//     if (rolesWithFullAccess.includes(user_role) || user_role === "admin") {
//       // Update booking data
//       const updatedBooking = await BookingModel.findByIdAndUpdate(
//         id,
//         {
//           $set: updates,
//           $push: { updatedhistory: historyEntry },
//         },
//         { new: true }
//       );

//       return res.status(200).send({
//         message: "Booking Updated Successfully",
//         updatedBooking,
//       });
//     }

//     return res.status(403).send({
//       message: "You do not have permission to edit this booking",
//     });
//   } catch (err) {
//     return res.status(500).send({ message: err.message });
//   }
// });

//Delete Booking
BookingRoutes.delete(
  "/deletebooking/:id",
  authenticateUser,
  async (req, res) => {
    const { id } = req.params;

    try {
      // Find the booking by ID and delete it
      const deletedBooking = await BookingModel.findByIdAndDelete(id);

      // If no booking is found, return a 404 error
      if (!deletedBooking) {
        return res.status(404).send("Booking not found");
      }

      // If booking is successfully deleted, return a success message
      res.status(200).send({ message: "Booking Deleted Successfully" });
    } catch (err) {
      // Handle any errors and return a 500 response
      res.status(500).send(err);
    }
  }
);
//Getting bookings by date
BookingRoutes.get("/bookings", authenticateUser, async (req, res) => {
  const { startDate, endDate } = req.query;
  const userId = req.query.userId;
  const userRole = req.query.userRole;
  // console.log(userId,userRole);

  try {
    // Initialize query
    const query = {};

    // If startDate and endDate are provided, filter bookings between those dates
    if (startDate && endDate) {
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);

      // Ensure both startDate and endDate are valid dates
      if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
        return res.status(400).send({ message: "Invalid date format" });
      }

      // Set the time of endDate to the end of the day for inclusive filtering
      parsedEndDate.setHours(23, 59, 59, 999);

      query.date = {
        $gte: parsedStartDate,
        $lte: parsedEndDate,
      };
    }
    // Define valid roles
    const validRoles = ["dev", "admin", "senior admin"];
    // Check if the user has a valid role
    if (!userRole || !validRoles.includes(userRole)) {
      // If the user doesn't have a valid role, restrict the query to their user_id
      if (!userId) {
        return res.status(403).send({
          message: "Access forbidden. No valid role or user ID provided.",
        });
      }
      //Restrict bookings to the user's own bookings
      query.user_id = userId;
    }

    // Fetch bookings based on the constructed query
    const bookings = await BookingModel.find(query);
    const no_of_bookings = bookings.length;
    if (no_of_bookings === 0) {
      return res.status(404).send({ message: "No Bookings Found" });
    }

    res.status(200).send(bookings);
  } catch (err) {
    // Log the error for debugging purposes
    console.error("Error fetching bookings:", err.message);
    res.status(500).send({ message: err.message });
  }
});
//Getting all bookings
BookingRoutes.get("/all", authenticateUser, async (req, res) => {
  const limit = req.query.limit;
  const Allbookings = await BookingModel.find({})
    .sort({ createdAt: -1 }) // Sort by `createdAt` in descending order (latest first)
    .limit(limit); // Limit the results to the latest 100
  if (Allbookings.length != 0) {
    return res
      .status(200)
      .send({ message: "All Bookings Fetched Successfully", Allbookings });
  }
  return res.status(404).send({ message: "No Bookings To Show" });
});
//geting bookings bu status
BookingRoutes.get("/bookings/status", async (req, res) => {
  const { status } = req.query;
  const userId = req.query.userId;
  const userRole = req.query.userRole; // Assuming the user role is provided in the headers

  try {
    // Validate the status parameter
    const validStatuses = ["Pending", "In Progress", "Completed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).send({
        message:
          "Invalid or missing status parameter. Valid statuses are: Pending, In Progress, Completed.",
      });
    }

    // Define valid roles
    const validRoles = ["dev", "admin", "senior admin"];

    let bookings;

    // Check if the user has a valid role
    if (userRole && validRoles.includes(userRole)) {
      // If the user has a valid role, fetch all bookings for the given status
      bookings = await BookingModel.find({ status: status });
    } else {
      // If the user doesn't have a valid role, fetch only the user's bookings for the given status
      if (!userId) {
        return res.status(403).send({
          message: "Access forbidden. No valid role or user ID provided.",
        });
      }

      bookings = await BookingModel.find({ user_id: userId, status: status });
    }

    const no_of_bookings = bookings.length;

    if (no_of_bookings === 0) {
      return res
        .status(404)
        .send({ message: "No Bookings Found for the given status" });
    }
    res.status(200).send(bookings);
  } catch (err) {
    // Handle any server errors
    console.error("Error fetching bookings by status:", err.message);
    res.status(500).send({ message: err.message });
  }
});
//Filter by service
BookingRoutes.get("/bookings/services", authenticateUser, async (req, res) => {
  const { service } = req.query;
  const userId = req.query.userId;
  const userRole = req.query.userRole; // Assuming the user role is provided in the headers

  try {
    // Validate the service parameter
    if (!service) {
      return res.status(400).send({
        message: "Missing service parameter.",
      });
    }

    // Define valid roles
    const validRoles = ["dev", "admin", "senior admin"];

    // Check if the user has a valid role
    if (!userRole || !validRoles.includes(userRole)) {
      // If the user doesn't have a valid role, find bookings by user_id and service
      if (!userId) {
        return res.status(403).send({
          message: "Access forbidden. No valid role or user ID provided.",
        });
      }

      const bookingsByUserAndService = await BookingModel.find({
        user_id: userId,
        services: service,
      });
      const no_of_bookings = bookingsByUserAndService.length;

      if (no_of_bookings === 0) {
        return res.status(404).send({
          message: "No Bookings Found for the given user and service.",
        });
      }

      return res.status(200).send(bookingsByUserAndService);
    }

    // If the user has a valid role, find bookings based on the service
    const bookings = await BookingModel.find({ services: service });
    const no_of_bookings = bookings.length;

    if (no_of_bookings === 0) {
      return res
        .status(404)
        .send({ message: "No Bookings Found for the given service." });
    }

    res.status(200).send(bookings);
  } catch (err) {
    // Handle any server errors
    console.error("Error fetching bookings by service:", err.message);
    res.status(500).send({ message: err.message });
  }
});

// Combined filter route
BookingRoutes.get("/bookings/filter", authenticateUser, async (req, res) => {
  const { startDate, endDate, status, service, userId, userRole, bdmName } =
    req.query;

  try {
    const query = {};

    // Date filtering
    if (startDate && endDate) {
      const parsedStartDate = new Date(startDate);
      const parsedEndDate = new Date(endDate);
      if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
        return res.status(400).send({ message: "Invalid date format" });
      }
      parsedEndDate.setHours(23, 59, 59, 999);
      query.date = { $gte: parsedStartDate, $lte: parsedEndDate };
    }

    // Status filtering
    if (status) {
      const validStatuses = ["Pending", "In Progress", "Completed"];
      if (!validStatuses.includes(status)) {
        return res.status(400).send({ message: "Invalid status value" });
      }
      query.status = status;
    }

    // Service filtering
    if (service) {
      query.services = service;
    }

    // BDM Name filtering (added for searching by BDM Name)
    if (bdmName) {
      query.bdm = { $regex: new RegExp(bdmName, "i") }; // Use case-insensitive regex for BDM name search
    }

    // Role-based access
    const validRoles = ["dev", "admin", "senior admin"];
    if (!userRole || !validRoles.includes(userRole)) {
      if (!userId) {
        return res.status(403).send({
          message: "Access forbidden. No valid role or user ID provided.",
        });
      }
      query.user_id = userId;
    }

    const bookings = await BookingModel.find(query).sort({ createdAt: -1 });
    if (!bookings.length) {
      return res.status(404).send({ message: "No Bookings Found" });
    }

    res.status(200).send(bookings);
  } catch (err) {
    console.error("Error in /bookings/filter:", err.message);
    res.status(500).send({ message: err.message });
  }
});

export default BookingRoutes;
