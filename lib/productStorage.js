const STORAGE_KEY = "productAdminMutations";

const emptyMutations = {
  added: [],
  updated: {},
  deleted: [],
};

// Get saved mutations from localStorage
const getStoredMutations = () => {
  if (typeof window === "undefined") {
    return emptyMutations;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return emptyMutations;
    }

    const parsed = JSON.parse(stored);

    return {
      added: parsed.added || [],
      updated: parsed.updated || {},
      deleted: parsed.deleted || [],
    };
  } catch (error) {
    console.error("Failed to read product storage:", error);

    return emptyMutations;
  }
};

// Save mutations to localStorage
const saveMutations = (mutations) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(mutations)
  );
};

// Add a new product locally
export const addLocalProduct = (product) => {
  const mutations = getStoredMutations();

  mutations.added = [
    product,
    ...mutations.added,
  ];

  saveMutations(mutations);
};

// Update an existing product locally
export const updateLocalProduct = (id, updates) => {
  const mutations = getStoredMutations();

  const productId = String(id);

  // Save the update
  mutations.updated[productId] = {
    ...(mutations.updated[productId] || {}),
    ...updates,
  };

  // If the product was added locally,
  // update that product directly too.
  const index = mutations.added.findIndex(
    (product) =>
      String(product.id) === productId
  );

  if (index !== -1) {
    mutations.added[index] = {
      ...mutations.added[index],
      ...updates,
    };
  }

  saveMutations(mutations);
};

// Delete a product locally
export const deleteLocalProduct = (id) => {
  const mutations = getStoredMutations();

  const productId = String(id);

  // Remember that this product was deleted
  mutations.deleted = [
    ...new Set([
      ...mutations.deleted,
      productId,
    ]),
  ];

  // Remove it from locally added products
  mutations.added = mutations.added.filter(
    (product) =>
      String(product.id) !== productId
  );

  // Remove any saved updates
  delete mutations.updated[productId];

  saveMutations(mutations);
};

// Get all saved mutations
export const getLocalMutations = () => {
  return getStoredMutations();
};

// Find a locally added product by ID
export const getLocalProductById = (id) => {
  const mutations = getStoredMutations();

  return (
    mutations.added.find(
      (product) =>
        String(product.id) === String(id)
    ) || null
  );
};

// Apply local edits and deletions to API products
export const applyLocalMutations = (products) => {
  const mutations = getStoredMutations();

  return products
    .filter(
      (product) =>
        !mutations.deleted.includes(
          String(product.id)
        )
    )
    .map((product) => {
      const updates =
        mutations.updated[String(product.id)];

      if (!updates) {
        return product;
      }

      return {
        ...product,
        ...updates,
      };
    });
};