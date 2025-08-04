#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

const endpoints = [
  { name: 'Health Check', url: `${API_BASE_URL}/health`, method: 'GET' },
  { name: 'Past Papers', url: `${API_BASE_URL}/pastpapers`, method: 'GET' },
  { name: 'Units', url: `${API_BASE_URL}/units`, method: 'GET' },
  { name: 'Courses', url: `${API_BASE_URL}/courses`, method: 'GET' },
  { name: 'Notes', url: `${API_BASE_URL}/notes`, method: 'GET' },
];

async function testEndpoint(endpoint) {
  const startTime = Date.now();
  
  try {
    const response = await axios({
      method: endpoint.method,
      url: endpoint.url,
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      ...endpoint,
      status: 'success',
      statusCode: response.status,
      responseTime,
      dataSize: JSON.stringify(response.data).length
    };
  } catch (error) {
    return {
      ...endpoint,
      status: 'error',
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

async function runTests() {
  console.log('🧪 Testing SyllaBuzz API Endpoints');
  console.log('=' .repeat(50));
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log('');
  
  const results = await Promise.all(endpoints.map(testEndpoint));
  
  results.forEach(result => {
    const statusIcon = result.status === 'success' ? '✅' : '❌';
    const statusCode = result.statusCode ? ` (${result.statusCode})` : '';
    const responseTime = ` ${result.responseTime}ms`;
    const dataInfo = result.dataSize ? ` | ${result.dataSize} bytes` : '';
    
    console.log(`${statusIcon} ${result.name}${statusCode}${responseTime}${dataInfo}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('');
  const successCount = results.filter(r => r.status === 'success').length;
  const totalCount = results.length;
  
  if (successCount === totalCount) {
    console.log('🎉 All endpoints are responding correctly!');
  } else {
    console.log(`⚠️  ${totalCount - successCount} out of ${totalCount} endpoints failed`);
  }
}

// Run the tests
runTests().catch(console.error);