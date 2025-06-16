const bcrypt = require('bcrypt');
const User = require('./models/User');

async function insertDummyData() {
  await User.deleteMany({});

  const plainPasswords = [
    'password1',
    'password2',
    'password3',
    'password4',
    'password5',
    'password6',
    'password7',
    'password8',
    'password9',
    'password10',
  ];

  const users = [
    { name: 'Aman Sharma', email: 'aman@example.com', skills: ['JavaScript', 'React'], neededSkills: ['Node.js', 'MongoDB'], bio: 'Frontend developer looking to improve backend skills.' },
    { name: 'Pooja Mehta', email: 'pooja@example.com', skills: ['Python', 'Data Analysis'], neededSkills: ['Machine Learning', 'TensorFlow'], bio: 'Data analyst passionate about ML.' },
    { name: 'Rahul Verma', email: 'rahul@example.com', skills: ['Graphic Design', 'Photoshop'], neededSkills: ['HTML', 'CSS'], bio: 'Creative designer wanting to build websites.' },
    { name: 'Sneha Patil', email: 'sneha@example.com', skills: ['Java', 'Spring Boot'], neededSkills: ['React', 'UI Design'], bio: 'Backend developer exploring frontend development.' },
    { name: 'Vikram Desai', email: 'vikram@example.com', skills: ['C++', 'Algorithms'], neededSkills: ['Python', 'Data Science'], bio: 'Competitive programmer learning data-driven tech.' },
    { name: 'Nikita Rao', email: 'nikita@example.com', skills: ['SQL', 'MongoDB'], neededSkills: ['Node.js', 'Express'], bio: 'Database expert shifting towards fullstack.' },
    { name: 'Arjun Reddy', email: 'arjun@example.com', skills: ['Node.js', 'Express'], neededSkills: ['Docker', 'Kubernetes'], bio: 'Backend engineer exploring DevOps.' },
    { name: 'Divya Nair', email: 'divya@example.com', skills: ['Flutter', 'UI/UX'], neededSkills: ['Firebase', 'Backend APIs'], bio: 'Mobile app dev enhancing backend integration skills.' },
    { name: 'Karan Singh', email: 'karan@example.com', skills: ['Cybersecurity', 'Networking'], neededSkills: ['Linux', 'Python'], bio: 'Security enthusiast diving deeper into scripting.' },
    { name: 'Meera Joshi', email: 'meera@example.com', skills: ['HTML', 'CSS', 'Bootstrap'], neededSkills: ['JavaScript', 'React'], bio: 'Beginner web dev building interactive UIs.' }
  ];

  for (let i = 0; i < users.length; i++) {
    const hash = await bcrypt.hash(plainPasswords[i], 10);
    users[i].password = hash;
  }

  try {
    await User.insertMany(users);
    console.log('Dummy data with passwords inserted successfully.');
  } catch (err) {
    console.error('Error inserting dummy data:', err.message);
  }
}

module.exports = insertDummyData;  // <-- yeh export zaroori hai
