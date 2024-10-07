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
    // Define the required columns
    const requiredColumns = ['Item Code', 'Item Description', 'UOM', 'Units per Ctn'];

    // Initialize an array to store cleaned data
    const cleanedData = [];

    // Iterate over each page in the result
    result.pageTables.forEach((pageTable) => {
        const tableHeaders = pageTable.tables[0];  // First row is the header
        const tableRows = pageTable.tables.slice(1);  // The rest are rows

        // Get the indices of the required columns
        const indices = requiredColumns.map((col) => tableHeaders.indexOf(col));

        // Iterate over each row and split multiline cells
        tableRows.forEach((row) => {
            // Split multiline cells by line breaks ('\n')
            const splitRows = indices.map((index) => row[index] ? row[index].split('\n') : []);

            // Align the columns by rows (taking into account multiline cells)
            const rowCount = Math.max(...splitRows.map(arr => arr.length));
            
            for (let i = 0; i < rowCount; i++) {
                const filteredRow = splitRows.map(arr => arr[i] || "");  // Fill empty cells with empty strings
                cleanedData.push(filteredRow);
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
