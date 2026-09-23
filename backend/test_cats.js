const axios = require('axios');

async function testApi() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:5000/api' });

    // 1. Auth setup
    const citRes = await api.post('/auth/login', { email: 'citizen@pgrs-test.dev', password: 'Test@1234' });
    const citToken = citRes.data.token;
    
    // 2. Fetch Categories
    const catRes = await api.get('/categories', { headers: { Authorization: `Bearer ${citToken}` } });
    console.log(JSON.stringify(catRes.data, null, 2));

  } catch (err) {
    console.error('Test Failed:', err.response ? err.response.data : err.message);
  }
}

testApi();
