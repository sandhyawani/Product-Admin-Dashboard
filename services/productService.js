import api from "../lib/axios";

export const getProducts = async (
  limit,
  skip,
  sortBy,
  order,
  signal
) => {
  const params = new URLSearchParams();

  params.set("limit", limit);
  params.set("skip", skip);

  if (sortBy) {
    params.set("sortBy", sortBy);
    params.set("order", order);
  }

  const response = await api.get(
    `/products?${params.toString()}`,
    {
      signal,
    }
  );

  return response.data;
};

export const searchProducts = async (
  query,
  limit,
  skip,
  sortBy,
  order,
  signal
) => {
  const params = new URLSearchParams();

  params.set("q", query);
  params.set("limit", limit);
  params.set("skip", skip);

  if (sortBy) {
    params.set("sortBy", sortBy);
    params.set("order", order);
  }

  const response = await api.get(
    `/products/search?${params.toString()}`,
    {
      signal,
    }
  );

  return response.data;
};

export const getProductsByCategory = async (
  category,
  limit,
  skip,
  sortBy,
  order,
  signal
) => {
  const params = new URLSearchParams();

  params.set("limit", limit);
  params.set("skip", skip);

  if (sortBy) {
    params.set("sortBy", sortBy);
    params.set("order", order);
  }

  const response = await api.get(
    `/products/category/${encodeURIComponent(category)}?${params.toString()}`,
    {
      signal,
    }
  );

  return response.data;
};



export const getCategories = async (signal) => {
  const response = await api.get(
    "/products/categories",
    {
      signal,
    }
  );

  return response.data;
};

export const getProductById = async (
  id,
  signal
) => {
  const response = await api.get(
    `/products/${id}`,
    {
      signal,
    }
  );

  return response.data;
};

export const addProduct = async (product) => {
  const response = await api.post(
    "/products/add",
    product
  );

  return response.data;
};

export const updateProduct = async (
  id,
  product
) => {
  const response = await api.put(
    `/products/${id}`,
    product
  );

  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(
    `/products/${id}`
  );

  return response.data;
};