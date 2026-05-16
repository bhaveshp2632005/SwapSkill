import Connection from '../models/Connection.js';
import User from '../models/User.js';

export const sendRequest = async (req, res) => {
  try {
    const { receiver, requestedSkill, offeredSkill } = req.body;
    const requester = req.user.email;

    if (!receiver || !requestedSkill || !offeredSkill) {
      return res.status(400).json({ message: 'receiver, requestedSkill, and offeredSkill are required' });
    }

    if (requester === receiver) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    const existing = await Connection.findOne({
      $or: [
        { requester, receiver },
        { requester: receiver, receiver: requester },
      ],
    });

    if (existing) {
      return res.status(409).json({ message: `Connection already ${existing.status}` });
    }

    const connection = await Connection.create({
      requester,
      receiver,
      requestedSkill,
      offeredSkill,
    });

    // Add notification to receiver
    await User.findOneAndUpdate(
      { email: receiver },
      {
        $push: {
          notifications: {
            type: 'connection_request',
            from: requester,
            message: `${req.user.name} wants to connect and swap skills with you`,
          },
        },
      }
    );

    res.status(201).json({ message: 'Connection request sent', connection });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Connection already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      receiver: req.user.email,
      status: 'pending',
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAcceptedConnections = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [
        { requester: req.user.email, status: 'accepted' },
        { receiver: req.user.email, status: 'accepted' },
      ],
    }).sort({ updatedAt: -1 });

    // Enrich with user info
    const enriched = await Promise.all(
      connections.map(async (conn) => {
        const otherEmail =
          conn.requester === req.user.email ? conn.receiver : conn.requester;
        const otherUser = await User.findOne({ email: otherEmail }).select(
          'name email image skills neededSkills isOnline lastSeen'
        );
        return {
          ...conn.toObject(),
          otherUser,
        };
      })
    );

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const respondToRequest = async (req, res) => {
  try {
    const { connectionId, status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be accepted or rejected' });
    }

    const connection = await Connection.findOne({
      _id: connectionId,
      receiver: req.user.email,
      status: 'pending',
    });

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (status === 'accepted') {
      connection.status = 'accepted';
      await connection.save();

      // Notify requester
      await User.findOneAndUpdate(
        { email: connection.requester },
        {
          $push: {
            notifications: {
              type: 'connection_accepted',
              from: req.user.email,
              message: `${req.user.name} accepted your connection request`,
            },
          },
        }
      );
    } else {
      await Connection.findByIdAndDelete(connectionId);
    }

    res.json({ message: `Request ${status}`, connection });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const acceptRequest = async (req, res) => {
  req.body = { connectionId: req.params.id, status: 'accepted' };
  return respondToRequest(req, res);
};

export const rejectRequest = async (req, res) => {
  req.body = { connectionId: req.params.id, status: 'rejected' };
  return respondToRequest(req, res);
};
