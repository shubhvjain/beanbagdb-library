const fs = require("fs");
const { execSync } = require("child_process");
const readline = require("readline");

// JSON file to store CouchDB instances
const DB_FILE = "couchdb_instances.json";

// Load or initialize instances
let instances = {};
if (fs.existsSync(DB_FILE)) {
  instances = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

// Function to prompt user
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

(async () => {
  console.log("\nAvailable CouchDB Instances:");
  console.log(Object.keys(instances).length ? instances : "No instances found.");

  let port = await askQuestion("\nEnter CouchDB port number (new or existing): ");
  if (!port.match(/^\d+$/)) {
    console.log("Invalid port. Exiting.");
    process.exit(1);
  }

  if (instances[port]) {
    console.log(`Using existing CouchDB on port ${port}`);
  } else {
    // New CouchDB instance
    let dbName = await askQuestion("Enter database name: ");
    if (Object.values(instances).some((inst) => inst.db === dbName)) {
      console.log("DB already exists. Exiting.");
      process.exit(1);
    }

    let externalAccess = await askQuestion("Allow external access? (yes/no): ");
    externalAccess = externalAccess.toLowerCase() === "yes";

    let username = await askQuestion("Enter username: ");
    let existingUser = Object.values(instances).find((inst) => inst.user === username);
    let password = existingUser ? existingUser.password : Math.random().toString(36).slice(-12);

    // Save instance details
    instances[port] = { db: dbName, user: username, password, external: externalAccess };
    fs.writeFileSync(DB_FILE, JSON.stringify(instances, null, 2));

    console.log("Starting CouchDB Docker container...");
    execSync(
      `docker run -d --name couchdb_${port} -p ${port}:5984 \
      -e COUCHDB_USER=${username} -e COUCHDB_PASSWORD=${password} \
      couchdb:latest`,
      { stdio: "inherit" }
    );

    console.log("Creating database...");
    execSync(
      `curl -X PUT http://${username}:${password}@localhost:${port}/${dbName}`,
      { stdio: "inherit" }
    );

    if (externalAccess) {
      console.log("Setting up Nginx proxy...");
      let nginxConfig = `
server {
    listen 80;
    server_name couchdb_${port};
    location / {
        proxy_pass http://localhost:${port};
    }
}`;
      fs.writeFileSync(`/etc/nginx/sites-available/couchdb_${port}`, nginxConfig);
      execSync(`ln -s /etc/nginx/sites-available/couchdb_${port} /etc/nginx/sites-enabled/`, { stdio: "inherit" });
      execSync("systemctl reload nginx", { stdio: "inherit" });
    }
  }

  console.log("CouchDB setup complete.");
  console.log(`Access at: http://localhost:${port}/_utils/`);
  rl.close();
})();
