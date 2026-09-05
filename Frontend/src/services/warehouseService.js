
import api from './api';
import { parseApiError } from '../utils/errorHandler';

/**
 * List all warehouses with pagination.
 * @param {number} skip  - offset (default 0)
 * @param {number} limit - page size, 1–100 (default 20)
 * @returns {Promise<Array>} array of WarehouseResponse objects
 */
export async function getWarehouses({ skip = 0, limit = 20 } = {}) {
  const response = await api.get('/warehouses', {
    params: { skip, limit },
  });
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get a single warehouse by ID.
 * @param {number|string} id - warehouse ID
 * @returns {Promise<Object>} WarehouseResponse object
 */
export async function getWarehouse(id) {
  const response = await api.get(`/warehouses/${id}`);
  return response.data;
}

/**
 * Create a new warehouse.
 * Only sends supported backend fields: name, address, max_q.
 * @param {{ name: string, address?: string, max_q?: number }} data
 * @returns {Promise<Object>} created WarehouseResponse
 */
export async function createWarehouse(data) {
  const payload = { name: data.name };
  if (data.address !== undefined && data.address !== '') {
    payload.address = data.address;
  }
  if (data.max_q !== undefined && data.max_q !== '') {
    payload.max_q = Number(data.max_q);
  }
  const response = await api.post('/warehouses', payload);
  return response.data;
}

/**
 * Partially update a warehouse.
 * Only sends fields that are provided (undefined fields are omitted).
 * @param {number|string} id
 * @param {{ name?: string, address?: string, max_q?: number }} data
 * @returns {Promise<Object>} updated WarehouseResponse
 */
export async function updateWarehouse(id, data) {
  const payload = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.address !== undefined) payload.address = data.address;
  if (data.max_q !== undefined) payload.max_q = Number(data.max_q);
  const response = await api.patch(`/warehouses/${id}`, payload);
  return response.data;
}

/**
 * Frontend-only capacity calculations (never sent to the backend).
 * @param {{ max_q: number, total_quantity: number }} warehouse
 * @returns {{ utilization: number, available: number, utilizationPct: string }}
 */
export function calcCapacity(warehouse) {
  const maxQ = warehouse?.max_qty ?? warehouse?.max_q ?? 0;
  const current = warehouse?.total_quantity ?? 0;
  const utilization = maxQ > 0 ? (current / maxQ) * 100 : 0;
  const available = maxQ - current;
  return {
    utilization,                              // 0–100 (float)
    utilizationPct: utilization.toFixed(1) + '%',
    available: Math.max(0, available),
  };
}

/**
 * Parse a FastAPI 422 validation error detail array into field-level messages.
 * @param {any} error - axios error object
 * @returns {{ [field]: string }} map of field → message
 */
export function parseWarehouseValidationError(error) {
  const detail = error?.response?.data?.detail;
  if (!Array.isArray(detail)) return {};
  const fieldErrors = {};
  detail.forEach((item) => {
    const field = item.loc?.[item.loc.length - 1];
    if (field) fieldErrors[field] = item.msg;
  });
  return fieldErrors;
}

const warehouseService = {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  calcCapacity,
  parseWarehouseValidationError,
};

export default warehouseService;
