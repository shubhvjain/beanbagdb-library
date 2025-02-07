import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import os from 'os';

const configFileName = 'bbdb_config.json';
const userHomeDir = os.homedir();
const configFilePath = path.join(userHomeDir, configFileName);
const databaseFolderName = 'bbdb'; // Root folder for databases
const rootDatabasePath = path.join(userHomeDir, databaseFolderName);
const log_file_path  = path.join(rootDatabasePath, "rest_logs.txt");

const validateDatabaseName = (dbName) => /^[a-zA-Z1-9]+$/.test(dbName);

const generate_random_code = ()=>{
  const randomNumber = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000; // Generate a random number between 100000 and 999999
  return randomNumber.toString(16)
}

export const initConfigFile = async () => {
  const defaultConfig = { 
    database: {}, 
    rest:{
      jwt:`${generate_random_code()}${generate_random_code()}${generate_random_code()}${generate_random_code()}`,
      jwt_expiry: 60,
      log_file_path: log_file_path
    }
  };
  await fs.writeFile(configFilePath, JSON.stringify(defaultConfig, null, 2));
};

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};


export const getConfig = async () => {
  try {
    const configData = await fs.readFile(configFilePath, 'utf8');
    return JSON.parse(configData);
  } catch (err) {
    console.error('Error reading the config file:', err);
    process.exit(1);
  }
};

export const saveConfig = async (config) => {
  try {
    await fs.writeFile(configFilePath, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('Error saving the config file:', err);
    process.exit(1);
  }
};



export const listDatabases = async () => {
  if (await fileExists(configFilePath)) {
    const config = await getConfig();
    if (config.databases.length > 0) {
      console.log('Defined databases:');
      config.databases.forEach(db => {
        console.log(`- ${db.name} (${db.folder_link})`);
      });
    } else {
      console.log('No databases defined. Use "bbdb new-db <database-name>" to add one.');
    }
  } else {
    console.log('Configuration file missing. Use "bbdb new-db <database-name>" to create.');
  }
};

export const addDatabase = async (dbName) => {
  if (!validateDatabaseName(dbName)) {
    console.error('Invalid database name. Please use a single word with alphabets only.');
    return;
  }

  if (!await fileExists(configFilePath)) {
    console.log('Configuration file missing, creating a new one.');
    await initConfigFile();
  }

  const config = await getConfig();
  if (config.database[dbName]) {
    console.error(`Database "${dbName}" already defined.`);
    return;
  }

   // Ensure the root database folder exists
   if (!await fileExists(rootDatabasePath)) {
    await fs.mkdir(rootDatabasePath);
    console.log(`Root folder "${rootDatabasePath}" created.`);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = (question) => new Promise((resolve) =>
    rl.question(question, resolve)
  );

  // const type = await prompt('Database Type : ');
  // const validTypes = ['couchdb'];
  // if (!validTypes.includes(type.toLowerCase())) {
  //   console.error('Invalid database type. Valid options are "couchdb" or "mongodb".');
  //   rl.close();
  //   return;
  // }

  const url = await prompt('Database URL: ');
  const encryptionKey = await prompt('Encryption Key: ');
  // const doc_folder = await prompt('Folder link: () ');
  rl.close();

  // Create a subfolder for the database
  const dbFolderPath = path.join(rootDatabasePath, dbName);
  if (!await fileExists(dbFolderPath)) {
    await fs.mkdir(dbFolderPath);
    console.log(`Database folder "${dbFolderPath}" created.`);
  } else {
    console.log(`Database folder "${dbFolderPath}" already exists.`);
  }

  config.database[dbName]= {
    name: dbName,
    type: "couchdb",
    url,
    encryption_key: encryptionKey,
    folder_link: dbFolderPath,
    created:Math.floor(Date.now() / 1000)
  };

  await saveConfig(config);
  console.log(`Database "${dbName}" added successfully.You can now use it with the CLI and the REST API`);
};

