import { ConfiguredRate, Source } from '../types';

/**
 * Normalizes material names to allow accurate cross-matching between
 * full descriptive catalog names (e.g. 'Black M-Sand') and common aliases ('M-Sand').
 */
export function normalizeMaterialName(name?: string): string {
  if (!name) return '';
  const clean = name.toLowerCase().trim();
  if (clean.includes('m-sand') || clean.includes('msand') || clean.includes('m sand')) return 'm-sand';
  if (clean.includes('20 mm') || clean.includes('20mm')) return '20 mm';
  if (clean.includes('12 mm') || clean.includes('12mm')) return '12 mm';
  if (clean.includes('wmm')) return 'wmm';
  if (clean.includes('boulder')) return 'boulders';
  return clean;
}

/**
 * Normalizes crusher/source identifiers and names for exact matching.
 */
export function normalizeCrusherName(name?: string): string {
  if (!name) return '';
  const clean = name.toLowerCase().trim();
  if (clean === 'crusher a' || clean.includes('abc crusher')) return 'abc crusher';
  if (clean === 'crusher b' || clean.includes('vadipatti crusher')) return 'vadipatti crusher';
  return clean;
}

/**
 * Resolves the configured purchase price per ton for a specific Crusher/Source + Material combination.
 * 
 * CRITICAL RULE:
 * Price is strictly determined by BOTH the selected Crusher and selected Material.
 * If not configured, returns null (never fallback to ₹0, random values, or other crushers).
 */
export function findCrusherPurchaseRate(
  sources: Source[] = [],
  rates: ConfiguredRate[] = [],
  crusherNameOrId?: string,
  materialName?: string
): { rate: number; isConfigured: boolean; effectiveFrom?: string; sourceName?: string } | null {
  if (!crusherNameOrId || !materialName) {
    return null;
  }

  const targetCrusherNorm = normalizeCrusherName(crusherNameOrId);
  const targetMatNorm = normalizeMaterialName(materialName);

  // 1. Find matching source object
  const matchingSource = sources.find((s) => {
    if (s.id.toLowerCase() === crusherNameOrId.toLowerCase()) return true;
    if (s.name.toLowerCase() === crusherNameOrId.toLowerCase()) return true;
    if (normalizeCrusherName(s.name) === targetCrusherNorm) return true;
    return false;
  });

  const sourceId = matchingSource?.id || crusherNameOrId;
  const sourceName = matchingSource?.name || crusherNameOrId;

  // 2. Search configured rates with rateType === 'CRUSHER'
  const matchingRate = rates.find((r) => {
    if (r.rateType !== 'CRUSHER' || r.status === 'INACTIVE') return false;

    // Material match
    const rMatNorm = normalizeMaterialName(r.material);
    const matMatches =
      r.material.toLowerCase() === materialName.toLowerCase() ||
      rMatNorm === targetMatNorm;
    if (!matMatches) return false;

    // Crusher match
    const rSourceId = (r.sourceId || '').toLowerCase();
    const rLoadingLoc = (r.loadingLocation || '').toLowerCase();
    const rDeliveryLoc = (r.deliveryLocation || '').toLowerCase();

    const matchesId = rSourceId === sourceId.toLowerCase();
    const matchesName =
      normalizeCrusherName(r.sourceId) === targetCrusherNorm ||
      normalizeCrusherName(r.loadingLocation) === targetCrusherNorm ||
      rLoadingLoc.includes(targetCrusherNorm) ||
      (targetCrusherNorm.includes('abc') && (rSourceId.includes('src-001') || rSourceId.includes('abc') || rSourceId.includes('crusher a'))) ||
      (targetCrusherNorm.includes('vadipatti') && (rSourceId.includes('src-002') || rSourceId.includes('vadipatti') || rSourceId.includes('crusher b')));

    return matchesId || matchesName;
  });

  if (matchingRate && typeof matchingRate.rate === 'number' && matchingRate.rate > 0) {
    return {
      rate: matchingRate.rate,
      isConfigured: true,
      effectiveFrom: matchingRate.effectiveFrom,
      sourceName,
    };
  }

  // 3. Fallback to Source master item if primary material matches
  if (matchingSource && matchingSource.pricePerTon && matchingSource.pricePerTon > 0) {
    const srcMatNorm = normalizeMaterialName(matchingSource.material);
    if (
      matchingSource.material.toLowerCase() === materialName.toLowerCase() ||
      srcMatNorm === targetMatNorm
    ) {
      return {
        rate: matchingSource.pricePerTon,
        isConfigured: true,
        effectiveFrom: matchingSource.effectiveFrom,
        sourceName,
      };
    }
  }

  // Missing price - Not configured
  return null;
}

/**
 * Returns all configured Crusher rates for a given material.
 */
export function getCrusherRatesForMaterial(
  materialName: string,
  sources: Source[] = [],
  rates: ConfiguredRate[] = []
): Array<{
  crusherId: string;
  crusherName: string;
  rate: number;
  unit: string;
  effectiveFrom: string;
  status: string;
}> {
  const result: Array<{
    crusherId: string;
    crusherName: string;
    rate: number;
    unit: string;
    effectiveFrom: string;
    status: string;
  }> = [];

  const seenCrushers = new Set<string>();

  // Check rates table
  rates
    .filter((r) => r.rateType === 'CRUSHER')
    .forEach((r) => {
      if (normalizeMaterialName(r.material) === normalizeMaterialName(materialName)) {
        const src = sources.find(
          (s) =>
            s.id.toLowerCase() === (r.sourceId || '').toLowerCase() ||
            s.name.toLowerCase() === (r.sourceId || '').toLowerCase() ||
            normalizeCrusherName(s.name) === normalizeCrusherName(r.sourceId)
        );
        const name = src?.name || r.loadingLocation || r.sourceId || 'Quarry';
        const key = `${name}_${materialName}`;
        if (!seenCrushers.has(key)) {
          seenCrushers.add(key);
          result.push({
            crusherId: src?.id || r.sourceId || 'SRC-000',
            crusherName: name,
            rate: r.rate,
            unit: r.unit || 'Ton',
            effectiveFrom: r.effectiveFrom || '2026-08-01',
            status: r.status || 'ACTIVE',
          });
        }
      }
    });

  // Also check source primary materials
  sources.forEach((s) => {
    if (normalizeMaterialName(s.material) === normalizeMaterialName(materialName)) {
      const key = `${s.name}_${materialName}`;
      if (!seenCrushers.has(key) && s.pricePerTon) {
        seenCrushers.add(key);
        result.push({
          crusherId: s.id,
          crusherName: s.name,
          rate: s.pricePerTon,
          unit: 'Ton',
          effectiveFrom: s.effectiveFrom || '2026-08-01',
          status: s.status || 'ACTIVE',
        });
      }
    }
  });

  return result;
}
