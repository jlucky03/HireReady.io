import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("../../firebase-service-account.json");

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(serviceAccount),
    });

const adminAuth = getAuth(app);

export default adminAuth;