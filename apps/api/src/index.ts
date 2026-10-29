import "dotenv/config";
import { app } from "./app.js";
import { assertJwtConfiguration } from "./middleware/auth.js";

const port = Number(process.env.PORT || 4000);

assertJwtConfiguration();

app.listen(port, "0.0.0.0", () => {
  console.info(`TaskPilot listening on 0.0.0.0:${port}`);
});
