
const { ensureSchema } = require("../dist/services/testmode/db");
ensureSchema();
console.log("✅ tm_* schema ensured");
