const axios = require('axios');

async function createAdmin() {
  try {
    const response = await axios.post('http://localhost:5000/api/v1/users/admin', {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin2@smartcampus.com',
      password: 'Admin1#@',
      role: 'admin'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': 'MyNewSuperSecretToken'
      }
    });

    console.log('Admin user created successfully:', response.data);
  } catch (error) {
    console.error('Error creating admin user:', error.response?.data || error.message);
  }
}

createAdmin(); 
//create-admin.js