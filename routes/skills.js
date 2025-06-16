import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Add a skill (to either skills or neededSkills)
router.post('/add', async (req, res) => {
  try {
    const { email, skill, type } = req.body;
    
    if (!email || !skill || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (type !== 'skills' && type !== 'neededSkills') {
      return res.status(400).json({ error: 'Invalid skill type' });
    }
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if skill already exists
    if (user[type].includes(skill)) {
      return res.status(400).json({ error: 'Skill already exists' });
    }
    
    // Add the skill
    user[type].push(skill);
    await user.save();
    
    res.status(200).json(user);
  } catch (err) {
    console.error('Error adding skill:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove a skill
router.delete('/remove', async (req, res) => {
  try {
    const { email, skill, type } = req.body;
    
    if (!email || !skill || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (type !== 'skills' && type !== 'neededSkills') {
      return res.status(400).json({ error: 'Invalid skill type' });
    }
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if skill exists
    const skillIndex = user[type].indexOf(skill);
    if (skillIndex === -1) {
      return res.status(400).json({ error: 'Skill not found' });
    }
    
    // Remove the skill
    user[type].splice(skillIndex, 1);
    
    // Ensure at least one skill remains for required skills
    if (type === 'skills' && user.skills.length === 0) {
      return res.status(400).json({ error: 'Cannot remove the last skill. At least one skill is required.' });
    }
    
    await user.save();
    
    res.status(200).json(user);
  } catch (err) {
    console.error('Error removing skill:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a skill
router.put('/update', async (req, res) => {
  try {
    const { email, oldSkill, newSkill, type } = req.body;
    
    if (!email || !oldSkill || !newSkill || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (type !== 'skills' && type !== 'neededSkills') {
      return res.status(400).json({ error: 'Invalid skill type' });
    }
    
    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if old skill exists
    const skillIndex = user[type].indexOf(oldSkill);
    if (skillIndex === -1) {
      return res.status(400).json({ error: 'Skill not found' });
    }
    
    // Check if new skill already exists
    if (user[type].includes(newSkill)) {
      return res.status(400).json({ error: 'New skill already exists' });
    }
    
    // Update the skill
    user[type][skillIndex] = newSkill;
    await user.save();
    
    res.status(200).json(user);
  } catch (err) {
    console.error('Error updating skill:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;