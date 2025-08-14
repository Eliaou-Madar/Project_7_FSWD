// server/scripts/createDatabase.js
// Crée la base + tables SneakRush (schéma minimal + promotions)

import dotenv from "dotenv";
dotenv.config();

import connection from "../connection.js";

const createDatabaseAndTables = async () => {
  const rawName = process.env.DB_DATABASE || "sneakrush_db";
  const dbName = rawName.replace(/`/g, ""); // sécurise l'identifier

  // DDL (ordre -> parents avant enfants)
  const stmts = [
    // Sélection du schéma
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    `USE \`${dbName}\`;`,

    // 1) USERS
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('client','admin') NOT NULL DEFAULT 'client',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 2) PRODUCTS
    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      brand VARCHAR(100),
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      is_limited BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 3) PRODUCT IMAGES
    `CREATE TABLE IF NOT EXISTS product_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      url VARCHAR(500) NOT NULL,
      CONSTRAINT fk_pimg_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 4) PRODUCT SIZES (avec stock)
    `CREATE TABLE IF NOT EXISTS product_sizes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      size_label VARCHAR(20) NOT NULL,
      stock_qty INT NOT NULL DEFAULT 0,
      UNIQUE KEY uq_product_size (product_id, size_label),
      CONSTRAINT fk_psize_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 5) PROMOTIONS
    `CREATE TABLE IF NOT EXISTS promotions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      description VARCHAR(255),
      discount_type ENUM('percent','fixed') NOT NULL,
      discount_value DECIMAL(10,2) NOT NULL,
      start_date DATETIME,
      end_date DATETIME,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 6) CARTS
    `CREATE TABLE IF NOT EXISTS carts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 7) CART ITEMS
    `CREATE TABLE IF NOT EXISTS cart_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      cart_id INT NOT NULL,
      product_size_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      UNIQUE KEY uq_cartitem (cart_id, product_size_id),
      CONSTRAINT fk_citem_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      CONSTRAINT fk_citem_psize FOREIGN KEY (product_size_id) REFERENCES product_sizes(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 8) ORDERS
    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      promotion_id INT,
      total DECIMAL(10,2) NOT NULL,
      discount_total DECIMAL(10,2) DEFAULT 0.00,
      status ENUM('pending','paid','shipped','delivered','canceled') DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_orders_promo FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 9) ORDER ITEMS
    `CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_size_id INT NOT NULL,
      quantity INT NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      CONSTRAINT fk_oitem_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      CONSTRAINT fk_oitem_psize FOREIGN KEY (product_size_id) REFERENCES product_sizes(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    // 10) REVIEWS
    `CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      user_id INT NOT NULL,
      rating TINYINT NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_review_user_product (product_id, user_id),
      CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  ];

  try {
    for (const sql of stmts) {
      await connection.query(sql);
    }
    console.log("✅ Database & tables ready.");
  } catch (err) {
    console.error("❌ Error creating DB/tables:", err);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
};

createDatabaseAndTables();
