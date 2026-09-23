const axios = require('axios');

async function testApis() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:5000/api' });
    const citRes = await api.post('/auth/login', { email: 'citizen@pgrs-test.dev', password: 'Test@1234' });
    const citToken = citRes.data.token;
    
    // List response
    const listRes = await api.get('/grievances', { headers: { Authorization: `Bearer ${citToken}` } });
    console.log('--- LIST top-level keys ---');
    console.log(Object.keys(listRes.data.data[0]));

    // Detail response  
    const gId = listRes.data.data[0].grievance_id;
    const detailRes = await api.get(`/grievances/${gId}`, { headers: { Authorization: `Bearer ${citToken}` } });
    console.log('\n--- DETAIL top-level keys of data ---');
    console.log(Object.keys(detailRes.data.data));
    
    const g = detailRes.data.data.grievance;
    console.log('\n--- DETAIL grievance field keys ---');
    console.log(Object.keys(g));
    console.log('\ncreated_at:', g.created_at);
    console.log('statusHistory:', g.statusHistory);
    console.log('resolutions:', g.resolutions);
    console.log('assignments:', g.assignments);
    console.log('comments:', g.comments);
  } catch (err) {
    console.error('Test Failed:', err.response ? JSON.stringify(err.response.data) : err.message);
  }
}

testApis();
