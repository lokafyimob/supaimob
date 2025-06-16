const http = require('http');

function testPaymentsAPI() {
  return new Promise((resolve, reject) => {
    console.log('🔍 Testing payments API...');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/payments',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log('Status:', res.statusCode);
      console.log('Headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const json = JSON.parse(data);
            console.log('✅ API Response:', json);
            console.log('Number of payments:', json.length);
          } else {
            console.log('❌ Error:', data);
          }
          resolve();
        } catch (error) {
          console.log('❌ Parse error:', error.message);
          console.log('Raw data:', data);
          resolve();
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      resolve();
    });

    req.end();
  });
}

testPaymentsAPI();