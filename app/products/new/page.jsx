"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { addProduct } from "../../../services/productService";
import { addLocalProduct } from "../../../lib/productStorage";

export default function AddProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    price: "",
    category: "",
    stock: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (loading) return;

    setError("");

    // Validation
    if (!form.title.trim()) {
      setError("Product title is required.");
      return;
    }

    if (!form.category.trim()) {
      setError("Category is required.");
      return;
    }

    if (form.price === "" || Number(form.price) <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    if (form.stock === "" || Number(form.stock) < 0) {
      setError("Stock cannot be negative.");
      return;
    }

    try {
      setLoading(true);

      // Call DummyJSON API
      const result = await addProduct({
        title: form.title.trim(),
        price: Number(form.price),
        category: form.category.trim(),
        stock: Number(form.stock),
      });

      // DummyJSON does not permanently save POST requests.
      // Therefore, save the product locally as well.
      const localProduct = {
        ...result,

        title: form.title.trim(),
        price: Number(form.price),
        category: form.category.trim(),
        stock: Number(form.stock),

        // Give locally added products a unique ID
        id: `local-${Date.now()}`,

        // Default values for fields not entered in the form
        rating: 0,
        thumbnail: "",
        images: [],
      };

      addLocalProduct(localProduct);

      // Go back to product list
      router.push("/products");
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to add product."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl">

        <button
          onClick={() => router.push("/products")}
          className="mb-5 rounded-lg border bg-white px-4 py-2 transition hover:bg-gray-50"
        >
          ← Back
        </button>

        <div className="rounded-xl bg-white p-6 shadow">

          <h1 className="mb-6 text-2xl font-bold">
            Add Product
          </h1>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            <div>
              <label className="mb-1 block font-medium">
                Title
              </label>

              <input
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter product title"
                className="w-full rounded-lg border px-4 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">
                Category
              </label>

              <input
                name="category"
                type="text"
                value={form.category}
                onChange={handleChange}
                placeholder="Enter category"
                className="w-full rounded-lg border px-4 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">
                Price
              </label>

              <input
                name="price"
                type="number"
                min="0"
                value={form.price}
                onChange={handleChange}
                placeholder="Enter price"
                className="w-full rounded-lg border px-4 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <div>
              <label className="mb-1 block font-medium">
                Stock
              </label>

              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                placeholder="Enter stock"
                className="w-full rounded-lg border px-4 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg  bg-violet-600 px-4 py-3 font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Product"}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}