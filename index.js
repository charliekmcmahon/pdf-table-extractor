const express = require('express');
const bodyParser = require('body-parser');
const pdf_table_extractor = require('pdf-table-extractor');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

/**
 * Function to clean and filter table data, splitting multiline cells
 */
function filterTableData(result) {
    const cleanedData = [];
    let currentCategory = "";  // Initialize the category tracker

    result.pageTables.forEach((pageTable) => {
        const tableRows = pageTable.tables.slice(1);  // Skip the header row

        tableRows.forEach((row) => {
            // Check if the row is a category (usually bold and all caps)
            const itemDescription = row[1];
            const itemCode = row[0];

            if (itemCode.trim() === "" && itemDescription.match(/^[A-Z]+\s[A-Z]+/)) {
                // This is a category header (e.g., "B26 BREAD-BUNS")
                currentCategory = itemDescription;
            } else {
                // This is an actual item, associate it with the current category
                cleanedData.push({
                    itemCode: row[0].trim(),
                    description: row[1].trim(),
                    uom: row[2].trim(),
                    unitsPerCtn: row[3].trim(),
                    category: currentCategory
                });
            }
        });
    });

    return cleanedData;
}


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
            const cleanedData = filterTableData(result);
            
            // Send back the cleaned data
            res.json({ cleanedData });
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