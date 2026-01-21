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
            // Clean output
            console.log(`${path}: ${res.statusCode}`);
            resolve();
        });

        req.on('error', (e) => {
            console.error(`${path}: ERR`);
            resolve();
        });

        req.end();
    });
};

async function run() {
    await checkUrl('/api/auth/me');
    await checkUrl('/api/auth/users');
    await checkUrl('/api/products');
}

run();
