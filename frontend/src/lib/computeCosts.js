// Duplicate of backend/src/lib/computeCosts.js (pure function)
export function computeCosts(purseType, materials, productionRecord, settings) {
  const overrides = productionRecord.material_overrides || {}
  const material_cost = purseType.purse_materials.reduce((sum, pm) => {
    const mat = materials[pm.material_id]
    const overridePrice = overrides[pm.material_id]
    let cost
    if (pm.width_cm != null && pm.height_cm != null && mat.width_cm != null && mat.height_cm != null) {
      // Area-based: price_per_cm² × area used
      const piecePrice = overridePrice != null ? overridePrice : mat.price_per_unit
      const price_per_cm2 = piecePrice / (mat.width_cm * mat.height_cm)
      cost = price_per_cm2 * (pm.width_cm * pm.height_cm)
    } else {
      const price = overridePrice != null ? overridePrice : mat.price_per_unit
      cost = pm.quantity * price
    }
    return sum + cost
  }, 0)
  const labor_cost = (productionRecord.labor_minutes / 60) * settings.hourly_rate
  const cost_per_unit = material_cost + labor_cost + (productionRecord.other_costs || 0)
  const total_cost = cost_per_unit * productionRecord.quantity
  const revenue = (productionRecord.sale_price_per_unit || 0) * productionRecord.quantity
  const profit = revenue - total_cost
  return { cost_per_unit, total_cost, revenue, profit }
}
