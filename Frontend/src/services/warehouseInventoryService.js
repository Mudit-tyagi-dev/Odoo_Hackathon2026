import api from './api';

/**
 * List all warehouse stock records from the backend.
 * Endpoint: GET /warehouse-inventory
 * @returns {Promise<Array<{ warehouse_id: number, product_id: number, quantity: number, warehouse_name?: string, product_name?: string }>>}
 */
export async function getWarehouseStocks() {
  const response = await api.get('/warehouse-inventory');
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get a specific warehouse stock record by primary key (warehouse_id, product_id).
 * Endpoint: GET /warehouse-inventory/{warehouse_id}/{product_id}
 * @param {number|string} warehouseId
 * @param {number|string} productId
 * @returns {Promise<{ warehouse_id: number, product_id: number, quantity: number, warehouse_name?: string, product_name?: string }>}
 */
export async function getWarehouseStock(warehouseId, productId) {
  const response = await api.get(`/warehouse-inventory/${warehouseId}/${productId}`);
  return response.data;
}

/**
 * Get all inventory records specifically for a warehouse ID.
 * Uses real backend data from GET /warehouse-inventory.
 * @param {number|string} warehouseId
 * @returns {Promise<Array<{ warehouse_id: number, product_id: number, quantity: number, warehouse_name?: string, product_name?: string }>>}
 */
export async function getInventoryForWarehouse(warehouseId) {
  const allStocks = await getWarehouseStocks();
  const idNum = Number(warehouseId);
  return allStocks.filter((stock) => stock.warehouse_id === idNum);
}

/**
 * Upsert stock quantity for a warehouse and product.
 * Endpoint: POST /warehouse-inventory
 * Body MUST be exactly:
 * {
 *   "warehouse_id": number,
 *   "product_id": number,
 *   "quantity": number
 * }
 * If combination already exists, backend updates quantity; otherwise inserts new record.
 *
 * @param {{ warehouse_id: number, product_id: number, quantity: number }} data
 * @returns {Promise<{ warehouse_id: number, product_id: number, quantity: number, warehouse_name?: string, product_name?: string }>}
 */
export async function upsertWarehouseStock(data) {
  const payload = {
    warehouse_id: Number(data.warehouse_id),
    product_id: Number(data.product_id),
    quantity: Number(data.quantity),
  };

  const response = await api.post('/warehouse-inventory', payload);
  return response.data;
}

/**
 * Parse FastAPI 422 validation errors into a field -> message mapping.
 * @param {any} error - Axios error object
 * @returns {{ [field: string]: string }}
 */
export function parseInventoryValidationError(error) {
  const detail = error?.response?.data?.detail;
  if (!Array.isArray(detail)) return {};
  const fieldErrors = {};
  detail.forEach((item) => {
    const field = item.loc?.[item.loc.length - 1];
    if (field) fieldErrors[field] = item.msg;
  });
  return fieldErrors;
}

const warehouseInventoryService = {
  getWarehouseStocks,
  getWarehouseStock,
  getInventoryForWarehouse,
  upsertWarehouseStock,
  parseInventoryValidationError,
};

export default warehouseInventoryService;
