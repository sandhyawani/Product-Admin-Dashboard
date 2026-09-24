"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  getProductById,
  updateProduct,
} from "../../../../services/productService";

import {
  getLocalProductById,
  getLocalMutations,
  updateLocalProduct,
} from "../../../../lib/productStorage";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id;

  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    stock: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const localProduct = getLocalProductById(id);

        if (localProduct) {
          setForm({
            title: localProduct.title || "",
            price: localProduct.price ?? "",
            category: localProduct.category || "",
            stock: localProduct.stock ?? "",
          });

          return;
        }

        const mutations = getLocalMutations();

        if (mutations.deleted?.includes(String(id))) {
          setError("Product not found.");
          return;
        }

        const data = await getProductById(
          id,
          controller.signal
        );

        const localUpdates =
          mutations.updated?.[String(id)];

        const product = localUpdates
          ? {
              ...data,
              ...localUpdates,
            }
          : data;

        setForm({
          title: product.title || "",
          price: product.price ?? "",
          category: product.category || "",
          stock: product.stock ?? "",
        });
      } catch (error) {
        if (
          error.name === "CanceledError" ||
          error.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error("Edit product error:", error);

        setError("Product not found.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      controller.abort();
    };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setError("");

    if (!form.title.trim()) {
      setError("Product title is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Category is required.");
      return;
    }

    if (
      form.price === "" ||
      Number(form.price) <= 0
    ) {
      setError("Price must be greater than 0.");
      return;
    }

    if (
      form.stock === "" ||
      Number(form.stock) < 0
    ) {
      setError("Stock cannot be negative.");
      return;
    }

    const updatedData = {
      title: form.title.trim(),
      price: Number(form.price),
      category: form.category.trim(),
      stock: Number(form.stock),
    };

    try {
      setSaving(true);

      // Local products are edited in storage only; remote products also need a
      // local copy because DummyJSON does not persist changes after refresh.
      const localProduct = getLocalProductById(id);

      if (localProduct) {
        updateLocalProduct(id, updatedData);
      } else {
        await updateProduct(id, updatedData);
        updateLocalProduct(id, updatedData);
      }

      router.push(`/products/${id}`);
    } catch (error) {
      console.error("Update product error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to update product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl bg-white p-10 text-center shadow">
            Loading product...
          </div>
        </div>
      </div>
    );
  }

  if (error && !form.title) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-2xl">
          <button
            onClick={() => router.push("/products")}
            className="mb-5 rounded-lg border bg-white px-4 py-2 hover:bg-gray-50"
          >
            ← Back to Products
          </button>

          <div className="rounded-xl bg-white p-10 text-center shadow">
            <h1 className="text-2xl font-bold text-red-500">
              Product Not Found
            </h1>

            <p className="mt-2 text-gray-500">
              Product ID {id} could not be found.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl">

        <button
          onClick={() =>
            router.push(`/products/${id}`)
          }
          className="mb-5 rounded-lg border bg-white px-4 py-2 hover:bg-gray-50"
        >
          ← Back to Product
        </button>

        <div className="rounded-xl bg-white p-6 shadow">

          <div className="mb-6">
            <p className="text-sm font-medium text-violet-600">
              PRODUCT #{id}
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Edit Product
            </h1>

            <p className="mt-2 text-gray-500">
              Update the product information below.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <div>
              <label
                htmlFor="title"
                className="mb-2 block font-medium"
              >
                Product Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter product title"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-2 block font-medium"
              >
                Category
              </label>

              <input
                id="category"
                name="category"
                type="text"
                value={form.category}
                onChange={handleChange}
                placeholder="Enter category"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label
                htmlFor="price"
                className="mb-2 block font-medium"
              >
                Price
              </label>

              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="Enter price"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label
                htmlFor="stock"
                className="mb-2 block font-medium"
              >
                Stock
              </label>

              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                placeholder="Enter stock"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div className="flex flex-col gap-3 pt-3 sm:flex-row">

              <button
                type="button"
                onClick={() =>
                  router.push(`/products/${id}`)
                }
                disabled={saving}
                className="flex-1 rounded-lg border px-4 py-3 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg  bg-violet-600 px-4 py-3 font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}