require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(bodyParser.json());

// Swagger definition
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Twilio SMS API',
            version: '1.0.0',
            description: 'A simple API to send SMS messages using Twilio',
        },
        servers: [
            {
                url: 'http://localhost:3001',
                description: 'Development server',
            },
        ],
    },
    apis: ['./app.js'], // files containing annotations
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Initialize Twilio client with credentials from .env file
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Function to send SMS
async function sendSMS(to, message) {
    try {
        const response = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
        console.log('Message sent successfully! SID:', response.sid);
        return response;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

/**
 * @swagger
 * /send-sms:
 *   post:
 *     summary: Send an SMS message
 *     description: Sends an SMS message using Twilio API
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *                 description: The recipient's phone number in E.164 format
 *                 example: "+1234567890"
 *               message:
 *                 type: string
 *                 description: The message content
 *                 example: "Hello from Twilio!"
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 messageSid:
 *                   type: string
 *                   example: "SM123456789"
 *       400:
 *         description: Missing required parameters
 *       500:
 *         description: Server error
 */
app.post('/send-sms', async (req, res) => {
    try {
        const { to, message } = req.body;
        
        if (!to || !message) {
            return res.status(400).json({
                error: 'Missing required parameters: to and message are required'
            });
        }

        const response = await sendSMS(to, message);
        res.json({
            success: true,
            messageSid: response.sid
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
