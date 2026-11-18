
"use strict";

const fs = require("fs");

function openDatabase(filePath) {
  const state = readFile(filePath);

  function readFile(target) {
    return JSON.parse(fs.readFileSync(target, "utf8"));
  }

  function writeState(nextState) {
    const temporaryPath = `${filePath}.${process.pid}.tmp`;

    try {
      fs.writeFileSync(
        temporaryPath,
        JSON.stringify(nextState, null, 2),
        "utf8"
      );

      fs.renameSync(temporaryPath, filePath);
    } catch (error) {
      if (fs.existsSync(temporaryPath)) {
        fs.rmSync(temporaryPath, { force: true });
      }
      throw error;
    }
  }

  function persist() {
    writeState(state);
  }

  function publicUser(user) {
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  function copyOrder(order) {
    return {
      ...order,
      items: (order.items || []).map((item) => ({ ...item })),
      address: { ...(order.address || {}) },
    };
  }

  return {
    listProducts() {
      return state.products.map((product) => ({ ...product }));
    },

    findProduct(productId) {
      const product = state.products.find((item) => item.id === productId);
      return product ? { ...product } : null;
    },

    updateProduct(productId, patch) {
      const product = state.products.find((item) => item.id === productId);
      if (!product) return null;

      if (patch.name !== undefined) product.name = String(patch.name).trim();
      if (patch.price !== undefined) product.price = Number(patch.price);
      if (patch.stock !== undefined) product.stock = Number(patch.stock);
      if (patch.description !== undefined) {
        product.description = String(patch.description);
      }
      if (patch.category !== undefined) {
        product.category = String(patch.category);
      }

      persist();
      return { ...product };
    },

    addProduct(product) {
      state.products.push(product);
      persist();
      return { ...product };
    },

    listCoupons() {
      return state.coupons.map((coupon) => ({ ...coupon }));
    },

    findCoupon(code) {
      const normalized = String(code || "").trim().toLowerCase();
      const coupon = state.coupons.find(
        (item) => item.code.toLowerCase() === normalized
      );
      return coupon ? { ...coupon } : null;
    },

    listUsers() {
      return state.users.map((user) => ({ ...user }));
    },

    findUserByEmail(email) {
      const normalized = String(email || "").trim().toLowerCase();
      return state.users.find((user) => user.email === normalized) || null;
    },

    findUserById(userId) {
      return state.users.find((user) => user.id === userId) || null;
    },

    addUser(user) {
      state.users.push(user);
      persist();
      return publicUser(user);
    },

    createSession(userId) {
      const { createToken } = require("../auth/credentials");

      const session = {
        token: createToken(),
        userId,
        createdAt: new Date().toISOString(),
      };

      state.sessions.push(session);
      persist();
      return session;
    },

    findSession(token) {
      return state.sessions.find((session) => session.token === token) || null;
    },

    deleteSession(token) {
      state.sessions = state.sessions.filter(
        (session) => session.token !== token
      );
      persist();
    },

    addOrder(order) {
      const nextOrders = [...state.orders, order];
      const nextState = { ...state, orders: nextOrders };

      writeState(nextState);
      state.orders = nextOrders;
    },

    completeOrder(order, stockUpdates) {
      if (!Array.isArray(stockUpdates) || stockUpdates.length === 0) {
        return {
          ok: false,
          error: "Itens de estoque inválidos.",
        };
      }

      const quantities = new Map();

      for (const update of stockUpdates) {
        const quantity = Number(update.quantity);

        if (
          !update.productId ||
          !Number.isInteger(quantity) ||
          quantity <= 0
        ) {
          return {
            ok: false,
            error: "Quantidade de estoque inválida.",
          };
        }

        quantities.set(
          update.productId,
          (quantities.get(update.productId) || 0) + quantity
        );
      }

      const nextProducts = state.products.map((product) => ({
        ...product,
      }));

      for (const [productId, quantity] of quantities) {
        const product = nextProducts.find((item) => item.id === productId);

        if (!product || Number(product.stock) < quantity) {
          return {
            ok: false,
            error: "Estoque insuficiente.",
          };
        }

        product.stock = Number(product.stock) - quantity;
      }

      const nextOrders = [...state.orders, order];

      const nextState = {
        ...state,
        products: nextProducts,
        orders: nextOrders,
      };

      writeState(nextState);

      state.products = nextProducts;
      state.orders = nextOrders;

      return { ok: true };
    },

    listOrders() {
      return state.orders.map(copyOrder);
    },

    findOrder(orderId) {
      const order = state.orders.find((item) => item.id === orderId);
      return order ? copyOrder(order) : null;
    },

    nextOrderId() {
      const ids = state.orders.map((order) => order.id);
      let max = 1000;

      for (const id of ids) {
        const value = Number(String(id).replace(/\D/g, ""));
        if (Number.isFinite(value) && value > max) {
          max = value;
        }
      }

      return `ped-${max + 1}`;
    },

    publicUser,
  };
}

module.exports = {
  openDatabase,
};
