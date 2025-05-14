// mongo-init-etl.js
try {
    let rsstatus = rs.status();
    printjson(rsstatus); // Check if already initialized
} catch (e) {
    print("Replica set not yet initialized or error checking status. Attempting to initiate...");
    let config = {
        _id: "rs0",
        members: [
            { _id: 0, host: "mongo_db:27017" }, // Use localhost as it runs within the container initially
        ]
    };
    let initStatus = rs.initiate(config);
    printjson(initStatus);
}

// Optional: Create a user and database after replica set is up if needed for apps
// This script runs very early, so db operations might be better handled by apps on connect
// db = db.getSiblingDB('etl_source_db'); // Switch to your database
// db.createUser({
//   user: 'etl_user',
//   pwd: 'etl_password',
//   roles: [{ role: 'readWrite', db: 'etl_source_db' }],
// });