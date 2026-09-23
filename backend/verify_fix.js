const axios = require('axios');

async function verifyFix() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:5000/api' });
    const citRes = await api.post('/auth/login', { email: 'citizen@pgrs-test.dev', password: 'Test@1234' });
    const citToken = citRes.data.token;

    const listRes = await api.get('/grievances', { headers: { Authorization: `Bearer ${citToken}` } });
    const gId = listRes.data.data[0].grievance_id;
    
    const detailRes = await api.get(`/grievances/${gId}`, { headers: { Authorization: `Bearer ${citToken}` } });
    const { grievance, activeAssignment } = detailRes.data.data;

    // Verify all the fields the UI needs
    console.log('✅ grievance.department.name:', grievance.department?.name ?? '❌ MISSING');
    console.log('✅ grievance.subCategory.category.name:', grievance.subCategory?.category?.name ?? '❌ MISSING');
    console.log('✅ grievance.subCategory.name:', grievance.subCategory?.name ?? '❌ MISSING');
    console.log('✅ grievance.location:', grievance.location ?? '(null - will show Not provided)');
    console.log('✅ grievance.created_at:', grievance.created_at ?? '❌ MISSING');
    console.log('✅ grievance.description:', grievance.description?.substring(0, 40) ?? '❌ MISSING');
    console.log('✅ grievance.statusHistory.length:', grievance.statusHistory?.length ?? '❌ MISSING');
    console.log('✅ grievance.resolutions.length:', grievance.resolutions?.length ?? '❌ MISSING');
    console.log('✅ grievance.assignments.length:', grievance.assignments?.length ?? '❌ MISSING');
    console.log('✅ activeAssignment (sibling):', activeAssignment);
    
    const d = new Date(grievance.created_at);
    console.log('\n✅ Date parses correctly:', !isNaN(d.getTime()), '->', d.toLocaleString());
    
    console.log('\n--- LIST page: link uses grievance_id? ---');
    console.log('✅ grievance_id in list:', listRes.data.data[0].grievance_id);

  } catch (err) {
    console.error('FAILED:', err.response ? JSON.stringify(err.response.data) : err.message);
  }
}

verifyFix();
