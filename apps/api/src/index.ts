import "dotenv/config";
import { app } from "./app.js";
import { assertJwtConfiguration } from "./middleware/auth.js";

const port = Number(process.env.PORT ?? 4000);

assertJwtConfiguration();

app.listen(port, () => {
  console.info(`TaskPilot API listening on http://localhost:${port}`);
});
