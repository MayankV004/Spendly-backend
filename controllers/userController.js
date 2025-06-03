import User from '../models/user-model.js'

export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findOne({_id : userId});

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
};

