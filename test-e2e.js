const axios = require('axios');
const assert = require('assert');

async function run() {
  const api = axios.create({ baseURL: 'http://localhost:3000/api' });
  
  // 1. Login as citizen to get token
  const resLogin = await api.post('/auth/login', { email: 'citizen@pgrs-test.dev', password: 'Test@1234' });
  const citToken = resLogin.data.token;
  
  // 2. Login as officer
  const offLogin = await api.post('/auth/login', { email: 'officer@pgrs-test.dev', password: 'Test@1234' });
  const offToken = offLogin.data.token;
  
  // 3. Login as dept head
  const dhLogin = await api.post('/auth/login', { email: 'depthead@pgrs-test.dev', password: 'Test@1234' });
  const dhToken = dhLogin.data.token;
  
  // 4. Create Grievance (Citizen)
  const gRes = await api.post('/grievances', {
    title: 'Water Leak',
    description: 'Leak in the pipe',
    sub_category_id: 1, // assuming 1 exists
    priority: 'high'
  }, { headers: { Authorization: `Bearer ${citToken}` } });
  const gId = gRes.data.data.grievance_id;
  
  console.log('Created Grievance ID:', gId);
  
  // 5. Assign (Dept Head)
  await api.post(`/grievances/${gId}/assign`, {
    officer_id: 2 // Assuming officer has ID 2
  }, { headers: { Authorization: `Bearer ${dhToken}` } });
  console.log('Assigned grievance');
  
  // 6. Update Status to IN_PROGRESS (Officer)
  await api.put(`/grievances/${gId}/status`, {
    status: 'IN_PROGRESS',
    remarks: 'Working on it'
  }, { headers: { Authorization: `Bearer ${offToken}` } });
  console.log('Updated to IN_PROGRESS');
  
  // 7. Resolve (Officer)
  await api.post(`/grievances/${gId}/resolve`, {
    action_taken: 'Fixed the pipe',
    resolution_description: 'Replaced a section of the pipe.'
  }, { headers: { Authorization: `Bearer ${offToken}` } });
  console.log('Resolved grievance');
  
  // 8. Verify Accept (Citizen)
  await api.post(`/grievances/${gId}/verify`, {
    action: 'accept'
  }, { headers: { Authorization: `Bearer ${citToken}` } });
  console.log('Accepted resolution');
  
  // 9. Feedback (Citizen)
  await api.post(`/feedback/${gId}`, {
    rating: 5,
    comment: 'Great job!'
  }, { headers: { Authorization: `Bearer ${citToken}` } });
  console.log('Feedback submitted');
  
  console.log('SUCCESS');
}

run().catch(console.error);
