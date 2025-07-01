const fs = require('fs');
const request = require('request-promise');
const cheerio = require('cheerio');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Parse command line arguments
function parseArguments() {
  const args = process.argv.slice(2);
  const config = {
    input: 'hvac-in-chicago-overview.csv',  // default
    output: 'hvac-in-chicago-with-emails.csv'  // default
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && i + 1 < args.length) {
      config.input = args[i + 1];
      i++; // skip next argument as it's the value
    } else if (args[i] === '--output' && i + 1 < args.length) {
      config.output = args[i + 1];
      i++; // skip next argument as it's the value
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log('🐋 Email Scraper Usage:');
      console.log('  node email-scraper.js [options]');
      console.log('');
      console.log('Options:');
      console.log('  --input <file>    Input CSV file (default: hvac-in-chicago-overview.csv)');
      console.log('  --output <file>   Output CSV file (default: hvac-in-chicago-with-emails.csv)');
      console.log('  --help, -h        Show this help message');
      console.log('');
      console.log('Example:');
      console.log('  node email-scraper.js --input my-businesses.csv --output results.csv');
      process.exit(0);
    }
  }
  
  return config;
}

async function main() {
  const config = parseArguments();
  const csvFilePath = config.input;
  const outputCsvPath = config.output;
  
  console.log('🐋 Starting email extraction from CSV websites...');
  console.log(`📂 Input file: ${csvFilePath}`);
  console.log(`📂 Output file: ${outputCsvPath}`);
  
  // Check if input file exists
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: Input file '${csvFilePath}' not found!`);
    console.log('Use --help to see usage information.');
    process.exit(1);
  }
  
  // Read CSV file
  const businesses = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        businesses.push(row);
      })
      .on('end', async () => {
        console.log(`Found ${businesses.length} businesses to process`);
        
        // Process each business and create separate entries for each email
        const businessesWithEmails = [];
        let processedCount = 0;
        
        for (const business of businesses) {
          processedCount++;
          console.log(`\n[${processedCount}/${businesses.length}] Processing: ${business.name}`);
          
          if (business.website && business.website.trim() !== '') {
            console.log(`  → Extracting emails from: ${business.website}`);
            const emails = await getEmailsFromWebsite(business.website);
            
            if (emails && emails.length > 0) {
              console.log(`  → Found ${emails.length} valid email(s): ${emails.join(', ')}`);
              
              // Create separate entry for each email (max 2 unique emails)
              emails.forEach(email => {
                const businessCopy = { ...business };
                businessCopy.emails = email;
                businessesWithEmails.push(businessCopy);
              });
            } else {
              console.log(`  → No valid emails found`);
              // Still include the business but with empty email
              const businessCopy = { ...business };
              businessCopy.emails = '';
              businessesWithEmails.push(businessCopy);
            }
          } else {
            console.log(`  → No website available`);
            const businessCopy = { ...business };
            businessCopy.emails = '';
            businessesWithEmails.push(businessCopy);
          }
        }
        
        // Write to new CSV file
        await writeCsvWithEmails(businessesWithEmails, outputCsvPath);
        console.log(`\n✅ Completed! Results saved to: ${outputCsvPath}`);
        console.log(`📊 Total entries created: ${businessesWithEmails.length} (from ${businesses.length} original businesses)`);
        resolve();
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}

async function getEmailsFromWebsite(websiteUrl) {
  try {
    // Clean and validate URL
    let url = websiteUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    console.log(`    Fetching: ${url}`);
    
    // Set timeout and headers to avoid blocking
    const options = {
      uri: url,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    const html = await request(options);
    const $ = cheerio.load(html);
    
    // Extract emails from mailto links
    const emailElements = $('a[href^="mailto:"]');
    const emails = emailElements.map((i, element) => {
      return $(element).attr('href').replace('mailto:', '');
    }).get();
    
    // Also search for email patterns in text content
    const textContent = $('body').text();
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const textEmails = textContent.match(emailRegex) || [];
    
    // Combine and deduplicate emails
    const allEmails = [...new Set([...emails, ...textEmails])];
    
    if (allEmails.length > 0) {
      console.log(`    Found ${allEmails.length} email(s): ${allEmails.join(', ')}`);
    }
    
    // Filter out common non-business emails and wixpress/sentry emails
    const filteredEmails = allEmails.filter(email => {
      const lowerEmail = email.toLowerCase();
      return !lowerEmail.includes('example.com') && 
             !lowerEmail.includes('test.com') &&
             !lowerEmail.includes('placeholder') &&
             !lowerEmail.includes('wixpress.com') &&
             !lowerEmail.includes('sentry.io') &&
             !lowerEmail.includes('sentry.wixpress.com') &&
             !lowerEmail.includes('sentry-next.wixpress.com') &&
             !lowerEmail.includes('@sentry') &&  // catch any sentry domain
             lowerEmail.length > 5;
    });
    
    // Show what was filtered out
    const filteredOut = allEmails.filter(email => !filteredEmails.includes(email));
    if (filteredOut.length > 0) {
      console.log(`    Filtered out: ${filteredOut.join(', ')}`);
    }
    
    // Return up to 2 unique emails
    const uniqueEmails = [...new Set(filteredEmails)];
    return uniqueEmails.slice(0, 2);
    
  } catch (error) {
    console.log(`    Error extracting from ${websiteUrl}: ${error.message}`);
    return '';
  }
}

async function writeCsvWithEmails(businesses, outputPath) {
  if (businesses.length === 0) return;
  
  // Get all headers from the first business object
  const headers = Object.keys(businesses[0]).map(key => ({
    id: key,
    title: key
  }));
  
  const csvWriter = createCsvWriter({
    path: outputPath,
    header: headers
  });
  
  await csvWriter.writeRecords(businesses);
}

// Add error handling for missing dependencies
function checkDependencies() {
  try {
    require('csv-parser');
    require('csv-writer');
  } catch (error) {
    console.error('Missing required dependencies. Please install them by running:');
    console.error('npm install csv-parser csv-writer request-promise cheerio');
    process.exit(1);
  }
}

checkDependencies();
main().catch(console.error);
