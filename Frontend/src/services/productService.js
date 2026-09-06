import api from './api';

/**
 * List products with optional search, category, product type filter, and pagination.
 * @param {{ search?: string, category_id?: number, product_type?: string, skip?: number, limit?: number }} params
 * @returns {Promise<Array>} array of ProductResponse objects
 */
export async function getProducts({
  search,
  category_id,
  product_type,
  skip = 0,
  limit = 100,
} = {}) {
  const params = { skip, limit };
  if (search) params.search = search;
  if (category_id) params.category_id = category_id;
  if (product_type) params.product_type = product_type;

  const response = await api.get('/products', { params });
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * Get a single product by ID.
 * @param {number|string} productId
 * @returns {Promise<Object>} ProductResponse object
 */
export async function getProduct(productId) {
  const response = await api.get(`/products/${productId}`);
  return response.data;
}

/**
 * Get all product categories.
 * @returns {Promise<Array>} array of category objects
 */
export async function getProductCategories() {
  const response = await api.get('/products/categories');
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

/**
 * Create a new product.
 * @param {Object} payload { name, category_id, base_price, cost_price, product_type, description }
 * @returns {Promise<Object>} Created product response
 */
export async function createProduct(payload) {
  const response = await api.post('/products', payload);
  return response.data;
}

/**
 * Update an existing product by ID via PATCH /products/{product_id}.
 * @param {number|string} productId
 * @param {Object} payload Partial product fields to update
 * @returns {Promise<Object>} Updated product response
 */
export async function updateProduct(productId, payload) {
  const response = await api.patch(`/products/${productId}`, payload);
  return response.data;
}

/**
 * Delete a product by ID via DELETE /products/{product_id}.
 * @param {number|string} productId
 * @returns {Promise<Object>} Deletion detail message
 */
export async function deleteProduct(productId) {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
}

const productService = {
  getProducts,
  getProduct,
  getProductCategories,
  createProduct,
  updateProduct,
  deleteProduct,
};

export default productService;
