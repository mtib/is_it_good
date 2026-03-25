export const config = {
  owmApiKey: process.env.OWM_API_KEY || "",
  dbPath: process.env.DB_PATH || "./data/is_it_good.db",
  port: parseInt(process.env.PORT || "3000", 10),
  baseUrl: process.env.BASE_URL || "",
};
