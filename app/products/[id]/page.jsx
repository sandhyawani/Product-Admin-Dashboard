"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  getProductById,
  deleteProduct,
} from "../../../services/productService";

import {
  getLocalProductById,
  getLocalMutations,
  deleteLocalProduct,
} from "../../../lib/productStorage";

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id;

  const [product, setProduct] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Protect the page from unauthenticated access.
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

        // Prefer local records so recently created or edited items stay visible
        // even when the API does not persist mutations.
        const localProduct =
          getLocalProductById(id);

        if (localProduct) {
          setProduct(localProduct);
          return;
        }

        const mutations =
          getLocalMutations();

        if (
          mutations.deleted?.includes(
            String(id)
          )
        ) {
          setError("Product not found.");
          return;
        }

        const data = await getProductById(
          id,
          controller.signal
        );

        const localUpdates =
          mutations.updated?.[String(id)];

        if (localUpdates) {
          setProduct({
            ...data,
            ...localUpdates,
          });
        } else {
          setProduct(data);
        }
      } catch (error) {
        if (
          error.name === "CanceledError" ||
          error.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error(
          "Product details error:",
          error
        );

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

  const handleDelete = async () => {
    if (deleting) return;

    try {
      setDeleting(true);
      setError("");

      const localProduct =
        getLocalProductById(id);

      // DummyJSON deletes are not persistent, so keep the UI state in sync with
      // a local soft-delete record as well.
      if (!localProduct) {
        await deleteProduct(id);
      }

      deleteLocalProduct(id);

      // Go back to product list
      router.push("/products");
    } catch (error) {
      console.error(
        "Delete product error:",
        error
      );

      setError(
        "Failed to delete product. Please try again."
      );

      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-xl bg-white p-10 text-center shadow">
            Loading product...
          </div>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-6xl">

          <button
            onClick={() =>
              router.push("/products")
            }
            className="mb-5 rounded-lg border bg-white px-4 py-2 hover:bg-gray-50"
          >
            ← Back to Products
          </button>

          <div className="rounded-xl bg-white p-10 text-center shadow">

            <h1 className="text-2xl font-bold text-red-500">
              Product Not Found
            </h1>

            <p className="mt-2 text-gray-500">
              We could not find product ID {id}.
            </p>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      <div className="mx-auto max-w-6xl">

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <button
            onClick={() =>
              router.push("/products")
            }
            className="w-fit rounded-lg border bg-white px-4 py-2 hover:bg-gray-50"
          >
            ← Back to Products
          </button>

          <div className="flex gap-3">

            <button
              onClick={() =>
                router.push(
                  `/products/${id}/edit`
                )
              }
              className="rounded-lg  bg-violet-600 px-5 py-2 font-medium text-white hover:bg-violet-700"
            >
              Edit Product
            </button>

            <button
              onClick={() =>
                setShowDeleteModal(true)
              }
              className="rounded-lg bg-red-500 px-5 py-2 font-medium text-white hover:bg-red-600"
            >
              Delete
            </button>

          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        <div className="rounded-xl bg-white p-6 shadow">

          <div className="grid gap-8 md:grid-cols-2">
            <div>

              <div className="flex h-96 items-center justify-center overflow-hidden rounded-xl bg-gray-100">

                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400">
                    No Image Available
                  </div>
                )}

              </div>

              {product.images &&
                product.images.length > 0 && (

                  <div className="mt-4 grid grid-cols-4 gap-3">

                    {product.images
                      .slice(0, 4)
                      .map(
                        (image, index) => (

                          <div
                            key={index}
                            className="rounded-lg bg-gray-100 p-2"
                          >

                            <img
                              src={image}
                              alt={`${product.title} ${index + 1}`}
                              className="h-20 w-full object-contain"
                            />

                          </div>

                        )
                      )}

                  </div>
                )}

            </div>

            <div>

              <p className="text-sm font-semibold uppercase text-violet-600">
                {product.category}
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                {product.title}
              </h1>

              <p className="mt-4 leading-7 text-gray-600">
                {product.description ||
                  "No description available for this product."}
              </p>

              <div className="mt-6">

                <span className="text-3xl font-bold">
                  ₹{product.price}
                </span>

                {product.discountPercentage && (
                  <span className="ml-3 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                    {product.discountPercentage}% OFF
                  </span>
                )}

              </div>

              <div className="mt-5 flex items-center gap-3">

                <span className="text-xl text-yellow-500">
                  ★
                </span>

                <span className="font-semibold">
                  {product.rating ?? 0}
                </span>

                <span className="text-gray-500">
                  Rating
                </span>

              </div>

              <div className="mt-4">

                <span className="font-medium">
                  Stock:
                </span>{" "}

                <span
                  className={
                    product.stock > 0
                      ? "font-semibold text-green-600"
                      : "font-semibold text-red-600"
                  }
                >
                  {product.stock}
                </span>

              </div>

              {product.brand && (
                <p className="mt-3">
                  <span className="font-medium">
                    Brand:
                  </span>{" "}
                  {product.brand}
                </p>
              )}

              {product.sku && (
                <p className="mt-2">
                  <span className="font-medium">
                    SKU:
                  </span>{" "}
                  {product.sku}
                </p>
              )}

              {product.availabilityStatus && (
                <p className="mt-2">
                  <span className="font-medium">
                    Availability:
                  </span>{" "}
                  {product.availabilityStatus}
                </p>
              )}

            </div>

          </div>

          <div className="mt-10 border-t pt-8">

            <h2 className="mb-5 text-2xl font-bold">
              Reviews
            </h2>

            {!product.reviews ||
            product.reviews.length === 0 ? (
              <p className="text-gray-500">
                No reviews available.
              </p>
            ) : (
              <div className="space-y-4">

                {product.reviews.map(
                  (review, index) => (

                    <div
                      key={index}
                      className="rounded-lg border p-4"
                    >

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                        <h3 className="font-semibold">
                          {review.reviewerName}
                        </h3>

                        <span className="text-yellow-500">
                          ★ {review.rating}
                        </span>

                      </div>

                      <p className="mt-2 text-gray-600">
                        {review.comment}
                      </p>

                      {review.date && (
                        <p className="mt-2 text-xs text-gray-400">
                          {new Date(
                            review.date
                          ).toLocaleDateString()}
                        </p>
                      )}

                    </div>

                  )
                )}

              </div>
            )}

          </div>

        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-xl">
              ⚠
            </div>

            <h2 className="text-xl font-bold">
              Delete Product?
            </h2>

            <p className="mt-2 text-gray-600">
              Are you sure you want to delete{" "}
              <strong>{product.title}</strong>?
              This action cannot be undone.
            </p>

            <div className="mt-6 flex gap-3">

              <button
                onClick={() =>
                  setShowDeleteModal(false)
                }
                disabled={deleting}
                className="flex-1 rounded-lg border px-4 py-3 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-500 px-4 py-3 font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}