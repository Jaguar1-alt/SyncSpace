import crypto from "crypto";

function generateInviteToken() {
  return crypto.randomBytes(16).toString("hex"); // unique string
}

export default generateInviteToken;
