import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const jwtAuth = (req, res, next) => {
  const token = req.header("X-API-TOKEN");

  if (!token) {
    return res
      .status(403)
      .json({ message: "Authentication failed. Missing API token." });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(
      token,
      "dsfdasfasdfdkllierrm339i&asfjl@fhdaskf#jhafshlkdkfhhaskldhfjdashnlwqjerheqhrekjrhekjqwhrejkqwrejqwj$kjsadkjfas"
    );
    req.user = decoded; // Save the decoded user info for later use
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ message: "Authentication failed. Invalid token." });
  }
};

export default jwtAuth;
