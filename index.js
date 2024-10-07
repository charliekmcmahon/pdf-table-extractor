const express = require('express');
const bodyParser = require('body-parser');
const pdf_table_extractor = require('pdf-table-extractor');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

/**
 * Route: POST /extract
 * Description: Extract table from PDF and clean the JSON.
 * Request Body: { "pdfName": "<name_of_pdf>" }
 */
app.post('/extract', (req, res) => {
    const { pdfName } = req.body;

    if (!pdfName) {
        return res.status(400).json({ error: 'Please provide the PDF name' });
    }

    // Construct PDF path
    const pdfPath = path.join(__dirname, 'source', pdfName);

    // Extract table from PDF
    pdf_table_extractor(pdfPath,
        (result) => {
            // Clean and filter the table data
            
            // Send back the cleaned data
            res.json({ result });
        },
        (err) => {
            console.error('Error:', err);
            res.status(500).json({ error: 'Failed to extract table from PDF' });
        }
    );
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
