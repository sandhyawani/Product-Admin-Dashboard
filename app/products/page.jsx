"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  getProducts,
  searchProducts,
  getProductsByCategory,
  getCategories,
} from "../../services/productService";

import { applyLocalMutations, getLocalMutations } from "../../lib/productStorage";

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlPage = Number(searchParams.get("page"));
  const urlLimit = Number(searchParams.get("limit"));
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "";
  const urlSort = searchParams.get("sort") || "";

  const page = Number.isInteger(urlPage) && urlPage >= 1 ? urlPage : 1;
  const limit = [10, 20, 50].includes(urlLimit) ? urlLimit : 10;

  const search = urlSearch.trim();
  const category = urlCategory.trim();
  const sort = urlSort.trim();

  let sortBy = "";
  let order = "";

  switch (sort) {
    case "price-asc":
      sortBy = "price";
      order = "asc";
      break;
    case "price-desc":
      sortBy = "price";
      order = "desc";
      break;
    case "rating-asc":
      sortBy = "rating";
      order = "asc";
      break;
    case "rating-desc":
      sortBy = "rating";
      order = "desc";
      break;
    case "title-asc":
      sortBy = "title";
      order = "asc";
      break;
    case "title-desc":
      sortBy = "title";
      order = "desc";
      break;
    default:
      break;
  }

  const skip = (page - 1) * limit;

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState(search);
  const [categories, setCategories] = useState([]);
  const [categoryLoading, setCategoryLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setSearchInput(search);
    });

    return () => cancelAnimationFrame(frame);
  }, [search]);

  useEffect(() => {
    // Keep the URL query string in sync with the input field so filters stay shareable.
    const timer = setTimeout(() => {
      const trimmedSearch = searchInput.trim();

      if (trimmedSearch === search) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());

      if (trimmedSearch) {
        params.set("search", trimmedSearch);
        params.delete("category");
      } else {
        params.delete("search");
      }

      params.set("page", "1");
      router.replace(`/products?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, search, searchParams, router]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        setCategoryLoading(true);

        const data = await getCategories(controller.signal);
        const normalized = data.map((item) => {
          if (typeof item === "string") {
            return { slug: item, name: item };
          }

          return {
            slug: item.slug,
            name: item.name || item.slug,
          };
        });

        setCategories(normalized);
      } catch (categoryError) {
        if (
          categoryError.name === "CanceledError" ||
          categoryError.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error("Category error:", categoryError);
      } finally {
        if (!controller.signal.aborted) {
          setCategoryLoading(false);
        }
      }
    };

    fetchCategories();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        let data;

        if (search) {
          data = await searchProducts(search, limit, skip, sortBy, order, controller.signal);
        } else if (category) {
          data = await getProductsByCategory(category, limit, skip, sortBy, order, controller.signal);
        } else {
          data = await getProducts(limit, skip, sortBy, order, controller.signal);
        }

        const apiProducts = data.products || [];
        let finalProducts = applyLocalMutations(apiProducts);
        const mutations = getLocalMutations();

        if (page === 1) {
          const addedProducts = mutations.added || [];
          const visibleAddedProducts = addedProducts.filter((product) => {
            const matchesSearch = !search || product.title?.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = !category || product.category === category;

            return matchesSearch && matchesCategory;
          });

          finalProducts = [...visibleAddedProducts, ...finalProducts];
        }

        if (sortBy) {
          finalProducts.sort((a, b) => {
            let valueA = a[sortBy];
            let valueB = b[sortBy];

            if (sortBy === "title") {
              valueA = String(valueA || "").toLowerCase();
              valueB = String(valueB || "").toLowerCase();
            }

            if (valueA < valueB) {
              return order === "asc" ? -1 : 1;
            }

            if (valueA > valueB) {
              return order === "asc" ? 1 : -1;
            }

            return 0;
          });
        }

        setProducts(finalProducts);
        setTotal((data.total || 0) + (mutations.added?.length || 0) - (mutations.deleted?.length || 0));
      } catch (fetchError) {
        if (fetchError.name === "CanceledError" || fetchError.code === "ERR_CANCELED") {
          return;
        }

        console.error("Product error:", fetchError);
        setError("Failed to load products.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, [search, category, limit, skip, sortBy, order, page]);

  const totalPages = Math.ceil(total / limit);
  const startItem = total === 0 ? 0 : skip + 1;
  const endItem = Math.min(skip + products.length, total);

  useEffect(() => {
    if (!loading && totalPages > 0 && page > totalPages) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(totalPages));
      router.replace(`/products?${params.toString()}`);
    }
  }, [loading, page, totalPages, searchParams, router]);

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/products?${params.toString()}`);
  };

  const changeLimit = (newLimit) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(newLimit));
    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const changeCategory = (newCategory) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newCategory) {
      params.set("category", newCategory);
    } else {
      params.delete("category");
    }

    params.set("page", "1");
    params.delete("search");
    router.push(`/products?${params.toString()}`);
  };

  const changeSort = (newSort) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newSort) {
      params.set("sort", newSort);
    } else {
      params.delete("sort");
    }

    params.set("page", "1");
    router.push(`/products?${params.toString()}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Admin Dashboard</h1>
            <p className="mt-1 text-gray-500">Manage your product catalogue</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/products/new")}
              className="rounded-lg  bg-violet-600 px-4 py-2.5 font-medium text-white transition hover:bg-violet-700"
            >
              + Add Product
            </button>

            <button
              onClick={handleLogout}
              className="rounded-lg bg-red-500 px-4 py-2.5 font-medium text-white transition hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="mb-6 rounded-xl bg-white p-5 shadow">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label htmlFor="search" className="mb-2 block font-medium text-gray-700">
                Search Products
              </label>

              <input
                id="search"
                type="text"
                placeholder="Search by product name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label htmlFor="category" className="mb-2 block font-medium text-gray-700">
                Category
              </label>

              <select
                id="category"
                value={category}
                disabled={Boolean(search) || categoryLoading}
                onChange={(e) => changeCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">All Categories</option>

                {categories.map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>

              {search && (
                <p className="mt-1 text-xs text-gray-500">Clear search to use category filter.</p>
              )}
            </div>

            <div>
              <label htmlFor="sort" className="mb-2 block font-medium text-gray-700">
                Sort
              </label>

              <select
                id="sort"
                value={sort}
                onChange={(e) => changeSort(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
              >
                <option value="">Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-asc">Rating: Low to High</option>
                <option value="rating-desc">Rating: High to Low</option>
                <option value="title-asc">Title: A to Z</option>
                <option value="title-desc">Title: Z to A</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <label htmlFor="pageSize" className="mr-2 font-medium text-gray-700">
                Products per page:
              </label>

              <select
                id="pageSize"
                value={limit}
                onChange={(e) => changeLimit(Number(e.target.value))}
                className="rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <p className="text-gray-600">Showing {startItem}–{endItem} of {total}</p>
          </div>
        </section>

        {loading && (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-violet-600" />
            <p className="text-gray-600">Loading products...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <p className="mb-4 text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg  bg-violet-600 px-5 py-2.5 font-medium text-white hover:bg-violet-700"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h2 className="text-xl font-semibold">No products found</h2>
            <p className="mt-2 text-gray-500">Try changing your search or filters.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="hidden overflow-hidden rounded-xl bg-white shadow md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">Image</th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">Title</th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">Category</th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">Price</th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">Rating</th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">Stock</th>
                    <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {products.map((product) => (
                    <tr key={product.id} className="transition hover:bg-gray-50">
                      <td className="px-5 py-4">
                        {product.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="h-14 w-14 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                            No Image
                          </div>
                        )}
                      </td>

                      <td className="max-w-xs px-5 py-4">
                        <p className="font-semibold text-gray-900">{product.title}</p>
                      </td>

                      <td className="px-5 py-4 text-gray-600">{product.category}</td>
                      <td className="px-5 py-4 font-medium">₹{product.price}</td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-sm text-yellow-700">
                          ★ {product.rating ?? 0}
                        </span>
                      </td>

                      <td className="px-5 py-4">{product.stock}</td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => router.push(`/products/${product.id}`)}
                          className="rounded-lg bg-violet-50 px-3 py-2 text-sm font-medium text-violet-600 hover:bg-violet-100"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="space-y-4 md:hidden">
            {products.map((product) => (
              <div key={product.id} className="rounded-xl bg-white p-4 shadow">
                <div className="flex gap-4">
                  {product.thumbnail ? (
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="h-24 w-24 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                      No Image
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-gray-900">{product.title}</h2>
                    <p className="mt-1 text-sm text-gray-500">{product.category}</p>
                    <p className="mt-2 font-medium">₹{product.price}</p>

                    <div className="mt-2 flex gap-3 text-sm">
                      <span>★ {product.rating ?? 0}</span>
                      <span>Stock: {product.stock}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/products/${product.id}`)}
                  className="mt-4 w-full rounded-lg  bg-violet-600 px-4 py-2.5 font-medium text-white hover:bg-violet-700"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && totalPages > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => changePage(page - 1)}
              disabled={page === 1}
              className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => changePage(pageNumber)}
                className={`rounded-lg border px-3 py-2 ${
                  page === pageNumber ? " bg-violet-600 text-white" : "bg-white hover:bg-gray-100"
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              onClick={() => changePage(page + 1)}
              disabled={page === totalPages}
              className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 p-6">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-xl bg-white p-10 text-center shadow">Loading products...</div>
          </div>
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
