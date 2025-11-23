import express from 'express';
import admin from 'firebase-admin';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import fetch from 'node-fetch';
import { sendReservationPendingEmail, sendAdminNotificationEmail, sendReservationStatusEmail } from './emailService.js';

dotenv.config();

// Cloudflare Turnstile Configuration
const TURNSTILE_SECRET_KEY = '0x4AAAAAACCTuJhUu5ywTjUkwQtdZyzGPmU';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase Admin using environment variables
// Handle private key - it might have literal \n or actual newlines depending on environment
let privateKey = process.env.FIREBASE_PRIVATE_KEY;
if (privateKey) {
    // Replace literal \n with actual newlines if they exist
    privateKey = privateKey.replace(/\\n/g, '\n');
}

const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};

// Validate Firebase credentials
if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    console.error('ERROR: Missing Firebase credentials in .env file. Check .env.example for required variables.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const RESERVATIONS_COLLECTION = 'reservations';
const ADMINS_COLLECTION = 'admins';

// Seed Admin User
const seedAdminUser = async () => {
    try {
        const adminSnapshot = await db.collection(ADMINS_COLLECTION).where('username', '==', 'admin').get();
        if (adminSnapshot.empty) {
            console.log('Seeding admin user...');
            const hashedPassword = await bcrypt.hash('@dminFablab19', 10);
            await db.collection(ADMINS_COLLECTION).add({
                username: 'admin',
                password: hashedPassword,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('Admin user created successfully.');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
};

seedAdminUser();

// --- Helper Functions ---

// Verify Cloudflare Turnstile Token
async function verifyTurnstileToken(token, remoteip = null) {
    try {
        console.log('🔒 Verifying Turnstile token...');

        const formData = new URLSearchParams();
        formData.append('secret', TURNSTILE_SECRET_KEY);
        formData.append('response', token);
        if (remoteip) {
            formData.append('remoteip', remoteip);
        }

        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = await response.json();
        console.log('🔒 Turnstile verification result:', data.success ? '✅ Success' : '❌ Failed');

        if (!data.success) {
            console.error('Turnstile error codes:', data['error-codes']);
        }

        return data.success;
    } catch (error) {
        console.error('Error verifying Turnstile token:', error);
        return false;
    }
}

// --- Routes ---

// GET /api/ping
// Lightweight endpoint to wake up the server
app.get('/api/ping', (req, res) => {
    console.log('Ping received! Server is awake.');
    res.status(200).json({ status: 'ok', message: 'Server is awake' });
});

// GET /api/reservations
// Fetch all APPROVED reservations to show availability on the frontend
app.get('/api/reservations', async (req, res) => {
    try {
        const snapshot = await db.collection(RESERVATIONS_COLLECTION)
            .where('status', '==', 'approved')
            .get();

        const reservations = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            reservations.push({
                id: doc.id,
                date: data.date,
                startHour: data.startHour,
                endHour: data.endHour,
                spaces: data.spaces,
                status: data.status // Include status field for frontend filtering
            });
        });

        console.log(`Fetched ${reservations.length} approved reservations`);
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/reservations
// Create a new reservation
app.post('/api/reservations', async (req, res) => {
    try {
        let { nom, etablissement, telephone, email, spaces, date, startHour, endHour, note, turnstileToken } = req.body;

        // Normalize date: If it comes as a full ISO string (e.g. from Date object), extract YYYY-MM-DD
        if (date && date.includes('T')) {
            date = date.split('T')[0];
            console.log(`📅 Normalized date to: ${date}`);
        }

        // Verify Turnstile token if provided
        // NOTE: Turnstile validation is currently lenient to allow deployment domain issues
        if (turnstileToken) {
            const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            const isTurnstileValid = await verifyTurnstileToken(turnstileToken, clientIp);

            if (isTurnstileValid) {
                console.log('✅ Turnstile verification passed');
            } else {
                console.warn('⚠️ Turnstile verification failed, but allowing request to proceed (domain configuration issue)');
            }
        } else {
            console.warn('⚠️ No Turnstile token provided, but allowing request to proceed');
        }

        if (!nom || !email || !date || !spaces || spaces.length === 0) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newReservation = {
            nom,
            etablissement,
            telephone,
            email,
            spaces,
            date,
            startHour: parseInt(startHour),
            endHour: parseInt(endHour),
            note,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        console.log('💾 Saving reservation to Firestore...');
        const docRef = await db.collection(RESERVATIONS_COLLECTION).add(newReservation);
        console.log(`✅ Reservation saved with ID: ${docRef.id}`);

        // Send Emails
        try {
            console.log('📧 Sending confirmation email to user...');
            await sendReservationPendingEmail(email, { nom, date, startHour, endHour, spaces });
            console.log('✅ User email sent');

            console.log('📧 Sending notification email to admin...');
            await sendAdminNotificationEmail(process.env.SMTP_USER, {
                nom, etablissement, telephone, email, date, startHour, endHour, spaces, note
            });
            console.log('✅ Admin email sent');
        } catch (emailError) {
            console.error('⚠️ Email sending failed (non-fatal):', emailError);
            // Don't fail the request if email fails
        }

        res.status(201).json({ id: docRef.id, message: 'Reservation created successfully' });
    } catch (error) {
        console.error('❌ Error creating reservation:', error);
        res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
});

// POST /api/admin/login
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const snapshot = await db.collection(ADMINS_COLLECTION).where('username', '==', username).get();

        if (snapshot.empty) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const adminDoc = snapshot.docs[0];
        const adminData = adminDoc.data();

        const isMatch = await bcrypt.compare(password, adminData.password);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({ token: 'secure-admin-token', success: true });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/admin/reservations
// Fetch ALL reservations (pending, approved, denied)
app.get('/api/admin/reservations', async (req, res) => {
    try {
        const snapshot = await db.collection(RESERVATIONS_COLLECTION)
            .orderBy('createdAt', 'desc')
            .get();

        const reservations = [];
        snapshot.forEach(doc => {
            reservations.push({ id: doc.id, ...doc.data() });
        });

        res.json(reservations);
    } catch (error) {
        console.error('Error fetching admin reservations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/admin/reservations/:id/status
// Approve or Deny a reservation
app.put('/api/admin/reservations/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, suggestion } = req.body;

        if (!['approved', 'denied'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const reservationRef = db.collection(RESERVATIONS_COLLECTION).doc(id);
        const doc = await reservationRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        await reservationRef.update({ status });

        // Send Email Notification
        const reservationData = doc.data();
        await sendReservationStatusEmail(reservationData.email, status, reservationData, suggestion);

        res.json({ message: `Reservation ${status} successfully` });
    } catch (error) {
        console.error('Error updating reservation status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
