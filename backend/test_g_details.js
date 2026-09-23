const axios = require('axios');

async function testGrievance() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:5000/api' });

    // Login as citizen
    const citRes = await api.post('/auth/login', { email: 'citizen@pgrs-test.dev', password: 'Test@1234' });
    const citToken = citRes.data.token;
    
    // Get all to find one ID
    const listRes = await api.get('/grievances', { headers: { Authorization: `Bearer ${citToken}` } });
    if (listRes.data.data.length === 0) {
       console.log('No grievances found for citizen.');
       return;
    }
    
    const gId = listRes.data.data[0].grievance_id;
    console.log(`Testing ID: ${gId}`);

    // Get specific grievance
    const gRes = await api.get(`/grievances/${gId}`, { headers: { Authorization: `Bearer ${citToken}` } });
    console.log(JSON.stringify(gRes.data.data, null, 2));

  } catch (err) {
    console.error('Test Failed:', err.response ? err.response.data : err.message);
  }
}

testGrievance();
