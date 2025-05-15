(function () {
    const replicaSetName = "rs0";
    const hostNameInConfig = "mongo_db:27017"; // Docker service name used in rs config

    function sleep(ms) {
        const now = new Date().getTime();
        while (new Date().getTime() < now + ms) { /* busy wait */ }
    }

    function initReplicaSet() {
        const config = {
            _id: replicaSetName,
            members: [
                { _id: 0, host: hostNameInConfig }
            ]
        };

        print("Attempting rs.initiate() with config:");
        printjson(config);

        let initStatus = {};
        try {
            initStatus = rs.initiate(config);
        } catch (initError) {
            print("Error during rs.initiate():");
            printjson(initError);
            if (initError.codeName === 'AlreadyInitialized' || initError.code === 23) {
                print("Replica set was already initialized.");
                initStatus.ok = 1; // Treat as success
            } else {
                print("rs.initiate() failed critically. Exiting...");
                return;
            }
        }

        printjson({ message: "Replica set initiation result:", status: initStatus });

        if (initStatus.ok === 1) {
            print("Waiting for replica set to elect a primary and for member to become healthy...");
            const maxAttempts = 30;
            let attempt = 0;

            while (attempt < maxAttempts) {
                try {
                    const status = rs.status();
                    const primary = status.members?.find(
                        m => m.name === hostNameInConfig && m.stateStr === 'PRIMARY' && m.health === 1
                    );
                    if (status.myState === 1 && primary) {
                        print("Primary elected and member is healthy. Replica set ready.");
                        printjson(status);
                        return;
                    } else {
                        print(`Attempt ${attempt + 1}/${maxAttempts}: Waiting for primary... Current state: ${status.myState}`);
                    }
                } catch (e) {
                    print(`Attempt ${attempt + 1}/${maxAttempts}: Error fetching rs.status(): ${e}`);
                }

                attempt++;
                sleep(2000);
            }

            print("Warning: Timed out waiting for primary. Check MongoDB logs for details.");
            try { printjson(rs.status()); } catch (e) { print("Could not retrieve final rs.status()."); }
        } else {
            print("rs.initiate() was not successful. Cannot proceed.");
        }
    }

    try {
        const rsStatus = rs.status();
        const hasPrimary = rsStatus.members?.some(m => m.stateStr === 'PRIMARY' && m.health === 1);

        if (rsStatus.ok === 1 && hasPrimary) {
            printjson({ message: "Replica set already initialized and has a healthy primary.", status: rsStatus });
        } else {
            print("Replica set status not optimal or no primary. Attempting to initiate...");
            initReplicaSet();
        }
    } catch (e) {
        print(`Error checking rs.status(): ${e}. Assuming not yet initiated.`);
        initReplicaSet();
    }
})();
