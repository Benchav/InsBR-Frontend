import https from 'https';

const checkUrl = (path, method = 'GET') => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'insbr-api.vercel.app',
            port: 443,
            path: path,
            method: method
        };

        const req = https.request(options, (res) => {
            console.log(`[${method}] ${path} : ${res.statusCode}`);
            resolve();
        });

        req.on('error', (e) => {
            console.error(`[${method}] ${path} : Error - ${e.message}`);
            resolve();
        });

        req.end();
    });
};

async function run() {
    console.log('--- Probing API Endpoints ---');
    await checkUrl('/api/auth/me');         // User provided
    await checkUrl('/api/auth/users');      // Attempted before
    await checkUrl('/api/products');        // Core
    await checkUrl('/api/sales');           // Core
    await checkUrl('/api/stock');           // Core (check if exists, might be /api/stock/summary)
    await checkUrl('/api/purchases');       // Core
}

run();
