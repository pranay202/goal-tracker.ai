import { SqlitePlannerRepository } from "../data/SqlitePlannerRepository";
import { PlannerService } from "./PlannerService";

// Composition stays outside the service so pure service tests never load a
// device-only SQLite module; the app remains the production composition root.
export const createPlanner = () =>
  new PlannerService(new SqlitePlannerRepository());
