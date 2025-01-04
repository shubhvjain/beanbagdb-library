import express from 'express';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { homedir } from 'os';
import jwt from 'jsonwebtoken';

import { BeanBagDB_CouchDB } from './bbdb_couch.js';
const loadConfigFile = async () => {
  if (!existsSync(configPath)) {
    console.log(`Config file not found!`);
    console.log(`Please create the config file by running: bbdb new-db`);
    process.exit(1); // Stop the server
  }

  try {
    const configFileContent = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(configFileContent);

    if (!config.database) {
      console.error(`Invalid config file: "databases" field is missing.`);
      process.exit(1);
    }

    // Check if JWT secret and expiration field exists
    if (!config.rest || !config.rest.jwt || !config.rest.jwt_expiry) {
      console.error(`Invalid config file: "rest.jwt" or "rest.jwt_expiry" field is missing.`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`Error reading or parsing config file: ${err.message}`);
    process.exit(1);
  }
};

// Function to load and validate the config file
const logActivity = async (activity, details = {}) => {
  const createdOn = new Date().toISOString();
  // Ensure the details string does not contain any commas, by replacing commas with spaces (or another separator)
  let sanitizedDetails = Object.entries(details)
    .map(([key, value]) => `${key}=${value}`) // Convert each entry to key=value
    .join(';'); // Join them with a semicolon

  // Prepare the CSV entry in the format: created_on,activity,details
  const csvEntry = `${createdOn},${activity},"${sanitizedDetails}"\n`; // Format as CSV

  // Append to the CSV log file
  try {
    await fs.appendFile(LOG_FILE_PATH, csvEntry);  // Use fs directly
    //console.log(`${activity} logged successfully in CSV format!`);
  } catch (err) {
    console.error('Error logging activity:', err);
  }
};


const writeCSVLogHeaderIfNeeded = async () => {
  try {
    const fileExists = await fs.access(LOG_FILE_PATH, fs.constants.F_OK)  // Using fs directly
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      // Write the header row to the CSV file
      const header = 'created_on,activity,details\n';
      await fs.writeFile(LOG_FILE_PATH, header);  // Create the file with the header
      console.log('CSV file created with headers!');
    }
  } catch (err) {
    console.error('Error checking or writing CSV header:', err);
  }
};

// Middleware to validate JWT and attach the database information
const authenticateJWT = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get the JWT from the Authorization header
  if (!token) {return res.status(403).json({ error: 'No token provided' })}

  jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
    if (err) {return res.status(403).json({ error: 'Invalid or expired token' });}
    // Attach database info to the request object
    req.database = config.database[decoded.database];
    next(); // Continue to the next middleware/route
  });
};

const logShutdown = async ()=>{
  await logActivity('server_stopped',{port:PORT})
}

let bbdbs = {}

const get_bbdb_object =  (db_details)=>{
  if(!bbdbs[db_details.name]){
    // create a new instance of bbdb
    bbdbs[db_details.name] = new BeanBagDB_CouchDB(db_details.url,db_details.name,db_details.encryption_key)
    //await bbdbs[db_details.name].ready()
  }
  // Check if the method exists in the BBDB class
  return bbdbs[db_details.name]
}

//////////// Server routes //////////////


const app = express();
app.use(express.json());

// Path to the config file in the user's home directory
const configPath = path.join(homedir(), 'bbdb_config.json');

// Global variable to store the config
let config = {};
await loadConfigFile();
// Secret key for signing JWT (read from the config file)
const JWT_SECRET_KEY = config.rest.jwt; // JWT secret from config
const LOG_FILE_PATH = config.rest.log_file_path;
// Load the config file before starting the server

await writeCSVLogHeaderIfNeeded()

app.get('/',(req,res)=>{
  res.json( {message:"Say hi! to your database"})
})

// POST route to generate JWT based on the provided database name
app.post('/hi', (req, res) => {
  const { database, user, min } = req.body;

  // Validate that both database and user are provided
  if (!database || !user) {return res.status(400).json({ error: 'Both database and user are required' });}

  // Check if the database exists in the config
  if (!config.database || !config.database[database]) {return res.status(400).json({ error: 'Database not defined in config' });}

  // Default expiry from config
  let expiresIn = config.rest.jwt_expiry; // Default expiry in minutes from config

  // If min is provided, validate it
  if (min) {
    if (typeof min !== 'number' || min < 5 || min > (6 * 30 * 24 * 60)) { return res.status(400).json({ error: 'Invalid min value. Must be between 5 minutes and 6 months.' });}
    expiresIn = min; // Override the default with the provided min
  }

  // Generate JWT with the database name and user
  const payload = { database, user };
  const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: expiresIn * 60 }); 
  const expiryTimestamp = new Date(Date.now() + expiresIn * 60 * 1000).toISOString();  
  logActivity('jwt_token_issued', {database,expiryTimestamp,user:user.replace(/,/g, ' '),expiresInMin:expiresIn});
  res.json({ message: `Hi ${user}. Here is your token for database ${database}. Use this to access BBDB. This token is valid for ${expiresIn} minutes`, token });
});

app.get("/help",(req,res)=>{
  res.json({baseurl:"POST /bbdb/:action",message:`The BBDB API calls require a valid JWT token obtained from POST /hi.All requests are POST. They either take on input or json input as specified below`,endpoints:BeanBagDB_CouchDB.rest_enabled})
})


app.post('/bbdb/:action', authenticateJWT, async (req, res) => {
  const { action } = req.params; // The method name
  const db_details = req.database
  const params = req.body;       // Parameters for the method
  let bbdb = get_bbdb_object(db_details)

  if (BeanBagDB_CouchDB.rest_enabled[action]){
    try {
      // Dynamically call the method
      const result = await bbdb[action](params);
      res.status(200).json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }else{
    res.status(400).json({ success: false, error: `Action '${action}' is not a valid method.`, api: BeanBagDB_CouchDB.rest_enabled });
  }

  
});

////////// Starting the server

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () =>{
  console.log(`Server is running on port ${PORT}`);
  console.log(`Config loaded`);
  await logActivity("server_started",{port:PORT})
});


// Listen for termination signals tolog server shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down...');
  await logShutdown();
  process.exit(0);  // Exit the process cleanly after logging
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down...');
  await logShutdown();
  process.exit(0);  // Exit the process cleanly after logging
});

// Optionally, handle uncaught exceptions or unhandled promise rejections
process.on('uncaughtException', async (err) => {
  console.error('Uncaught exception:', err);
  await logShutdown();
  process.exit(1);  // Exit the process after logging the uncaught exception
});