import { and, count, desc, sql as drizzleSql, eq } from "drizzle-orm";
import * as XLSX from "xlsx";
import { cartItems, carts, contacts, imports } from "../db/schema";
import { db, sql as dbClient } from "./db";

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);

const storefrontData = {
  hero: {
    eyebrow: "Equipped for the deluge",
    title: "Snorkels matte black para lluvia, barro y rutas frías del sur.",
    body: "La tienda ahora toma una dirección más Carretera Austral: bosque húmedo, agua, barro y equipamiento serio de aluminio traído de Australia para builds 4x4 que sí salen a terreno.",
    primaryCta: {
      label: "Explorar catálogo",
      href: "#productos",
    },
    secondaryCta: {
      label: "Ruta de los Parques",
      href: "#ruta",
    },
  },
  weatherBanner: {
    eyebrow: "Clima táctico",
    title: "¿Llueve en tu zona?",
    body: "Revisa sellos, abrazaderas y entrada alta antes de salir. El sur no perdona admisiones mal montadas.",
  },
  highlights: [
    {
      label: "Origen",
      value: "Australia",
      detail:
        "Series fabricadas en aluminio y terminadas en negro matte texturado.",
    },
    {
      label: "Montaje",
      value: "Bolt-on",
      detail: "Modelos preparados para Hilux, Land Cruiser, Ranger y Jimny.",
    },
    {
      label: "Proteccion",
      value: "4x4 real",
      detail: "Pensados para polvo, barro, lluvia fuerte y cruces de agua.",
    },
  ],
  products: [
    {
      id: "land-cruiser-79",
      name: "Snorkel 79 Series",
      category: "Fitment Land Cruiser 76/79",
      description:
        "Snorkel de aluminio 4 mm con uniones TIG, toma de aire elevada y acabado matte black para barro, polvo y agua.",
      price: 689900,
      compareAt: 759900,
      badge: "Best seller",
      delivery: "Despacho 24 horas",
      accent: "overland",
      features: ["Aluminio 4 mm", "Australia spec", "Incluye kit de montaje"],
      mudScore: 5,
    },
    {
      id: "hilux-blackline",
      name: "Snorkel Hilux Blackline",
      category: "Fitment Hilux Revo",
      description:
        "Admisión alta de perfil limpio en aluminio matte black, con caudal estable y presencia más técnica que ornamental.",
      price: 629900,
      compareAt: 699900,
      badge: "Nuevo ingreso",
      delivery: "Retiro o 24 horas",
      accent: "ridge",
      features: ["Negro texturado", "Template incluido", "Sello high-flow"],
      mudScore: 4,
    },
    {
      id: "ranger-raid",
      name: "Snorkel Ranger AU",
      category: "Fitment Ford Ranger",
      description:
        "Cabezal de alto flujo, cuerpo reforzado y admisión elevada pensada para lluvia fuerte, cruces y ripio húmedo.",
      price: 659900,
      compareAt: 729900,
      badge: "Top rating",
      delivery: "48 horas",
      accent: "crossing",
      features: ["Canal alto", "Brackets inox", "Powder coat matte"],
      mudScore: 5,
    },
    {
      id: "jimny-convoy",
      name: "Snorkel Jimny Compact",
      category: "Fitment Suzuki Jimny",
      description:
        "Versión compacta de aluminio para builds livianos con respiración segura arriba del guardafango y look sobrio.",
      price: 549900,
      compareAt: 609900,
      badge: "Stock corto",
      delivery: "48 horas",
      accent: "convoy",
      features: ["Compact fit", "Mate formal", "Hecho para arena y barro"],
      mudScore: 4,
    },
  ],
  routeCollection: [
    {
      title: "Ruta de los Parques",
      body: "Selección pensada para lluvia fría, barro profundo y carretera rota entre bosque y fiordo.",
      label: "Colección sur",
    },
    {
      title: "Cruces de agua",
      body: "Snorkels, sellos, abrazaderas inox y piezas que reducen el riesgo cuando el nivel sube.",
      label: "Wet gear",
    },
    {
      title: "Invierno largo",
      body: "Componentes de look sobrio y desempeño real para builds que trabajan todo el año.",
      label: "Cold ready",
    },
  ],
  tortureTests: [
    {
      title: "Water blast",
      metric: "12 min",
      detail: "Boquilla de agua directa sobre unión superior y abrazaderas.",
    },
    {
      title: "Mud intake",
      metric: "3 rutas",
      detail: "Polvo fino, barro húmedo y vibración sostenida sobre ripio.",
    },
    {
      title: "Cold cycle",
      metric: "-4°C",
      detail: "Ciclo de frío y condensación para revisar expansión y sellado.",
    },
  ],
  gallery: [
    {
      name: "Hilux en Puyuhuapi",
      detail:
        "Lluvia horizontal, barro y neblina cerrada a la salida del bosque.",
    },
    {
      name: "79 Series en Baker",
      detail: "Cruce corto con salida a ripio húmedo y viento helado.",
    },
    {
      name: "Jimny en Futaleufú",
      detail: "Setup liviano, bosque denso y ruta rota bajo lluvia fina.",
    },
  ],
  soundscapes: ["Rain on roof", "Idle in woods", "Wind over gravel"],
  merchandising: [
    {
      title: "Mood de sur austral",
      body: "Paleta oscura, tonos bosque y ritmo más lento para diferenciarse del off-road desértico.",
    },
    {
      title: "Bento layout modular",
      body: "La home mezcla producto, colección, comunidad y pruebas sin sentirse como landing genérica.",
    },
    {
      title: "Confianza técnica",
      body: "Mud meter, torture tests y señales de uso real antes de empujar checkout.",
    },
  ],
  deliveryZones: [
    {
      zone: "Santo Domingo",
      eta: "Hoy 18:00 - 22:00",
      cutoff: "Cierre 14:00",
      note: "Instalaciones locales y despacho coordinado para salida el mismo dia.",
    },
    {
      zone: "San Antonio",
      eta: "Mañana AM",
      cutoff: "Cierre 16:00",
      note: "Ventana corta para pickups y talleres que necesitan mover camioneta rapido.",
    },
    {
      zone: "RM y V region",
      eta: "24 a 48 horas",
      cutoff: "Cierre 13:00",
      note: "Salida a regiones para kits completos, cabezal y accesorios de montaje.",
    },
  ],
  testimonials: [
    {
      name: "Catalina Rojas",
      role: "Land Cruiser 79",
      quote:
        "El snorkel llego con acabado impecable, se ve serio y no parece plastico barato. En barro y polvo anda perfecto.",
    },
    {
      name: "Javier Morales",
      role: "Hilux overland build",
      quote:
        "Lo que convencio fue ver el producto montado en terreno y tener claros los tiempos de entrega antes de pagar.",
    },
  ],
};

type StorefrontProduct = (typeof storefrontData.products)[number];

const productCatalog = new Map<string, StorefrontProduct>(
  storefrontData.products.map((product) => [product.id, product]),
);

const ensureCommerceSchema = async () => {
  await dbClient`
    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      cart_token VARCHAR(64) NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await dbClient`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      cart_id INTEGER NOT NULL REFERENCES carts (id) ON DELETE CASCADE,
      product_id VARCHAR(64) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (cart_id, product_id)
    )
  `;
  await dbClient`
    CREATE INDEX IF NOT EXISTS cart_items_cart_idx ON cart_items (cart_id)
  `;
  await dbClient`
    CREATE INDEX IF NOT EXISTS cart_items_product_idx ON cart_items (product_id)
  `;
};

const normalizeCartToken = (value: unknown) =>
  typeof value === "string" ? value.trim().slice(0, 64) : "";

const parseBody = async <T>(request: Request): Promise<T | null> => {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
};

const ensureCartRecord = async (cartToken: string) => {
  const [existingCart] = await db
    .select()
    .from(carts)
    .where(eq(carts.cartToken, cartToken))
    .limit(1);

  if (existingCart) {
    return existingCart;
  }

  const [createdCart] = await db
    .insert(carts)
    .values({
      cartToken,
      updatedAt: new Date(),
    })
    .returning();

  return createdCart;
};

const getCartRecord = async (cartToken: string) => {
  const [cart] = await db
    .select()
    .from(carts)
    .where(eq(carts.cartToken, cartToken))
    .limit(1);

  return cart ?? null;
};

const buildCartPayload = async (cartToken: string) => {
  const cart = await getCartRecord(cartToken);

  if (!cart) {
    return {
      cartToken,
      itemCount: 0,
      subtotal: 0,
      compareAt: 0,
      savings: 0,
      items: [],
    };
  }

  const rows = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.cartId, cart.id))
    .orderBy(desc(cartItems.updatedAt));

  const items = rows.flatMap((row) => {
    const product = productCatalog.get(row.productId);

    if (!product) {
      return [];
    }

    return [
      {
        productId: row.productId,
        quantity: row.quantity,
        lineTotal: product.price * row.quantity,
        lineCompareAt: product.compareAt * row.quantity,
        product,
      },
    ];
  });

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const compareAt = items.reduce((sum, item) => sum + item.lineCompareAt, 0);

  return {
    cartToken,
    itemCount,
    subtotal,
    compareAt,
    savings: compareAt - subtotal,
    items,
  };
};

const json = (data: unknown, init?: ResponseInit) =>
  Response.json(data, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    ...init,
  });

const workbookTemplate = () => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet([
    {
      full_name: "Alex Martinez",
      email: "alex@acme.io",
      company: "Acme",
      status: "qualified",
    },
    {
      full_name: "Sam Rivera",
      email: "sam@northwind.dev",
      company: "Northwind",
      status: "new",
    },
  ]);

  XLSX.utils.book_append_sheet(workbook, worksheet, "contacts");

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });
};

await ensureCommerceSchema();

Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        },
      });
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({
        status: "ok",
        service: "snorquel-api",
        timestamp: new Date().toISOString(),
      });
    }

    if (request.method === "GET" && url.pathname === "/api/storefront") {
      return json(storefrontData);
    }

    if (request.method === "GET" && url.pathname === "/api/cart") {
      const cartToken = normalizeCartToken(url.searchParams.get("cartToken"));

      if (!cartToken) {
        return json({ error: "Missing cartToken" }, { status: 400 });
      }

      return json(await buildCartPayload(cartToken));
    }

    if (request.method === "POST" && url.pathname === "/api/cart/items") {
      const body = await parseBody<{
        cartToken?: string;
        productId?: string;
        quantityDelta?: number;
      }>(request);
      const cartToken = normalizeCartToken(body?.cartToken);
      const productId = body?.productId?.trim();
      const quantityDelta = Math.max(1, Math.trunc(body?.quantityDelta ?? 1));

      if (!cartToken || !productId || !productCatalog.has(productId)) {
        return json({ error: "Invalid cart item payload" }, { status: 400 });
      }

      const cart = await ensureCartRecord(cartToken);
      await db
        .insert(cartItems)
        .values({
          cartId: cart.id,
          productId,
          quantity: quantityDelta,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          set: {
            quantity: drizzleSql`${cartItems.quantity} + ${quantityDelta}`,
            updatedAt: new Date(),
          },
          target: [cartItems.cartId, cartItems.productId],
        });

      await db
        .update(carts)
        .set({ updatedAt: new Date() })
        .where(eq(carts.id, cart.id));

      return json(await buildCartPayload(cartToken));
    }

    if (request.method === "POST" && url.pathname === "/api/cart/items/set") {
      const body = await parseBody<{
        cartToken?: string;
        productId?: string;
        quantity?: number;
      }>(request);
      const cartToken = normalizeCartToken(body?.cartToken);
      const productId = body?.productId?.trim();
      const quantity = Math.max(0, Math.trunc(body?.quantity ?? 0));

      if (!cartToken || !productId || !productCatalog.has(productId)) {
        return json({ error: "Invalid cart set payload" }, { status: 400 });
      }

      const cart = await ensureCartRecord(cartToken);
      if (quantity <= 0) {
        await db
          .delete(cartItems)
          .where(
            and(
              eq(cartItems.cartId, cart.id),
              eq(cartItems.productId, productId),
            ),
          );
      } else {
        await db
          .insert(cartItems)
          .values({
            cartId: cart.id,
            productId,
            quantity,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            set: {
              quantity,
              updatedAt: new Date(),
            },
            target: [cartItems.cartId, cartItems.productId],
          });
      }

      await db
        .update(carts)
        .set({ updatedAt: new Date() })
        .where(eq(carts.id, cart.id));

      return json(await buildCartPayload(cartToken));
    }

    if (
      request.method === "POST" &&
      url.pathname === "/api/cart/items/remove"
    ) {
      const body = await parseBody<{
        cartToken?: string;
        productId?: string;
      }>(request);
      const cartToken = normalizeCartToken(body?.cartToken);
      const productId = body?.productId?.trim();

      if (!cartToken || !productId) {
        return json({ error: "Invalid cart remove payload" }, { status: 400 });
      }

      const cart = await ensureCartRecord(cartToken);
      await db
        .delete(cartItems)
        .where(
          and(
            eq(cartItems.cartId, cart.id),
            eq(cartItems.productId, productId),
          ),
        );
      await db
        .update(carts)
        .set({ updatedAt: new Date() })
        .where(eq(carts.id, cart.id));

      return json(await buildCartPayload(cartToken));
    }

    if (request.method === "POST" && url.pathname === "/api/cart/clear") {
      const body = await parseBody<{
        cartToken?: string;
      }>(request);
      const cartToken = normalizeCartToken(body?.cartToken);

      if (!cartToken) {
        return json({ error: "Invalid cart clear payload" }, { status: 400 });
      }

      const cart = await ensureCartRecord(cartToken);
      await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      await db
        .update(carts)
        .set({ updatedAt: new Date() })
        .where(eq(carts.id, cart.id));

      return json(await buildCartPayload(cartToken));
    }

    if (request.method === "GET" && url.pathname === "/api/dashboard") {
      const [{ total: contactCount }] = await db
        .select({ total: count() })
        .from(contacts);
      const [{ total: importCount }] = await db
        .select({ total: count() })
        .from(imports);
      const [lastImport] = await db
        .select()
        .from(imports)
        .orderBy(desc(imports.importedAt))
        .limit(1);

      return json({
        metrics: {
          contacts: contactCount,
          imports: importCount,
        },
        lastImport,
      });
    }

    if (request.method === "GET" && url.pathname === "/api/contacts") {
      const rows = await db
        .select()
        .from(contacts)
        .orderBy(desc(contacts.createdAt))
        .limit(12);

      return json(rows);
    }

    if (request.method === "GET" && url.pathname === "/api/imports") {
      const rows = await db
        .select()
        .from(imports)
        .orderBy(desc(imports.importedAt))
        .limit(10);

      return json(rows);
    }

    if (request.method === "GET" && url.pathname === "/api/imports/template") {
      return new Response(workbookTemplate(), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition":
            'attachment; filename="contacts-template.xlsx"',
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return json(
      {
        error: "Not found",
      },
      { status: 404 },
    );
  },
});

console.log(`API listening on http://localhost:${port}`);
