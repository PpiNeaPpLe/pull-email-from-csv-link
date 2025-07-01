const fs = require('fs');
const path = require('path');

// Function to properly parse CSV line with quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    // Don't forget the last field
    result.push(current);
    
    return result;
}

// Function to check if a string looks like an email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

function showFirstEmail(inputFile) {
    try {
        // Check if file exists
        if (!fs.existsSync(inputFile)) {
            console.error(`Error: File "${inputFile}" not found.`);
            process.exit(1);
        }

        // Read the file
        const data = fs.readFileSync(inputFile, 'utf8');
        const lines = data.split('\n');

        if (lines.length === 0) {
            console.log('The file is empty.');
            return;
        }

        // Get header line to find emails column index
        const headers = parseCSVLine(lines[0]);
        const emailColumnIndex = headers.findIndex(header => 
            header.toLowerCase().trim() === 'emails'
        );

        if (emailColumnIndex === -1) {
            console.log('No "emails" column found in the CSV file.');
            return;
        }

        console.log(`Looking for emails in column ${emailColumnIndex + 1} (${headers[emailColumnIndex]})...`);
        console.log('');

        let emailCount = 0;

        // Search through data lines (skip header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines

            const columns = parseCSVLine(line);
            
            if (columns.length > emailColumnIndex) {
                const emailsData = columns[emailColumnIndex].trim();
                
                if (emailsData && emailsData !== '') {
                    // Parse and validate emails
                    const allEmails = emailsData.split(',').map(email => email.trim()).filter(email => email);
                    const validEmails = allEmails.filter(email => isValidEmail(email));
                    
                    if (validEmails.length > 0) {
                        emailCount++;
                        
                        // Extract the business name from the second column for context
                        const businessName = columns.length > 1 ? columns[1] : 'Unknown Business';
                        
                        console.log(`${emailCount}. Business: ${businessName}`);
                        
                        if (validEmails.length > 1) {
                            console.log(`   First email: ${validEmails[0]}`);
                            console.log(`   Total valid emails: ${validEmails.length}`);
                            console.log(`   All emails: ${validEmails.join(', ')}`);
                        } else {
                            console.log(`   Email: ${validEmails[0]}`);
                        }
                        
                        console.log(`   Line: ${i + 1}`);
                        console.log('');
                    }
                }
            }
        }

        if (emailCount === 0) {
            console.log('No emails found in the file.');
        } else {
            console.log(`Total businesses with emails: ${emailCount}`);
        }

    } catch (error) {
        console.error(`Error reading file: ${error.message}`);
        process.exit(1);
    }
}

// Get command line argument
const inputFile = process.argv[2];

if (!inputFile) {
    console.log('Usage: node show-first-email.js <input-file>');
    console.log('');
    console.log('This script shows the first email for each business entry in the CSV file.');
    console.log('');
    console.log('Example:');
    console.log('  node show-first-email.js hvac-in-chicago-with-emails.csv');
    console.log('  node show-first-email.js new-lenox.csv');
    process.exit(1);
}

console.log(`Showing first email for each business in: ${inputFile}`);
console.log('='.repeat(50));
showFirstEmail(inputFile); 