import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const imports = pgTable(
  "imports",
  {
    id: serial("id").primaryKey(),
    filename: varchar("filename", { length: 255 }).notNull(),
    source: varchar("source", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("processed"),
    totalRows: integer("total_rows").notNull().default(0),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    notes: text("notes"),
  },
  (table) => ({
    sourceIdx: index("imports_source_idx").on(table.source),
  }),
);

export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey(),
    importId: integer("import_id").references(() => imports.id, {
      onDelete: "set null",
    }),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    company: varchar("company", { length: 160 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    companyIdx: index("contacts_company_idx").on(table.company),
    statusIdx: index("contacts_status_idx").on(table.status),
  }),
);

export const carts = pgTable(
  "carts",
  {
    id: serial("id").primaryKey(),
    cartToken: varchar("cart_token", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    cartTokenIdx: uniqueIndex("carts_cart_token_idx").on(table.cartToken),
  }),
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: serial("id").primaryKey(),
    cartId: integer("cart_id")
      .notNull()
      .references(() => carts.id, {
        onDelete: "cascade",
      }),
    productId: varchar("product_id", { length: 64 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    cartIdx: index("cart_items_cart_idx").on(table.cartId),
    productIdx: index("cart_items_product_idx").on(table.productId),
    cartProductIdx: uniqueIndex("cart_items_cart_product_idx").on(
      table.cartId,
      table.productId,
    ),
  }),
);

export type ImportRecord = typeof imports.$inferSelect;
export type ContactRecord = typeof contacts.$inferSelect;
export type CartRecord = typeof carts.$inferSelect;
export type CartItemRecord = typeof cartItems.$inferSelect;
