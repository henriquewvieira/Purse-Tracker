import { describe, it, expect } from '@jest/globals'
import { computeCosts } from '../computeCosts.js'

// Mini Tote fixture
const purseType = {
  purse_materials: [
    { material_id: 1, quantity: 0.4 },  // Oxford Fabric
    { material_id: 2, quantity: 1 },    // Leather Patch
    { material_id: 3, quantity: 1 },    // Zipper
  ],
}

const materials = {
  1: { price_per_unit: 6.50 },  // Oxford Fabric
  2: { price_per_unit: 2.00 },  // Leather Patch
  3: { price_per_unit: 0.90 },  // Zipper
}

const settings = { hourly_rate: 15 }

describe('computeCosts', () => {
  it('calculates correct costs for Mini Tote (10 units, sold at $25)', () => {
    const record = {
      quantity: 10,
      labor_minutes: 45,
      other_costs: 0.50,
      sale_price_per_unit: 25,
      material_overrides: {},
    }
    const result = computeCosts(purseType, materials, record, settings)

    // material_cost = (0.4 * 6.50) + (1 * 2.00) + (1 * 0.90) = 2.60 + 2.00 + 0.90 = 5.50
    // labor_cost = (45 / 60) * 15 = 11.25
    // cost_per_unit = 5.50 + 11.25 + 0.50 = 17.25
    // total_cost = 17.25 * 10 = 172.50
    // revenue = 25 * 10 = 250
    // profit = 250 - 172.50 = 77.50
    expect(result.cost_per_unit).toBeCloseTo(17.25)
    expect(result.total_cost).toBeCloseTo(172.50)
    expect(result.revenue).toBeCloseTo(250)
    expect(result.profit).toBeCloseTo(77.50)
  })

  it('applies material price overrides correctly', () => {
    const record = {
      quantity: 1,
      labor_minutes: 45,
      other_costs: 0.50,
      sale_price_per_unit: 25,
      material_overrides: { 1: 8.00 },  // Oxford override from 6.50 to 8.00
    }
    const result = computeCosts(purseType, materials, record, settings)

    // material_cost = (0.4 * 8.00) + (1 * 2.00) + (1 * 0.90) = 3.20 + 2.00 + 0.90 = 6.10
    // labor_cost = (45 / 60) * 15 = 11.25
    // cost_per_unit = 6.10 + 11.25 + 0.50 = 17.85
    expect(result.cost_per_unit).toBeCloseTo(17.85)
  })

  it('handles zero sale price (no revenue, negative profit)', () => {
    const record = {
      quantity: 5,
      labor_minutes: 30,
      other_costs: 0,
      sale_price_per_unit: 0,
      material_overrides: {},
    }
    const result = computeCosts(purseType, materials, record, settings)
    expect(result.revenue).toBeCloseTo(0)
    expect(result.profit).toBeLessThan(0)
  })

  it('defaults other_costs to 0 when not provided', () => {
    const record = {
      quantity: 1,
      labor_minutes: 0,
      sale_price_per_unit: 10,
      material_overrides: {},
    }
    // Should not throw even without other_costs
    const result = computeCosts(purseType, materials, record, settings)
    // material_cost = 5.50, labor = 0, other = 0
    expect(result.cost_per_unit).toBeCloseTo(5.50)
  })

  it('handles null sale_price_per_unit (no revenue)', () => {
    const record = {
      quantity: 3,
      labor_minutes: 45,
      other_costs: 0.50,
      sale_price_per_unit: null,
      material_overrides: {},
    }
    const result = computeCosts(purseType, materials, record, settings)
    expect(result.revenue).toBeCloseTo(0)
    expect(result.cost_per_unit).toBeCloseTo(17.25)
  })
})
