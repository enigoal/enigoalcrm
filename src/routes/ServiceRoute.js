import express from "express";
import { ServiceModel } from "../models/ServiceModel.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
// import servicesList from '../servicesList.js'; // Adjust the import path for your services list


const ServiceRoutes = express.Router();

// Route to add a new service
ServiceRoutes.post('/api/services',authenticateUser,async (req, res) => {
    const { name, value, status } = req.body;

    // Validate input
    if (!name || !value || !status) {
        return res.status(400).send('Invalid input data');
    }

    // Create and save the service
    const service = {
        name,
        value,
        status
    }

    try {
        const Service = await ServiceModel.create(service);
        res.status(201).send({ message: 'Service added successfully', Service });
    } catch (error) {
        res.status(500).send({ message: 'Error adding service', error: error.message });
    }
});

//edite service
ServiceRoutes.patch('/api/services/:id', authenticateUser,async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Ensure there are fields to update
    if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).send({ message: 'No fields provided for update' });
    }

    try {
        // Update the service with provided fields
        const updatedService = await ServiceModel.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true } // Return updated document and validate inputs
        );

        if (!updatedService) {
            return res.status(404).send({ message: 'Service not found' });
        }

        res.status(200).send({ message: 'Service updated successfully', service: updatedService });
    } catch (error) {
        res.status(500).send({ message: 'Error updating service', error: error.message });
    }
});

//getting all servivces
ServiceRoutes.get('/api/services', authenticateUser,async (req, res) => {
    try {
        // Fetch all services from the database
        const services = await ServiceModel.find();

        // Check if there are any services
        if (!services || services.length === 0) {
            return res.status(404).send({ message: 'No services found' });
        }

        // Send the services as a response
        res.status(200).send(services);
    } catch (error) {
        console.error('Error fetching services:', error);
        res.status(500).send({ message: 'Error fetching services', error: error.message });
    }
});



// Route to bulk insert services
// ServiceRoutes.post('/api/bulk-insert-services', async (req, res) => {
//     try {
//         // Map servicesList to the required format
//         const services = servicesList.map(service => ({
//             name: service.label,
//             value: service.value,
//             status: service.disabled ? false : true, // Set status based on disabled flag
//         }));

//         // Insert services into the database
//         const result = await ServiceModel.insertMany(services);
//         res.status(201).send({ message: 'Services added successfully', result });
//     } catch (error) {
//         console.error('Error inserting services:', error);
//         res.status(500).send({ message: 'Error inserting services', error: error.message });
//     }
// });

ServiceRoutes.delete('/api/services/:id', authenticateUser, async (req, res) => {
    const { id } = req.params;

    try {
        // Find and delete the service
        const deletedService = await ServiceModel.findByIdAndDelete(id);

        if (!deletedService) {
            return res.status(404).send({ message: 'Service not found' });
        }

        res.status(200).send({ message: 'Service deleted successfully', service: deletedService });
    } catch (error) {
        res.status(500).send({ message: 'Error deleting service', error: error.message });
    }
});



export default ServiceRoutes;