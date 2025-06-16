import Connection from '../models/Connection.js';

// export const sendConnectionRequest = async (req, res) => {
//   try {
//     const { requester, receiver, requestedSkill, offeredSkill } = req.body;
//     const existing = await Connection.findOne({ requester, receiver });

//     if (existing) return res.status(409).json({ message: 'Connection already exists.' });

//     const connection = await Connection.create({ requester, receiver, requestedSkill, offeredSkill });
//     res.status(201).json(connection);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const respondToRequest = async (req, res) => {
  try {
    const { connectionId, status } = req.body;
    const updated = await Connection.findByIdAndUpdate(connectionId, { status }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyConnections = async (req, res) => {
  try {
    const { userId } = req.params;
    const connections = await Connection.find({
      $or: [{ requester: userId }, { receiver: userId }]
    }).populate('requester receiver', 'name skills');

    res.status(200).json(connections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
