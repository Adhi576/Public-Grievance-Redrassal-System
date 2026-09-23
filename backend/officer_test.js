const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function runTest() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:5000/api' });

    // 1. Auth setup
    const citRes = await api.post('/auth/login', { email: 'citizen@pgrs-test.dev', password: 'Test@1234' });
    const citToken = citRes.data.token;
    
    const dhRes = await api.post('/auth/login', { email: 'depthead@pgrs-test.dev', password: 'Test@1234' });
    const dhToken = dhRes.data.token;

    const offRes = await api.post('/auth/login', { email: 'officer@pgrs-test.dev', password: 'Test@1234' });
    const offToken = offRes.data.token;

    // 2. Create Grievance
    const gRes = await api.post('/grievances', {
      title: 'Broken Streetlight',
      description: 'Streetlight is broken near the park',
      sub_category_id: 1,
      priority: 'high'
    }, { headers: { Authorization: `Bearer ${citToken}` } });
    
    const gId = gRes.data.data.grievance_id;
    console.log(`Created Grievance: ${gId}`);

    // 3. Assign
    await api.post(`/grievances/${gId}/assign`, {
      officer_id: offRes.data.user.user_id
    }, { headers: { Authorization: `Bearer ${dhToken}` } });
    console.log(`Assigned Grievance to Officer`);

    // --- Officer Flow Test ---
    
    // a. Update Status to IN_PROGRESS
    await api.patch(`/grievances/${gId}/status`, {
      status: 'IN_PROGRESS',
      note: 'Starting work'
    }, { headers: { Authorization: `Bearer ${offToken}` } });
    console.log(`Updated status to IN_PROGRESS`);

    // b. Add Remark
    await api.post(`/grievances/${gId}/remarks`, {
      note: 'Found the broken bulb, requesting replacement.'
    }, { headers: { Authorization: `Bearer ${offToken}` } });
    console.log(`Added internal remark`);

    // c. Resolve & Proof Upload
    // create a dummy file
    const dummyPath = path.join(__dirname, 'proof.txt');
    fs.writeFileSync(dummyPath, 'Proof of replacement.');
    
    const form = new FormData();
    form.append('action_taken', 'Replaced bulb');
    form.append('resolution_description', 'Bulb replaced with LED.');
    form.append('attachments', fs.createReadStream(dummyPath));

    await api.post(`/grievances/${gId}/resolve`, form, {
      headers: { 
        Authorization: `Bearer ${offToken}`,
        ...form.getHeaders()
      }
    });
    console.log(`Resolved Grievance with Proof`);
    
    // Verify final state
    const finalRes = await api.get(`/grievances/${gId}`, {
      headers: { Authorization: `Bearer ${offToken}` }
    });
    
    const status = finalRes.data.data.current_status;
    const resolutionsCount = finalRes.data.data.resolutions.length;
    
    console.log(`Final Status: ${status}`);
    console.log(`Resolutions Count: ${resolutionsCount}`);
    
    if (status === 'RESOLVED' && resolutionsCount === 1) {
      console.log('TEST PASSED SUCCESSFULLY');
    } else {
      console.log('TEST FAILED');
    }

  } catch (err) {
    console.error('Test Failed:', err.response ? err.response.data : err.message);
  }
}

runTest();
