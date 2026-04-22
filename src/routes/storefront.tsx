import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  startTransition,
  useEffect,
  useRef,
  useState,
} from "react";
import referenceSnorkelCloseup from "../assets/photos/reference-snorkel-closeup.png";
import referenceSnorkelCrossing from "../assets/photos/reference-snorkel-crossing.png";
import referenceSnorkelGreenJeep from "../assets/photos/reference-snorkel-green-jeep.png";
import referenceSnorkelMud from "../assets/photos/reference-snorkel-mud.png";
import referenceSnorkelProfile from "../assets/photos/reference-snorkel-profile.png";
import referenceSnorkelWhiteJeep from "../assets/photos/reference-snorkel-white-jeep.png";

type Product = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  compareAt: number;
  badge: string;
  delivery: string;
  accent: string;
  features: string[];
  mudScore: number;
};

type Highlight = {
  label: string;
  value: string;
  detail: string;
};

type DeliveryZone = {
  zone: string;
  eta: string;
  cutoff: string;
  note: string;
};

type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

type MerchandisingPoint = {
  title: string;
  body: string;
};

type FitmentFrame = {
  title: string;
  body: string;
  detail: string;
  image: string;
  alt: string;
  variant: string;
};

type WeatherBanner = {
  eyebrow: string;
  title: string;
  body: string;
};

type RouteCard = {
  title: string;
  body: string;
  label: string;
};

type TortureTest = {
  title: string;
  metric: string;
  detail: string;
};

type GalleryEntry = {
  name: string;
  detail: string;
};

type StorefrontResponse = {
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: {
      label: string;
      href: string;
    };
    secondaryCta: {
      label: string;
      href: string;
    };
  };
  weatherBanner: WeatherBanner;
  highlights: Highlight[];
  products: Product[];
  routeCollection: RouteCard[];
  tortureTests: TortureTest[];
  gallery: GalleryEntry[];
  soundscapes: string[];
  merchandising: MerchandisingPoint[];
  deliveryZones: DeliveryZone[];
  testimonials: Testimonial[];
};

type CartItem = {
  lineCompareAt: number;
  lineTotal: number;
  product: Product;
  productId: string;
  quantity: number;
};

type CartResponse = {
  cartToken: string;
  itemCount: number;
  subtotal: number;
  compareAt: number;
  savings: number;
  items: CartItem[];
};

type SavedList = {
  id: string;
  name: string;
  productIds: string[];
};

const CART_TOKEN_STORAGE_KEY = "snorquel.cart-token";
const FAVORITES_STORAGE_KEY = "snorquel.favorites";
const LISTS_STORAGE_KEY = "snorquel.saved-lists";

const readStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const storedValue = window.localStorage.getItem(key);

    return storedValue ? (JSON.parse(storedValue) as T) : fallback;
  } catch {
    return fallback;
  }
};

const createCartToken = () => {
  if (typeof window === "undefined") {
    return "snorquel-server-cart";
  }

  return window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `cart-${Date.now()}`;
};

const EMPTY_CART = (cartToken: string): CartResponse => ({
  cartToken,
  itemCount: 0,
  subtotal: 0,
  compareAt: 0,
  savings: 0,
  items: [],
});

const resolveApiTargets = (path: string) => {
  if (typeof window === "undefined") {
    return [path];
  }

  const explicitBase = import.meta.env.VITE_API_BASE_URL?.trim();
  const directLocalBase = `${window.location.protocol}//localhost:3001`;

  return Array.from(
    new Set(
      [
        path,
        explicitBase ? `${explicitBase}${path}` : null,
        `${directLocalBase}${path}`,
      ].filter((value): value is string => Boolean(value)),
    ),
  );
};

const fetchWithTimeout = async (input: string, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 2400);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const fetchJson = async <T,>(path: string): Promise<T> => {
  let lastError: unknown;

  for (const target of resolveApiTargets(path)) {
    try {
      const response = await fetchWithTimeout(target);

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Request failed");
};

const requestJson = async <T,>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  let lastError: unknown;

  for (const target of resolveApiTargets(path)) {
    try {
      const response = await fetchWithTimeout(target, {
        headers: {
          "Content-Type": "application/json",
        },
        ...init,
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Request failed");
};

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const accentClass: Record<string, string> = {
  overland: "product-card__media product-card__media--overland",
  ridge: "product-card__media product-card__media--ridge",
  crossing: "product-card__media product-card__media--crossing",
  convoy: "product-card__media product-card__media--convoy",
};

const productArtwork: Record<string, string> = {
  "land-cruiser-79": referenceSnorkelCrossing,
  "hilux-blackline": referenceSnorkelWhiteJeep,
  "ranger-raid": referenceSnorkelProfile,
  "jimny-convoy": referenceSnorkelGreenJeep,
};

const productImageClass: Record<string, string> = {
  "land-cruiser-79": "product-card__image product-card__image--land-cruiser",
  "hilux-blackline": "product-card__image product-card__image--hilux",
  "ranger-raid": "product-card__image product-card__image--ranger",
  "jimny-convoy": "product-card__image product-card__image--jimny",
};

const fitmentFrames: FitmentFrame[] = [
  {
    title: "Perfil correcto",
    body: "Desde el costado se tiene que leer la subida por el pilar A y el cabezal por arriba del techo.",
    detail: "Silhouette",
    image: referenceSnorkelProfile,
    alt: "Perfil lateral de Jeep con snorkel visible sobre el pilar A",
    variant: "profile",
  },
  {
    title: "Close-up del cabezal",
    body: "El producto también se vende en detalle: tubo, cabeza, acabado y presencia técnica.",
    detail: "Head unit",
    image: referenceSnorkelCloseup,
    alt: "Close-up de snorkel montado en guardafango y pilar A",
    variant: "closeup",
  },
  {
    title: "Cruce de agua",
    body: "La toma alta debe leerse incluso con agua subiendo contra el frente del vehículo.",
    detail: "Water use",
    image: referenceSnorkelCrossing,
    alt: "Camioneta con snorkel cruzando agua",
    variant: "crossing",
  },
  {
    title: "Barro real",
    body: "No sirve que el truck se vea lindo si la pieza desaparece. Tiene que aguantar y verse montada.",
    detail: "Mud proof",
    image: referenceSnorkelMud,
    alt: "4x4 con snorkel cubierto de barro",
    variant: "mud",
  },
];

const rainDrops = Array.from({ length: 38 }, (_, index) => ({
  key: `drop-${index + 1}`,
  style: {
    "--drop-left": `${(index * 11 + (index % 3) * 7) % 100}%`,
    "--drop-delay": `${(index % 7) * -1.2}s`,
    "--drop-duration": `${4.8 + (index % 5) * 0.75}s`,
    "--drop-height": `${80 + (index % 6) * 28}px`,
    "--drop-opacity": `${0.12 + (index % 4) * 0.05}`,
  } as CSSProperties,
}));

const createRainBuffer = (audioContext: AudioContext) => {
  const buffer = audioContext.createBuffer(
    1,
    audioContext.sampleRate * 2,
    audioContext.sampleRate,
  );
  const data = buffer.getChannelData(0);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * 0.16;
  }

  return buffer;
};

const mudMeterLabel = (mudScore: number) => {
  if (mudScore >= 5) {
    return "Mud meter: extremo";
  }

  if (mudScore >= 4) {
    return "Mud meter: alto";
  }

  return "Mud meter: medio";
};

const updateTilt = (event: ReactPointerEvent<HTMLElement>) => {
  const { currentTarget, clientX, clientY } = event;
  const rect = currentTarget.getBoundingClientRect();
  const relativeX = (clientX - rect.left) / rect.width;
  const relativeY = (clientY - rect.top) / rect.height;
  const rotateY = (relativeX - 0.5) * 22;
  const rotateX = (0.5 - relativeY) * 18;
  const shiftX = (relativeX - 0.5) * 28;
  const shiftY = (relativeY - 0.5) * 20;

  currentTarget.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
  currentTarget.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
  currentTarget.style.setProperty("--shift-x", `${shiftX.toFixed(2)}px`);
  currentTarget.style.setProperty("--shift-y", `${shiftY.toFixed(2)}px`);
  currentTarget.style.setProperty(
    "--glow-x",
    `${(relativeX * 100).toFixed(2)}%`,
  );
  currentTarget.style.setProperty(
    "--glow-y",
    `${(relativeY * 100).toFixed(2)}%`,
  );
  currentTarget.style.setProperty("--tilt-scale", "1.03");
};

const resetTilt = (event: ReactPointerEvent<HTMLElement>) => {
  event.currentTarget.style.setProperty("--tilt-x", "0deg");
  event.currentTarget.style.setProperty("--tilt-y", "0deg");
  event.currentTarget.style.setProperty("--shift-x", "0px");
  event.currentTarget.style.setProperty("--shift-y", "0px");
  event.currentTarget.style.setProperty("--glow-x", "50%");
  event.currentTarget.style.setProperty("--glow-y", "50%");
  event.currentTarget.style.setProperty("--tilt-scale", "1");
};

export function StorefrontPage() {
  const queryClient = useQueryClient();
  const [cartToken] = useState(() =>
    readStorage<string>(CART_TOKEN_STORAGE_KEY, createCartToken()),
  );
  const [favorites, setFavorites] = useState<string[]>(() =>
    readStorage<string[]>(FAVORITES_STORAGE_KEY, []),
  );
  const [savedLists, setSavedLists] = useState<SavedList[]>(() =>
    readStorage<SavedList[]>(LISTS_STORAGE_KEY, []),
  );
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const storefrontQuery = useQuery({
    queryKey: ["storefront"],
    queryFn: () => fetchJson<StorefrontResponse>("/api/storefront"),
  });
  const cartQuery = useQuery({
    queryKey: ["cart", cartToken],
    queryFn: async () => {
      try {
        return await fetchJson<CartResponse>(
          `/api/cart?cartToken=${encodeURIComponent(cartToken)}`,
        );
      } catch {
        return EMPTY_CART(cartToken);
      }
    },
  });

  const data = storefrontQuery.data;
  const products = data?.products ?? [];
  const cartData = cartQuery.data;
  const cartProducts = cartData?.items ?? [];
  const cartItemsById = new Map(
    cartProducts.map((item) => [item.productId, item.quantity]),
  );
  const subtotal = cartData?.subtotal ?? 0;
  const savings = cartData?.savings ?? 0;
  const totalItems = cartData?.itemCount ?? 0;
  const favoriteCount = favorites.length;
  const month = new Date().getMonth();
  const rainySeason = month >= 4 && month <= 8;
  const weatherState = rainySeason
    ? "Frente frío activo"
    : "Lluvia fina probable";
  const weatherNote = rainySeason
    ? "Temporada húmeda en marcha. Mejor revisar sellos, respiradero y abrazaderas."
    : "Aunque no sea invierno, la ruta austral sigue pidiendo admisión alta y hardware serio.";
  const tiltHandlers = {
    onPointerLeave: resetTilt,
    onPointerMove: updateTilt,
  };

  const stopAmbient = () => {
    sourceRef.current?.stop();
    sourceRef.current?.disconnect();
    gainRef.current?.disconnect();
    sourceRef.current = null;
    gainRef.current = null;
  };

  const toggleAmbient = async () => {
    if (soundEnabled) {
      stopAmbient();
      setSoundEnabled(false);
      return;
    }

    if (typeof window === "undefined" || !window.AudioContext) {
      return;
    }

    const audioContext = audioContextRef.current ?? new window.AudioContext();
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    stopAmbient();

    const source = audioContext.createBufferSource();
    source.buffer = createRainBuffer(audioContext);
    source.loop = true;

    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;

    const gain = audioContext.createGain();
    gain.gain.value = 0.045;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);
    source.start();

    sourceRef.current = source;
    gainRef.current = gain;
    setSoundEnabled(true);
  };

  useEffect(() => {
    return () => {
      sourceRef.current?.stop();
      sourceRef.current?.disconnect();
      gainRef.current?.disconnect();
      sourceRef.current = null;
      gainRef.current = null;
      void audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      CART_TOKEN_STORAGE_KEY,
      JSON.stringify(cartToken),
    );
  }, [cartToken]);

  useEffect(() => {
    window.localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(favorites),
    );
  }, [favorites]);

  useEffect(() => {
    window.localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(savedLists));
  }, [savedLists]);

  const syncCart = (nextCart: CartResponse) => {
    queryClient.setQueryData(["cart", cartToken], nextCart);
  };

  const addToCart = async (productId: string) => {
    const nextCart = await requestJson<CartResponse>("/api/cart/items", {
      body: JSON.stringify({
        cartToken,
        productId,
        quantityDelta: 1,
      }),
      method: "POST",
    });

    syncCart(nextCart);
  };

  const setCartQuantity = async (productId: string, quantity: number) => {
    const nextCart = await requestJson<CartResponse>("/api/cart/items/set", {
      body: JSON.stringify({
        cartToken,
        productId,
        quantity,
      }),
      method: "POST",
    });

    syncCart(nextCart);
  };

  const decreaseCartItem = async (productId: string) => {
    const currentQuantity = cartItemsById.get(productId) ?? 0;

    await setCartQuantity(productId, Math.max(currentQuantity - 1, 0));
  };

  const removeCartItem = async (productId: string) => {
    const nextCart = await requestJson<CartResponse>("/api/cart/items/remove", {
      body: JSON.stringify({
        cartToken,
        productId,
      }),
      method: "POST",
    });

    syncCart(nextCart);
  };

  const clearCart = async () => {
    const nextCart = await requestJson<CartResponse>("/api/cart/clear", {
      body: JSON.stringify({
        cartToken,
      }),
      method: "POST",
    });

    syncCart(nextCart);
  };

  const toggleFavorite = (productId: string) => {
    startTransition(() => {
      setFavorites((current) =>
        current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId],
      );
    });
  };

  const saveFavoriteList = () => {
    if (favorites.length === 0) {
      return;
    }

    startTransition(() => {
      setSavedLists((current) => [
        {
          id: `list-${Date.now()}`,
          name: `Lista ${current.length + 1}`,
          productIds: favorites,
        },
        ...current,
      ]);
    });
  };

  const loadList = (productIds: string[]) => {
    startTransition(() => {
      setFavorites(productIds);
    });
  };

  const deleteList = (listId: string) => {
    startTransition(() => {
      setSavedLists((current) => current.filter((list) => list.id !== listId));
    });
  };

  if (storefrontQuery.isLoading || cartQuery.isLoading) {
    return (
      <section className="storefront-loading">Cargando storefront...</section>
    );
  }

  if (storefrontQuery.isError || !data) {
    return (
      <section className="storefront-loading">
        No se pudo cargar la tienda. Revisa el API y vuelve a intentar.
      </section>
    );
  }

  return (
    <div className="storefront storefront--rain">
      <div aria-hidden="true" className="rain-system">
        <div className="rain-layer rain-layer--far">
          {rainDrops.map((drop) => (
            <span
              className="rain-drop"
              key={`far-${drop.key}`}
              style={drop.style}
            />
          ))}
        </div>
        <div className="rain-layer rain-layer--near">
          {rainDrops.map((drop, index) => (
            <span
              className="rain-drop rain-drop--near"
              key={`near-${drop.key}`}
              style={
                {
                  ...drop.style,
                  "--drop-left": `${(index * 13 + 9) % 100}%`,
                  "--drop-delay": `${(index % 6) * -0.9}s`,
                  "--drop-duration": `${3.4 + (index % 4) * 0.55}s`,
                  "--drop-height": `${110 + (index % 5) * 36}px`,
                  "--drop-opacity": `${0.18 + (index % 3) * 0.08}`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="mist-band mist-band--one" />
        <div className="mist-band mist-band--two" />
      </div>

      <button
        className={
          soundEnabled ? "sound-toggle sound-toggle--active" : "sound-toggle"
        }
        onClick={() => {
          void toggleAmbient();
        }}
        type="button"
      >
        {soundEnabled ? "Apagar lluvia" : "Encender lluvia"}
      </button>

      <header className="topbar topbar--commerce">
        <a className="brand" href="/">
          <span className="brand__mark">S</span>
          <div>
            <strong>Snorquel.cls</strong>
            <span>forest spec storefront</span>
          </div>
        </a>

        <nav className="topbar__nav">
          <a href="#productos">Productos</a>
          <a href="#cuenta">Cuenta</a>
          <a href="#carrito">Carrito</a>
          <a href="#entregas">Entregas</a>
        </nav>

        <div className="topbar__utility">
          <span className="topbar__status">Modo invitado</span>
          <a className="topbar__chip" href="#favoritos">
            Favoritos
            <strong>{favoriteCount}</strong>
          </a>
          <a className="topbar__chip topbar__chip--accent" href="#carrito">
            Carrito
            <strong>{totalItems}</strong>
          </a>
          <a className="topbar__chip" href="#cuenta">
            Perfil
          </a>
          <button className="topbar__cta" type="button">
            Ingresar
          </button>
        </div>
      </header>

      <section className="hero-grid">
        <div className="hero-copy">
          <p className="hero-copy__eyebrow">{data.hero.eyebrow}</p>
          <h1>{data.hero.title}</h1>
          <p className="hero-copy__body">{data.hero.body}</p>

          <div className="hero-copy__actions">
            <a
              className="button button--primary"
              href={data.hero.primaryCta.href}
            >
              {data.hero.primaryCta.label}
            </a>
            <a
              className="button button--ghost"
              href={data.hero.secondaryCta.href}
            >
              {data.hero.secondaryCta.label}
            </a>
          </div>

          <div className="hero-metrics">
            {data.highlights.map((item) => (
              <article className="hero-metric" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>

          <div className="bento-grid bento-grid--hero">
            <article
              className="bento-card bento-card--weather tilt-surface tilt-surface--soft"
              {...tiltHandlers}
            >
              <p className="section-heading__eyebrow">
                {data.weatherBanner.eyebrow}
              </p>
              <strong>{weatherState}</strong>
              <p>{data.weatherBanner.body}</p>
              <small>{weatherNote}</small>
            </article>

            <article
              className="bento-card bento-card--sound tilt-surface tilt-surface--soft"
              {...tiltHandlers}
            >
              <p className="section-heading__eyebrow">ASMR de taller</p>
              <strong>
                {soundEnabled ? data.soundscapes[0] : "Ambient off"}
              </strong>
              <p>
                Toggle con ruido ambiente para sostener una atmósfera más
                inmersiva.
              </p>
            </article>

            <article
              className="bento-card bento-card--route tilt-surface tilt-surface--soft"
              {...tiltHandlers}
            >
              <p className="section-heading__eyebrow">Colección sur</p>
              <strong>{data.routeCollection[0]?.title}</strong>
              <p>{data.routeCollection[0]?.body}</p>
            </article>
          </div>

          <section className="hero-account" id="cuenta">
            <div className="hero-account__header">
              <div>
                <p className="section-heading__eyebrow">Cuenta y perfil</p>
                <strong>Login, perfil, favoritos y compras previas</strong>
              </div>
              <span className="hero-account__status">Guest mode</span>
            </div>
            <div className="hero-account__grid">
              <article className="hero-account__card">
                <span>Acceso</span>
                <p>Guarda favoritos, pedidos previos y listas por vehículo.</p>
                <div className="hero-account__actions">
                  <button className="button button--primary" type="button">
                    Ingresar
                  </button>
                  <button className="button button--ghost" type="button">
                    Crear cuenta
                  </button>
                </div>
              </article>
              <article className="hero-account__card">
                <span>Perfil</span>
                <p>Direcciones, vehículos compatibles y reorden rápido.</p>
              </article>
            </div>
          </section>
        </div>

        <aside className="hero-bento">
          <div className="hero-machine tilt-surface" {...tiltHandlers}>
            <div className="hero-machine__copy tilt-depth-2">
              <p className="section-heading__eyebrow">Main product focus</p>
              <strong>
                El snorkel tiene que ser el héroe, no un accesorio perdido.
              </strong>
              <p>
                Truck grande, bosque de pinos, lluvia encima y foco visual en la
                admisión alta para vender mejor el producto.
              </p>
              <div className="hero-machine__tags">
                <span>Matte black</span>
                <span>Australia import</span>
                <span>Forest spec</span>
              </div>
            </div>
            <div className="hero-machine__visual tilt-depth-3">
              <img
                alt="Camioneta con snorkel de aluminio cruzando agua"
                className="hero-machine__image"
                src={referenceSnorkelCrossing}
              />
              <div className="hero-machine__callout tilt-depth-4">
                <strong>Snorkel de aluminio</strong>
                <span>
                  Toma de aire elevada sellada para agua, polvo y barro.
                </span>
              </div>
            </div>
          </div>

          <div className="hero-showcase hero-showcase--wide">
            <div
              className="hero-showcase__panel hero-showcase__panel--featured tilt-surface"
              {...tiltHandlers}
            >
              <img
                alt="4x4 con snorkel cubierto de barro y lluvia"
                className="hero-showcase__image"
                src={referenceSnorkelMud}
              />
              <p>Carretera Austral mood</p>
              <strong>
                Bosque, agua, barro y aire frío. La tienda ya habla ese idioma.
              </strong>
              <span>
                Menos desierto, más ruta húmeda, fiordo y maquinaria bien
                armada.
              </span>
            </div>
          </div>
        </aside>
      </section>

      <section className="moving-rigs" aria-label="Vehicles in motion">
        <div className="moving-rigs__lane moving-rigs__lane--truck">
          <div className="moving-rigs__track">
            <img
              alt="Truck 4x4 con snorkel avanzando"
              className="moving-rigs__vehicle moving-rigs__vehicle--truck"
              src={referenceSnorkelCrossing}
            />
            <img
              alt="Truck 4x4 con snorkel avanzando"
              className="moving-rigs__vehicle moving-rigs__vehicle--truck"
              src={referenceSnorkelWhiteJeep}
            />
            <img
              alt="Truck 4x4 con snorkel avanzando"
              className="moving-rigs__vehicle moving-rigs__vehicle--truck"
              src={referenceSnorkelMud}
            />
            <img
              alt="Truck 4x4 con snorkel avanzando"
              className="moving-rigs__vehicle moving-rigs__vehicle--truck"
              src={referenceSnorkelGreenJeep}
            />
          </div>
        </div>
        <div className="moving-rigs__lane moving-rigs__lane--jeep">
          <div className="moving-rigs__track moving-rigs__track--reverse">
            <img
              alt="Jeep 4x4 con snorkel avanzando"
              className="moving-rigs__vehicle moving-rigs__vehicle--jeep"
              src={referenceSnorkelProfile}
            />
            <img
              alt="Jeep 4x4 con snorkel avanzando"
              className="moving-rigs__vehicle moving-rigs__vehicle--jeep"
              src={referenceSnorkelWhiteJeep}
            />
            <img
              alt="Jeep 4x4 con snorkel avanzando"
              className="moving-rigs__vehicle moving-rigs__vehicle--jeep"
              src={referenceSnorkelGreenJeep}
            />
            <img
              alt="Jeep 4x4 con snorkel avanzando"
              className="moving-rigs__vehicle moving-rigs__vehicle--jeep"
              src={referenceSnorkelProfile}
            />
          </div>
        </div>
      </section>

      <section className="marquee-strip">
        <span>Valdivian green</span>
        <span>Wet slate</span>
        <span>Topographic surfaces</span>
        <span>Mud-rated hardware</span>
        <span>Ruta austral setups</span>
      </section>

      <section className="section-block route-grid" id="ruta">
        <div className="section-heading section-heading--commerce">
          <div>
            <p className="section-heading__eyebrow">Ruta de los Parques</p>
            <h2>Una colección pensada para agua, frío y ripio del sur.</h2>
          </div>
          <p className="section-heading__summary">
            La tienda deja de parecer una vitrina genérica y empieza a sentirse
            como field guide.
          </p>
        </div>

        <div className="route-grid__cards">
          {data.routeCollection.map((item) => (
            <article className="route-card" key={item.title}>
              <span>{item.label}</span>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block fitment-grid">
        <div className="section-heading section-heading--commerce">
          <div>
            <p className="section-heading__eyebrow">Fitment reference</p>
            <h2>
              Tus ejemplos apuntan a esto: snorkel visible, técnico y montado de
              verdad.
            </h2>
          </div>
          <p className="section-heading__summary">
            Cuatro lecturas clave para vender la pieza mejor: perfil, detalle,
            cruce y barro.
          </p>
        </div>

        <div className="fitment-grid__cards">
          {fitmentFrames.map((frame) => (
            <article
              className={`fitment-card fitment-card--${frame.variant} tilt-surface tilt-surface--soft`}
              key={frame.title}
              {...tiltHandlers}
            >
              <div className="fitment-card__media">
                <img
                  alt={frame.alt}
                  className="fitment-card__image"
                  src={frame.image}
                />
                <span className="fitment-card__detail">{frame.detail}</span>
              </div>
              <div className="fitment-card__body tilt-depth-3">
                <strong>{frame.title}</strong>
                <p>{frame.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block" id="productos">
        <div className="section-heading section-heading--commerce">
          <div>
            <p className="section-heading__eyebrow">Productos destacados</p>
            <h2>
              Catálogo modular con señales de confianza antes del checkout.
            </h2>
          </div>
          <p className="section-heading__summary">
            Precio, fit, nivel barro y promesa de entrega dentro del mismo
            bloque.
          </p>
        </div>

        <div className="catalog-storyboard">
          <article
            className="catalog-storyboard__lead tilt-surface"
            {...tiltHandlers}
          >
            <img
              alt="Jeep con snorkel claramente visible en foto principal"
              className="catalog-storyboard__image"
              src={referenceSnorkelWhiteJeep}
            />
            <div className="catalog-storyboard__copy tilt-depth-3">
              <p className="section-heading__eyebrow">Snorkel de aluminio</p>
              <strong>
                La pieza que vendemos es la admisión alta, no la camioneta.
              </strong>
              <span>
                El snorkel no es escape: es toma de aire elevada sobre el pilar
                A para proteger motor en agua, barro y polvo.
              </span>
              <div className="catalog-storyboard__chips">
                <span>Aluminio 4 mm</span>
                <span>TIG soldado</span>
                <span>Powder coat matte</span>
              </div>
            </div>
          </article>

          <article
            className="catalog-storyboard__tile tilt-surface"
            {...tiltHandlers}
          >
            <img
              alt="Perfil de Jeep con snorkel de aluminio claramente visible"
              className="catalog-storyboard__image"
              src={referenceSnorkelProfile}
            />
            <div className="catalog-storyboard__copy tilt-depth-3">
              <p className="section-heading__eyebrow">Perfil que vende</p>
              <strong>
                Si el snorkel no se lee al primer vistazo, la foto no está
                haciendo su pega.
              </strong>
            </div>
          </article>

          <article
            className="catalog-storyboard__tile tilt-surface"
            {...tiltHandlers}
          >
            <img
              alt="Close-up de snorkel montado sobre guardafango"
              className="catalog-storyboard__image"
              src={referenceSnorkelCloseup}
            />
            <div className="catalog-storyboard__copy tilt-depth-3">
              <p className="section-heading__eyebrow">Detalle técnico</p>
              <strong>
                El cabezal y el tubo merecen primer plano, no sólo un camión
                bonito.
              </strong>
            </div>
          </article>
        </div>

        <div className="catalog-grid">
          {products.map((product) => {
            const quantity = cartItemsById.get(product.id) ?? 0;
            const inCart = quantity > 0;
            const isFavorite = favorites.includes(product.id);

            return (
              <article
                className="product-card tilt-surface"
                key={product.id}
                {...tiltHandlers}
              >
                <div
                  className={`${accentClass[product.accent] ?? "product-card__media"} tilt-depth-2`}
                >
                  <img
                    alt={`${product.name} instalado en 4x4`}
                    className={
                      productImageClass[product.id] ?? "product-card__image"
                    }
                    src={productArtwork[product.id]}
                  />
                  <span className="product-card__badge">{product.badge}</span>
                </div>

                <div className="product-card__body tilt-depth-3">
                  <div>
                    <p className="product-card__category">{product.category}</p>
                    <h3>{product.name}</h3>
                    <p className="product-card__description">
                      {product.description}
                    </p>
                  </div>

                  <div className="product-card__toolbar">
                    <button
                      className={
                        isFavorite
                          ? "button button--dark button--favorite"
                          : "button button--ghost button--favorite"
                      }
                      onClick={() => {
                        toggleFavorite(product.id);
                      }}
                      type="button"
                    >
                      {isFavorite ? "Guardado" : "Favorito"}
                    </button>
                    <span className="product-card__quantity">
                      {inCart ? `${quantity} en carrito` : "Sin unidades"}
                    </span>
                  </div>

                  <div className="product-card__meta">
                    <div>
                      <strong>{currencyFormatter.format(product.price)}</strong>
                      <span>{currencyFormatter.format(product.compareAt)}</span>
                    </div>
                    <small>{product.delivery}</small>
                  </div>

                  <div
                    className="mud-meter"
                    aria-label={mudMeterLabel(product.mudScore)}
                  >
                    <span>Mud meter</span>
                    <div className="mud-meter__dots">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <i
                          className={
                            index < product.mudScore
                              ? "mud-meter__dot mud-meter__dot--active"
                              : "mud-meter__dot"
                          }
                          key={`${product.id}-${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="product-card__features">
                    {product.features.map((feature) => (
                      <span className="product-card__feature" key={feature}>
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="product-card__actions">
                    <div className="quantity-stepper">
                      <button
                        className="button button--ghost quantity-stepper__button"
                        disabled={!inCart}
                        onClick={() => {
                          decreaseCartItem(product.id);
                        }}
                        type="button"
                      >
                        -
                      </button>
                      <span className="quantity-stepper__value">
                        {quantity}
                      </span>
                      <button
                        className="button button--primary quantity-stepper__button"
                        onClick={() => {
                          addToCart(product.id);
                        }}
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className={
                        inCart
                          ? "button button--dark button--split"
                          : "button button--ghost button--split"
                      }
                      disabled={!inCart}
                      onClick={() => {
                        removeCartItem(product.id);
                      }}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="conversion-grid">
        <article className="cart-panel" id="carrito">
          <div className="section-heading section-heading--commerce">
            <div>
              <p className="section-heading__eyebrow">Items de compra</p>
              <h2>Checkout corto y visible desde la home.</h2>
            </div>
          </div>

          <div className="cart-panel__items">
            {cartProducts.map(({ product, quantity }) => (
              <div className="cart-line" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <p>
                    {product.category} · {product.delivery}
                  </p>
                </div>
                <div className="cart-line__controls">
                  <div className="quantity-stepper quantity-stepper--compact">
                    <button
                      className="button button--ghost quantity-stepper__button"
                      onClick={() => {
                        decreaseCartItem(product.id);
                      }}
                      type="button"
                    >
                      -
                    </button>
                    <span className="quantity-stepper__value">{quantity}</span>
                    <button
                      className="button button--primary quantity-stepper__button"
                      onClick={() => {
                        addToCart(product.id);
                      }}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                  <span>
                    {currencyFormatter.format(product.price * quantity)}
                  </span>
                  <button
                    className="button button--ghost cart-line__remove"
                    onClick={() => {
                      removeCartItem(product.id);
                    }}
                    type="button"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ))}
            {cartProducts.length === 0 ? (
              <p className="cart-panel__empty">
                Agrega productos para mostrar una compra armada y subir
                intención.
              </p>
            ) : null}
          </div>

          <div className="cart-panel__summary">
            <div>
              <span>Items</span>
              <strong>{totalItems}</strong>
            </div>
            <div>
              <span>Subtotal</span>
              <strong>{currencyFormatter.format(subtotal)}</strong>
            </div>
            <div>
              <span>Ahorro visible</span>
              <strong>{currencyFormatter.format(Math.max(savings, 0))}</strong>
            </div>
          </div>

          <div className="cart-panel__actions">
            <button
              className="button button--ghost button--split"
              disabled={cartProducts.length === 0}
              onClick={clearCart}
              type="button"
            >
              Limpiar carrito
            </button>
            <button
              className="button button--primary button--split"
              type="button"
            >
              Ir a checkout express
            </button>
          </div>

          <div className="saved-panel" id="favoritos">
            <div className="saved-panel__header">
              <strong>Favoritos y listas</strong>
              <button
                className="button button--ghost"
                disabled={favorites.length === 0}
                onClick={saveFavoriteList}
                type="button"
              >
                Guardar lista
              </button>
            </div>
            <div className="saved-panel__chips">
              {favorites.length === 0 ? (
                <span className="saved-panel__empty">
                  Marca favoritos para armar listas rápidas.
                </span>
              ) : (
                favorites.map((favoriteId) => {
                  const favoriteProduct = products.find(
                    (product) => product.id === favoriteId,
                  );

                  return favoriteProduct ? (
                    <button
                      className="saved-panel__chip"
                      key={favoriteProduct.id}
                      onClick={() => {
                        toggleFavorite(favoriteProduct.id);
                      }}
                      type="button"
                    >
                      {favoriteProduct.name}
                    </button>
                  ) : null;
                })
              )}
            </div>
            <div className="saved-panel__lists">
              {savedLists.map((list) => (
                <div className="saved-list" key={list.id}>
                  <div>
                    <strong>{list.name}</strong>
                    <p>{list.productIds.length} productos guardados</p>
                  </div>
                  <div className="saved-list__actions">
                    <button
                      className="button button--ghost"
                      onClick={() => {
                        loadList(list.productIds);
                      }}
                      type="button"
                    >
                      Cargar
                    </button>
                    <button
                      className="button button--dark"
                      onClick={() => {
                        deleteList(list.id);
                      }}
                      type="button"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="proof-panel">
          <div className="section-heading section-heading--commerce">
            <div>
              <p className="section-heading__eyebrow">Pruebas y comunidad</p>
              <h2>Confianza técnica mezclada con narrativa de terreno.</h2>
            </div>
          </div>

          <div className="proof-list">
            {data.merchandising.map((item) => (
              <div className="proof-item" key={item.title}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </div>
            ))}
          </div>

          <div className="testimonial-grid">
            {data.testimonials.map((testimonial) => (
              <blockquote className="testimonial" key={testimonial.name}>
                <p>"{testimonial.quote}"</p>
                <footer>
                  <strong>{testimonial.name}</strong>
                  <span>{testimonial.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </article>
      </section>

      <section className="section-block tests-grid">
        <div className="section-heading section-heading--commerce">
          <div>
            <p className="section-heading__eyebrow">Torture tests</p>
            <h2>Pruebas cortas y legibles que hacen ver serio el producto.</h2>
          </div>
          <p className="section-heading__summary">
            Microbloques tipo dashboard, pero usados para venta y confianza.
          </p>
        </div>

        <div className="tests-grid__cards">
          {data.tortureTests.map((item) => (
            <article className="test-card" key={item.title}>
              <span>{item.title}</span>
              <strong>{item.metric}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block gallery-grid">
        <div className="section-heading section-heading--commerce">
          <div>
            <p className="section-heading__eyebrow">Spotted in the wild</p>
            <h2>Galería con tono de bitácora, no de catálogo clínico.</h2>
          </div>
          <p className="section-heading__summary">
            Comunidad, rigs y lugares que refuerzan el imaginario del sur.
          </p>
        </div>

        <div className="gallery-grid__cards">
          {data.gallery.map((item, index) => (
            <article className="gallery-card" key={item.name}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.name}</strong>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block delivery-panel" id="entregas">
        <div className="section-heading section-heading--commerce">
          <div>
            <p className="section-heading__eyebrow">Tiempos de entrega</p>
            <h2>Promesa de despacho entendible antes de llegar al checkout.</h2>
          </div>
          <p className="section-heading__summary">
            Esto baja fricción y objeciones de última milla.
          </p>
        </div>

        <div className="delivery-grid">
          {data.deliveryZones.map((zone) => (
            <article className="delivery-card" key={zone.zone}>
              <span>{zone.zone}</span>
              <strong>{zone.eta}</strong>
              <p>{zone.note}</p>
              <small>{zone.cutoff}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
