import User from "../models/User.js";

const checkSubscription = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.subscription !== "askplus") {
    return res.status(403).json({
      message: "Upgrade to ASK+ to access this feature."
    });
  }

  next();
};

export default checkSubscription;
