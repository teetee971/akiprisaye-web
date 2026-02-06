import { describe, it, expect } from "vitest";
import { compareDOMTerritory } from "@/services/internationalComparisonService";
import type { TerritoryCode } from "@/types/territory";

describe("internationalComparisonService", () => {
  it("compares prices for Martinique (MQ)", async () => {
    const territory: TerritoryCode = "MQ";

    const result = await compareDOMTerritory(territory);

    expect(result).toBeDefined();
    expect(result.territory).toBe("MQ");
    expect(Array.isArray(result.items)).toBe(true);
  });

  it("compares prices for Guadeloupe (GP)", async () => {
    const territory: TerritoryCode = "GP";

    const result = await compareDOMTerritory(territory);

    expect(result).toBeDefined();
    expect(result.territory).toBe("GP");
  });

  it("throws on unsupported territory", async () => {
    await expect(
      // @ts-expect-error test invalide volontaire
      compareDOMTerritory("MTQ")
    ).rejects.toThrow();
  });
});