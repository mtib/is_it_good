import { route, jsonResponse } from "./router";
import { activities } from "../scoring/activities";

route("GET", "/api/activities", () => {
  const list = Object.values(activities).map((a) => ({
    id: a.id,
    name: a.name,
    qualifiers: a.qualifiers.map((q) => ({
      id: q.id,
      name: q.name,
      unit: q.unit,
      weight: q.weight,
    })),
  }));
  return jsonResponse(list);
});
