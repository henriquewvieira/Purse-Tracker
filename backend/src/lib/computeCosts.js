export function computeCosts(purseType, materials, productionRecord, settings) {
  const overrides = productionRecord.material_overrides || {}
  const material_cost = purseType.purse_materials.reduce((sum, pm) => {
    const price = overrides[pm.material_id] != null
      ? overrides[pm.material_id]
      : materials[pm.material_id].price_per_unit
    return sum + pm.quantity * price
  }, 0)
  const labor_cost = (productionRecord.labor_minutes / 60) * settings.hourly_rate
  const cost_per_unit = material_cost + labor_cost + (productionRecord.other_costs || 0)
  const total_cost = cost_per_unit * productionRecord.quantity
  const revenue = (productionRecord.sale_price_per_unit || 0) * productionRecord.quantity
  const profit = revenue - total_cost
  return { cost_per_unit, total_cost, revenue, profit }
}
