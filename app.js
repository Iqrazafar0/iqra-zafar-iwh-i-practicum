// app.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();

/* -------- ENV / CONFIG -------- */
const PORT = process.env.PORT || 4000;                 // .env: PORT=4000
const CUSTOM_OBJECT = process.env.CUSTOM_OBJECT;       // .env: CUSTOM_OBJECT=p_games
const HUBSPOT_TOKEN = process.env.PRIVATE_APP_TOKEN;   // .env: PRIVATE_APP_TOKEN=pat-...

/* -------- MIDDLEWARE / VIEWS -------- */
app.use(express.urlencoded({ extended: true })); // read HTML form fields
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

/* -------- HUBSPOT CLIENT -------- */
const hs = axios.create({
  baseURL: 'https://api.hubapi.com',
  headers: {
    Authorization: `Bearer ${HUBSPOT_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Property INTERNAL names (change if yours differ)
const PROPERTIES = ['name', 'publisher', 'price'];

/* ---------------- ROUTES ---------------- */

// Homepage: list custom-object records in a table
app.get('/', async (req, res) => {
  try {
    const { data } = await hs.get(`/crm/v3/objects/${CUSTOM_OBJECT}`, {
      params: { properties: PROPERTIES.join(',') }
    });

    const rows = (data.results || []).map(r => ({
      id: r.id,
      name: r.properties?.name || '',
      publisher: r.properties?.publisher || '',
      price: r.properties?.price || ''
    }));

    res.render('homepage', { title: 'Custom Object Table', rows });
  } catch (err) {
    console.error('GET / error:', err.response?.data || err.message);
    res
      .status(500)
      .send('Error loading records. Check token, object API name, and property internal names.');
  }
});

// Form page
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update Custom Object Form | Integrating With HubSpot I Practicum'
  });
});

// Handle form submit -> create new record
app.post('/update-cobj', async (req, res) => {
  try {
    const { name, publisher, price } = req.body; // must match INTERNAL names
    await hs.post(`/crm/v3/objects/${CUSTOM_OBJECT}`, {
      properties: { name, publisher, price }
    });
    res.redirect('/');
  } catch (err) {
    console.error('POST /update-cobj error:', err.response?.data || err.message);
    res
      .status(500)
      .send('Error creating record. Double-check property internal names and token scopes.');
  }
});

/* -------- START SERVER -------- */
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
