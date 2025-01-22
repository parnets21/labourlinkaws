const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');

async function migrateData() {
    let client;
    try {
        // Define connection string
        const uri = "mongodb+srv://abhinandhan:Qy99odIOSl0dK1Nt@cluster0.ovafrji.mongodb.net/unividb?retryWrites=true&w=majority";
        
        // Read the source file cont
        const sourceFileContent = fs.readFileSync('./mongo-univ_db-20241128-180650.js', 'utf8');
        
        // Connect to MongoDB
        client = new MongoClient(uri);
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db();

        // Parse file content into operations
        const operations = parseFileContent(sourceFileContent);
        console.log(`Found ${operations.length} operations to process`);

        // Process each operation
        for (const operation of operations) {
            try {
                const collection = db.collection(operation.collection);

                if (operation.type === 'index') {
                    console.log(`Creating index for ${operation.collection}`);
                    const indexKeys = {};
                    for (const [key, value] of Object.entries(operation.keys)) {
                        indexKeys[key] = parseInt(value) || 1;
                    }
                    await collection.createIndex(indexKeys, operation.options || {});
                    console.log(`Index created for ${operation.collection}`);
                } else if (operation.type === 'insert') {
                    console.log(`Inserting document into ${operation.collection}`);
                    const doc = convertTypes(operation.document);
                    await collection.insertOne(doc);
                    console.log(`Document inserted into ${operation.collection}`);
                } else if (operation.type === 'update') {
                    console.log(`Updating documents in ${operation.collection}`);
                    const query = convertTypes(operation.query);
                    const update = convertTypes(operation.update);
                    await collection.updateMany(query, update);
                    console.log(`Documents updated in ${operation.collection}`);
                }
            } catch (err) {
                console.error(`Error processing operation for ${operation.collection}:`, err);
            }
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error.message);
        if (error.code === 'ENOTFOUND') {
            console.error('Check your internet connection or the MongoDB connection string.');
        }
        throw error;
    } finally {
        if (client) {
            await client.close();
            console.log('Database connection closed');
        }
    }
}

function convertTypes(doc) {
    // Recursive type converter for MongoDB-specific fields
    function convert(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;

        if (Array.isArray(obj)) {
            return obj.map(convert);
        }

        const converted = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) {
                if (value.$oid) {
                    converted[key] = new ObjectId(value.$oid);
                } else if (value.$date) {
                    converted[key] = new Date(value.$date);
                } else {
                    converted[key] = convert(value);
                }
            } else {
                converted[key] = value;
            }
        }
        return converted;
    }

    return convert(doc);
}

function parseFileContent(content) {
    const operations = [];
    let lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('/*') && !line.startsWith('*/') && !line.startsWith('//'));

    let currentOperation = null;
    let buffer = '';

    for (const line of lines) {
        if (line.includes('db.getCollection')) {
            // Start new operation
            if (buffer) {
                try {
                    finishOperation(buffer, operations);
                } catch (err) {
                    console.error('Error parsing operation:', err);
                }
            }
            buffer = line;
        } else if (line.endsWith(';')) {
            // End of operation
            buffer += ' ' + line;
            try {
                finishOperation(buffer, operations);
            } catch (err) {
                console.error('Error parsing operation:', err);
            }
            buffer = '';
        } else {
            // Continue building current operation
            buffer += ' ' + line;
        }
    }

    return operations;
}

function finishOperation(buffer, operations) {
    const collectionMatch = buffer.match(/db\.getCollection\("([^"]+)"\)/);
    if (!collectionMatch) return;

    const collectionName = collectionMatch[1];

    if (buffer.includes('.ensureIndex')) {
        // Parse index operation
        const indexMatch = buffer.match(/\.ensureIndex\(({[^}]+})/);
        if (indexMatch) {
            const indexStr = indexMatch[1]
                .replace(/NumberInt\(([^)]+)\)/g, '$1')
                .replace(/\s+/g, ' ');

            try {
                const keys = JSON.parse(indexStr);
                operations.push({
                    type: 'index',
                    collection: collectionName,
                    keys: keys
                });
            } catch (err) {
                console.error('Error parsing index:', indexStr);
            }
        }
    } else if (buffer.includes('.insert')) {
        // Parse insert operation
        const docMatch = buffer.match(/\.insert\(({[^;]+})\)/);
        if (docMatch) {
            let docStr = docMatch[1]
                .replace(/ObjectId\("([^"]+)"\)/g, '{"$oid":"$1"}')
                .replace(/ISODate\("([^"]+)"\)/g, '{"$date":"$1"}')
                .replace(/NumberInt\(([^)]+)\)/g, '$1');

            try {
                const doc = JSON.parse(docStr);
                operations.push({
                    type: 'insert',
                    collection: collectionName,
                    document: doc
                });
            } catch (err) {
                console.error('Error parsing document:', docStr);
            }
        }
    } else if (buffer.includes('.update')) {
        // Parse update operation
        const queryMatch = buffer.match(/\.update\(({[^}]+}),/);
        const updateMatch = buffer.match(/\.update\({[^}]+},\s*({[^}]+})/);

        if (queryMatch && updateMatch) {
            let queryStr = queryMatch[1];
            let updateStr = updateMatch[1];

            try {
                const query = JSON.parse(queryStr);
                const update = JSON.parse(updateStr);
                operations.push({
                    type: 'update',
                    collection: collectionName,
                    query: query,
                    update: update
                });
            } catch (err) {
                console.error('Error parsing update:', queryStr, updateStr);
            }
        }
    }
}

migrateData()
    .then(() => console.log('Migration process completed'))
    .catch(err => console.error('Migration failed:', err.message));
