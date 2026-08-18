import { useEffect, useMemo, useState } from "react";
import SplitBillScreen from "./SplitBillScreen";

type SeatSelection = number | "shared";

type ShareMode =
  | "none"
  | "all"
  | "selected"
  | "unassigned";

type MenuItem = {
  id: string;
  name: string;
  category: string;
  mainCategoryId: string;
  subcategoryId: string;
  price: number;
  available: boolean;
  modifierGroupIds: string[];
  kitchenStationId: string;
};

type OutputDevice = {
  id: string;
  name: string;
  type: "printer" | "kds";
  address: string;
  enabled: boolean;
  model: string;
};

type KitchenStation = {
  id: string;
  name: string;
  order: number;
  available: boolean;
  mode: "printer" | "kds" | "both";
  outputDeviceIds: string[];
};

type SubcategoryRecord = {
  id: string;
  name: string;
  order: number;
  available: boolean;
};

type CategoryRecord = {
  id: string;
  name: string;
  order: number;
  available: boolean;
  subcategories: SubcategoryRecord[];
};

type ModifierInputType = "single" | "multi" | "number" | "text";
type PriceMode = "add" | "replace";

type ModifierOption = {
  id: string;
  name: string;
  priceDelta: number;
  priceMode: PriceMode;
  available: boolean;
  nextGroupIds: string[];
};

type ModifierGroup = {
  id: string;
  name: string;
  inputType: ModifierInputType;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  available: boolean;

  numberMin: number;
  numberMax: number;
  numberStep: number;
  numberDefault: number;
  unitLabel: string;
  numberPricePerUnit: number;
  numberPriceMode: PriceMode;

  textPlaceholder: string;
  textDefault: string;
  textMaxLength: number;

  options: ModifierOption[];
};

type SelectedModifier = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  priceDelta: number;
  priceMode: PriceMode;
  inputType: ModifierInputType;
  inputValue?: string;
};

type TicketItem = {
  lineId: string;
  menuItemId: string;
  name: string;
  price: number;
  basePrice: number;
  qty: number;

  // Service / seat assignment
  guest: SeatSelection;

  sentQty: number;
  voidedQty: number;
  notes: string;
  discount: number;

  // Billing share information
  shareMode: ShareMode;
  sharedWith: number[];

  // Snapshot of modifier choices at the time of ordering.
  selectedModifiers: SelectedModifier[];

  // Snapshot the route so later Back Office changes do not reroute
  // an already-created ticket line unexpectedly.
  kitchenStationId: string;
  kitchenStationName: string;
};

type KitchenEventType =
  | "NEW"
  | "UPDATE"
  | "CANCEL"
  | "REFIRE";

type KitchenBatchItem = {
  lineId: string;
  name: string;
  guest: SeatSelection;
  qty: number;
  modifiers: string[];

  // Used by UPDATE events so Kitchen History never loses
  // what was originally sent.
  previousModifiers?: string[];
  reason?: string;
};

type KitchenBatch = {
  id: string;
  orderId: string;
  createdAt: string;
  eventType: KitchenEventType;
  stationId: string;
  stationName: string;

  // Snapshot output destinations for this event.
  outputDeviceIds: string[];
  outputDeviceNames: string[];

  items: KitchenBatchItem[];
};

type PrinterJobStatus = "PENDING" | "SENT" | "FAILED";

type PrinterJob = {
  id: string;
  kitchenEventId: string;
  orderId: string;
  createdAt: string;
  updatedAt: string;

  eventType: KitchenEventType;

  stationId: string;
  stationName: string;

  deviceId: string;
  deviceName: string;
  deviceType: "printer" | "kds";

  status: PrinterJobStatus;
  attempts: number;
  lastError?: string;

  items: KitchenBatchItem[];
};

type VoidRecord = {
  id: string;
  orderId: string;
  lineId: string;
  itemName: string;
  guest: SeatSelection;
  qty: number;
  reason: string;
  createdAt: string;
};

type OrderScreenProps = {
  orderId: string;
  tableName: string;
  guests: number;
  onGuestsChange: (newGuestCount: number) => void;
  onBack: () => void;
  onOrderComplete: () => void;
};

const MENU_STORAGE_KEY = "behesht-menu-items";
const MODIFIER_STORAGE_KEY = "behesht-modifier-groups";
const CATEGORY_STORAGE_KEY = "behesht-menu-categories";
const KITCHEN_STATION_STORAGE_KEY = "behesht-kitchen-stations";
const OUTPUT_DEVICE_STORAGE_KEY = "behesht-output-devices";
const PRINTER_JOB_QUEUE_STORAGE_KEY = "behesht-output-job-queue";

const defaultMenuItems: MenuItem[] = [
  { id: "1", name: "Koobideh", category: "Kebab", mainCategoryId: "cat-kebab", subcategoryId: "", price: 19.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "2", name: "Joojeh", category: "Kebab", mainCategoryId: "cat-kebab", subcategoryId: "", price: 21.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "3", name: "Vaziri", category: "Kebab", mainCategoryId: "cat-kebab", subcategoryId: "", price: 27.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "4", name: "Shirazi Salad", category: "Salad", mainCategoryId: "cat-salad", subcategoryId: "", price: 8.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "5", name: "Caesar Salad", category: "Salad", mainCategoryId: "cat-salad", subcategoryId: "", price: 12.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "6", name: "Kashk Bademjan", category: "Appetizer", mainCategoryId: "cat-appetizer", subcategoryId: "", price: 13.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "7", name: "Hummus", category: "Appetizer", mainCategoryId: "cat-appetizer", subcategoryId: "", price: 9.99, available: true, modifierGroupIds: [], kitchenStationId: "station-kitchen" },
  { id: "8", name: "Tea", category: "Drinks", mainCategoryId: "cat-drinks", subcategoryId: "", price: 4.99, available: true, modifierGroupIds: [], kitchenStationId: "station-bar" },
  { id: "9", name: "Coke", category: "Drinks", mainCategoryId: "cat-drinks", subcategoryId: "", price: 3.99, available: true, modifierGroupIds: [], kitchenStationId: "station-bar" },
  { id: "10", name: "Water", category: "Drinks", mainCategoryId: "cat-drinks", subcategoryId: "", price: 2.99, available: true, modifierGroupIds: [], kitchenStationId: "station-bar" },
  { id: "11", name: "Classic Hookah", category: "Hookah", mainCategoryId: "cat-hookah", subcategoryId: "", price: 29.99, available: true, modifierGroupIds: [], kitchenStationId: "station-shisha" },
  { id: "12", name: "Premium Hookah", category: "Hookah", mainCategoryId: "cat-hookah", subcategoryId: "", price: 39.99, available: true, modifierGroupIds: [], kitchenStationId: "station-shisha" },
];

function loadMenuCategories(): CategoryRecord[] {
  const saved = localStorage.getItem(CATEGORY_STORAGE_KEY);

  if (!saved) {
    return [
      { id: "cat-kebab", name: "Kebab", order: 1, available: true, subcategories: [] },
      { id: "cat-salad", name: "Salad", order: 2, available: true, subcategories: [] },
      { id: "cat-appetizer", name: "Appetizer", order: 3, available: true, subcategories: [] },
      { id: "cat-drinks", name: "Drinks", order: 4, available: true, subcategories: [] },
      { id: "cat-hookah", name: "Hookah", order: 5, available: true, subcategories: [] },
      { id: "cat-other", name: "Other", order: 99, available: true, subcategories: [] },
    ];
  }

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((category: any) => ({
      id: String(category.id),
      name: String(category.name ?? "Category"),
      order: Number(category.order ?? 0),
      available: category.available === undefined ? true : Boolean(category.available),
      subcategories: Array.isArray(category.subcategories)
        ? category.subcategories.map((subcategory: any) => ({
            id: String(subcategory.id),
            name: String(subcategory.name ?? "Subcategory"),
            order: Number(subcategory.order ?? 0),
            available: subcategory.available === undefined ? true : Boolean(subcategory.available),
          }))
        : [],
    }));
  } catch {
    return [];
  }
}

function loadMenuItems(): MenuItem[] {
  const saved = localStorage.getItem(MENU_STORAGE_KEY);

  if (!saved) {
    return defaultMenuItems;
  }

  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return defaultMenuItems;
    }

    return parsed.map((item) => ({
      id: String(item.id),
      name: String(item.name ?? "Item"),
      category: String(item.category ?? "Other"),
      mainCategoryId: String(item.mainCategoryId ?? ""),
      subcategoryId: String(item.subcategoryId ?? ""),
      price: Number(item.price ?? 0),
      available:
        item.available === undefined
          ? true
          : Boolean(item.available),
      modifierGroupIds: Array.isArray(item.modifierGroupIds)
        ? item.modifierGroupIds.map(String)
        : [],
      kitchenStationId: String(item.kitchenStationId ?? ""),
    }));
  } catch {
    return defaultMenuItems;
  }
}

function loadModifierGroups(): ModifierGroup[] {
  const saved = localStorage.getItem(MODIFIER_STORAGE_KEY);

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return [];

    return parsed.map((group) => {
      const inputType: ModifierInputType =
        group.inputType === "multi" ||
        group.inputType === "number" ||
        group.inputType === "text"
          ? group.inputType
          : "single";

      return {
        id: String(group.id),
        name: String(group.name ?? "Modifier Group"),
        inputType,
        required: Boolean(group.required),
        minSelect: Math.max(0, Number(group.minSelect ?? 0)),
        maxSelect: Math.max(1, Number(group.maxSelect ?? 1)),
        available:
          group.available === undefined
            ? true
            : Boolean(group.available),

        numberMin: Number(group.numberMin ?? 1),
        numberMax: Number(group.numberMax ?? 12),
        numberStep: Math.max(0.01, Number(group.numberStep ?? 1)),
        numberDefault: Number(group.numberDefault ?? group.numberMin ?? 1),
        unitLabel: String(group.unitLabel ?? ""),
        numberPricePerUnit: Number(group.numberPricePerUnit ?? 0),
        numberPriceMode:
          group.numberPriceMode === "replace" ? "replace" : "add",

        textPlaceholder: String(group.textPlaceholder ?? ""),
        textDefault: String(group.textDefault ?? ""),
        textMaxLength: Math.max(1, Number(group.textMaxLength ?? 80)),

        options: Array.isArray(group.options)
          ? group.options.map((option: any) => ({
              id: String(option.id),
              name: String(option.name ?? "Option"),
              priceDelta: Number(option.priceDelta ?? 0),
              priceMode:
                option.priceMode === "replace" ? "replace" : "add",
              available:
                option.available === undefined
                  ? true
                  : Boolean(option.available),
              nextGroupIds: Array.isArray(option.nextGroupIds)
                ? option.nextGroupIds.map(String)
                : [],
            }))
          : [],
      };
    });
  } catch {
    return [];
  }
}

function loadKitchenStations(): KitchenStation[] {
  const saved = localStorage.getItem(KITCHEN_STATION_STORAGE_KEY);

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((station: any, index: number) => ({
      id: String(station.id ?? `station-${index + 1}`),
      name: String(station.name ?? "Station"),
      order: Number(station.order ?? index + 1),
      available:
        station.available === undefined
          ? true
          : Boolean(station.available),
      mode:
        station.mode === "kds" || station.mode === "both"
          ? station.mode
          : "printer",
      outputDeviceIds: Array.isArray(station.outputDeviceIds)
        ? station.outputDeviceIds.map(String)
        : [],
    }));
  } catch {
    return [];
  }
}

function loadOutputDevices(): OutputDevice[] {
  const saved = localStorage.getItem(OUTPUT_DEVICE_STORAGE_KEY);

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((device: any, index: number) => ({
      id: String(device.id ?? `device-${index + 1}`),
      name: String(device.name ?? "Output Device"),
      type: device.type === "kds" ? "kds" : "printer",
      address: String(device.address ?? ""),
      enabled:
        device.enabled === undefined
          ? true
          : Boolean(device.enabled),
      model: String(device.model ?? ""),
    }));
  } catch {
    return [];
  }
}

const voidReasons = [
  "Customer Changed Mind",
  "Wrong Item Entered",
  "Kitchen Error",
  "Duplicate Order",
  "Manager Adjustment",
  "Other",
];

function loadArray<T>(key: string): T[] {
  const saved = localStorage.getItem(key);

  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadKitchenHistory(
  key: string
): KitchenBatch[] {
  const saved = loadArray<any>(key);

  return saved.map((batch, batchIndex) => ({
    id:
      String(
        batch.id ??
          `kitchen-old-${batchIndex}`
      ),
    orderId: String(batch.orderId ?? ""),
    createdAt: String(
      batch.createdAt ??
        new Date().toLocaleString()
    ),

    // Existing history created before this engine is a NEW event.
    eventType:
      batch.eventType === "UPDATE" ||
      batch.eventType === "CANCEL" ||
      batch.eventType === "REFIRE"
        ? batch.eventType
        : "NEW",

    stationId: String(batch.stationId ?? ""),
    stationName: String(batch.stationName ?? "Legacy / Unassigned"),

    outputDeviceIds: Array.isArray(batch.outputDeviceIds)
      ? batch.outputDeviceIds.map(String)
      : [],
    outputDeviceNames: Array.isArray(batch.outputDeviceNames)
      ? batch.outputDeviceNames.map(String)
      : [],

    items: Array.isArray(batch.items)
      ? batch.items.map(
          (item: any, itemIndex: number) => ({
            lineId: String(
              item.lineId ??
                `old-line-${itemIndex}`
            ),
            name: String(item.name ?? "Item"),
            guest:
              item.guest === "shared"
                ? "shared"
                : Number(item.guest ?? 1),
            qty: Number(item.qty ?? 1),
            modifiers: Array.isArray(
              item.modifiers
            )
              ? item.modifiers.map(String)
              : [],
            previousModifiers: Array.isArray(
              item.previousModifiers
            )
              ? item.previousModifiers.map(String)
              : undefined,
            reason:
              item.reason === undefined
                ? undefined
                : String(item.reason),
          })
        )
      : [],
  }));
}

function loadTicket(key: string): TicketItem[] {
  const saved = loadArray<any>(key);

  return saved.map((item, index) => ({
    lineId:
      item.lineId ??
      `${item.id ?? item.menuItemId ?? "item"}-${Date.now()}-${index}`,

    menuItemId:
      item.menuItemId ??
      item.id ??
      `old-item-${index}`,

    name: item.name ?? "Item",

    price: Number(item.price ?? 0),

    basePrice: Number(
      item.basePrice ??
        (
          Number(item.price ?? 0) -
          (Array.isArray(item.selectedModifiers)
            ? item.selectedModifiers.reduce(
                (sum: number, modifier: any) =>
                  sum +
                  (modifier.priceMode === "replace"
                    ? 0
                    : Number(modifier.priceDelta ?? 0)),
                0
              )
            : 0)
        )
    ),

    qty: Number(item.qty ?? 1),

    guest:
      item.guest === "shared"
        ? "shared"
        : Number(item.guest ?? 1),

    sentQty: Number(item.sentQty ?? 0),

    voidedQty: Number(item.voidedQty ?? 0),

    notes: item.notes ?? "",

    discount: Number(item.discount ?? 0),

    shareMode:
      item.shareMode ??
      (item.guest === "shared"
        ? "unassigned"
        : "none"),

    sharedWith: Array.isArray(item.sharedWith)
      ? item.sharedWith.map(Number)
      : [],

    selectedModifiers: Array.isArray(item.selectedModifiers)
      ? item.selectedModifiers.map((modifier: any) => ({
          groupId: String(modifier.groupId ?? ""),
          groupName: String(modifier.groupName ?? "Modifier"),
          optionId: String(modifier.optionId ?? ""),
          optionName: String(modifier.optionName ?? "Option"),
          priceDelta: Number(modifier.priceDelta ?? 0),
          priceMode:
            modifier.priceMode === "replace" ? "replace" : "add",
          inputType:
            modifier.inputType === "multi" ||
            modifier.inputType === "number" ||
            modifier.inputType === "text"
              ? modifier.inputType
              : "single",
          inputValue:
            modifier.inputValue === undefined
              ? undefined
              : String(modifier.inputValue),
        }))
      : [],

    kitchenStationId: String(item.kitchenStationId ?? ""),
    kitchenStationName: String(item.kitchenStationName ?? ""),
  }));
}

export default function OrderScreen({
  orderId,
  tableName,
  guests,
  onGuestsChange,
  onBack,
  onOrderComplete,
}: OrderScreenProps) {
  const ticketStorageKey = `behesht-ticket-${orderId}`;
  const kitchenStorageKey = `behesht-kitchen-${orderId}`;
  const voidStorageKey = `behesht-voids-${orderId}`;

  const [menuItems, setMenuItems] =
    useState<MenuItem[]>(loadMenuItems);

  const [menuCategories, setMenuCategories] =
    useState<CategoryRecord[]>(loadMenuCategories);

  const [modifierGroups, setModifierGroups] =
    useState<ModifierGroup[]>(loadModifierGroups);

  const [kitchenStations, setKitchenStations] =
    useState<KitchenStation[]>(loadKitchenStations);

  const [outputDevices, setOutputDevices] =
    useState<OutputDevice[]>(loadOutputDevices);

  const [pendingModifierItem, setPendingModifierItem] =
    useState<MenuItem | null>(null);

  const [modifierQueue, setModifierQueue] =
    useState<string[]>([]);

  const [processedModifierGroupIds, setProcessedModifierGroupIds] =
    useState<string[]>([]);

  const [modifierSelections, setModifierSelections] =
    useState<Record<string, string[]>>({});

  const [modifierInputValues, setModifierInputValues] =
    useState<Record<string, string>>({});

  const [editingModifierLineId, setEditingModifierLineId] =
    useState<string | null>(null);

  const [editingModifierBasePrice, setEditingModifierBasePrice] =
    useState<number | null>(null);

  const [
    editingSentModifierSnapshot,
    setEditingSentModifierSnapshot,
  ] = useState<{
    lineId: string;
    name: string;
    guest: SeatSelection;
    qty: number;
    modifiers: string[];
  } | null>(null);


  const [selectedMainCategoryId, setSelectedMainCategoryId] =
    useState(() => {
      const firstAvailable = loadMenuCategories()
        .slice()
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
        .find((category) => category.available);

      return firstAvailable?.id ?? "";
    });

  const [selectedSubcategoryId, setSelectedSubcategoryId] =
    useState("");

  const [activeSeat, setActiveSeat] =
    useState<SeatSelection>(1);

  const [serviceGuests, setServiceGuests] =
    useState(guests);

  const [ticket, setTicket] =
    useState<TicketItem[]>(() =>
      loadTicket(ticketStorageKey)
    );

  const [kitchenBatches, setKitchenBatches] =
    useState<KitchenBatch[]>(() =>
      loadKitchenHistory(kitchenStorageKey)
    );

  const [printerJobs, setPrinterJobs] =
    useState<PrinterJob[]>(() =>
      loadArray<PrinterJob>(PRINTER_JOB_QUEUE_STORAGE_KEY)
    );

  const [voidRecords, setVoidRecords] =
    useState<VoidRecord[]>(() =>
      loadArray<VoidRecord>(voidStorageKey)
    );

  const [selectedLineId, setSelectedLineId] =
    useState<string | null>(null);

  const [moveItem, setMoveItem] =
    useState<TicketItem | null>(null);

  const [notesItem, setNotesItem] =
    useState<TicketItem | null>(null);

  const [notesText, setNotesText] =
    useState("");

  const [discountItem, setDiscountItem] =
    useState<TicketItem | null>(null);

  const [discountPercent, setDiscountPercent] =
    useState(10);

  const [voidItem, setVoidItem] =
    useState<TicketItem | null>(null);

  const [voidQty, setVoidQty] =
    useState(1);

  const [voidReason, setVoidReason] =
    useState("");

  const [customVoidReason, setCustomVoidReason] =
    useState("");

  const [shareItem, setShareItem] =
    useState<TicketItem | null>(null);

  const [shareSelection, setShareSelection] =
    useState<number[]>([]);

  const [showKitchenHistory, setShowKitchenHistory] =
    useState(false);

  const [showPrinterQueue, setShowPrinterQueue] =
    useState(false);

  const [showVoidHistory, setShowVoidHistory] =
    useState(false);

  const [showSplitBill, setShowSplitBill] =
    useState(false);

  useEffect(() => {
    localStorage.setItem(
      ticketStorageKey,
      JSON.stringify(ticket)
    );
  }, [ticketStorageKey, ticket]);

  useEffect(() => {
    localStorage.setItem(
      kitchenStorageKey,
      JSON.stringify(kitchenBatches)
    );
  }, [kitchenStorageKey, kitchenBatches]);

  useEffect(() => {
    localStorage.setItem(
      PRINTER_JOB_QUEUE_STORAGE_KEY,
      JSON.stringify(printerJobs)
    );
  }, [printerJobs]);

  useEffect(() => {
    localStorage.setItem(
      voidStorageKey,
      JSON.stringify(voidRecords)
    );
  }, [voidStorageKey, voidRecords]);

  useEffect(() => {
    setServiceGuests(guests);
  }, [guests]);

  useEffect(() => {
    if (
      activeSeat !== "shared" &&
      activeSeat > serviceGuests
    ) {
      setActiveSeat(serviceGuests);
    }
  }, [serviceGuests, activeSeat]);

  useEffect(() => {
    const refreshMenu = () => {
      setMenuItems(loadMenuItems());
      setMenuCategories(loadMenuCategories());
      setModifierGroups(loadModifierGroups());
      setKitchenStations(loadKitchenStations());
      setOutputDevices(loadOutputDevices());
    };

    window.addEventListener("focus", refreshMenu);
    window.addEventListener("storage", refreshMenu);

    return () => {
      window.removeEventListener("focus", refreshMenu);
      window.removeEventListener("storage", refreshMenu);
    };
  }, []);

  const sortedMainCategories = useMemo(
    () =>
      menuCategories
        .filter((category) => category.available)
        .slice()
        .sort(
          (a, b) =>
            a.order - b.order ||
            a.name.localeCompare(b.name)
        ),
    [menuCategories]
  );

  const selectedMainCategory = useMemo(
    () =>
      sortedMainCategories.find(
        (category) => category.id === selectedMainCategoryId
      ) ?? null,
    [sortedMainCategories, selectedMainCategoryId]
  );

  const visibleSubcategories = useMemo(
    () =>
      (selectedMainCategory?.subcategories ?? [])
        .filter((subcategory) => subcategory.available)
        .slice()
        .sort(
          (a, b) =>
            a.order - b.order ||
            a.name.localeCompare(b.name)
        ),
    [selectedMainCategory]
  );

  useEffect(() => {
    if (
      sortedMainCategories.length > 0 &&
      !sortedMainCategories.some(
        (category) => category.id === selectedMainCategoryId
      )
    ) {
      setSelectedMainCategoryId(sortedMainCategories[0].id);
      setSelectedSubcategoryId("");
    }
  }, [sortedMainCategories, selectedMainCategoryId]);

  useEffect(() => {
    if (!selectedMainCategory) {
      setSelectedSubcategoryId("");
      return;
    }

    if (visibleSubcategories.length === 0) {
      if (selectedSubcategoryId !== "") {
        setSelectedSubcategoryId("");
      }
      return;
    }

    if (
      selectedSubcategoryId &&
      !visibleSubcategories.some(
        (subcategory) => subcategory.id === selectedSubcategoryId
      )
    ) {
      setSelectedSubcategoryId("");
    }
  }, [selectedMainCategory, visibleSubcategories, selectedSubcategoryId]);

  const filteredItems = useMemo(() => {
    if (!selectedMainCategory) return [];

    return menuItems.filter((item) => {
      if (!item.available) return false;

      if (item.mainCategoryId) {
        if (item.mainCategoryId !== selectedMainCategory.id) {
          return false;
        }

        if (visibleSubcategories.length > 0) {
          if (!selectedSubcategoryId) return false;
          return item.subcategoryId === selectedSubcategoryId;
        }

        return !item.subcategoryId;
      }

      return (
        item.category === selectedMainCategory.name &&
        visibleSubcategories.length === 0
      );
    });
  }, [menuItems, selectedMainCategory, selectedSubcategoryId, visibleSubcategories.length]);

  const selectedSubcategory =
    visibleSubcategories.find(
      (subcategory) => subcategory.id === selectedSubcategoryId
    ) ?? null;

  const subtotal = ticket.reduce(
    (sum, item) => {
      const gross =
        item.price * item.qty;

      const discountAmount =
        gross *
        ((item.discount ?? 0) / 100);

      return sum + gross - discountAmount;
    },
    0
  );

  const tax = subtotal * 0.13;

  const total =
    subtotal + tax;

  const unsentCount =
    ticket.reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          item.qty - item.sentQty
        ),
      0
    );

  const allGuestNumbers =
    Array.from(
      { length: serviceGuests },
      (_, index) => index + 1
    );

  const kitchenModifierLines = (
    modifiers: SelectedModifier[]
  ) =>
    (modifiers ?? []).map(
      (modifier) =>
        `${modifier.groupName}: ${modifier.optionName}`
    );

  const getStationForMenuItem = (
    menuItemId: string,
    stationIdSnapshot = "",
    stationNameSnapshot = ""
  ) => {
    if (stationIdSnapshot) {
      const snapshotStation = kitchenStations.find(
        (station) => station.id === stationIdSnapshot
      );

      return {
        id: stationIdSnapshot,
        name:
          stationNameSnapshot ||
          snapshotStation?.name ||
          "Unassigned",
        available:
          snapshotStation?.available ?? true,
        outputDeviceIds:
          snapshotStation?.outputDeviceIds ?? [],
      };
    }

    const menuItem = menuItems.find(
      (item) => item.id === menuItemId
    );

    const station = kitchenStations.find(
      (candidate) =>
        candidate.id === menuItem?.kitchenStationId
    );

    return {
      id: station?.id ?? "",
      name: station?.name ?? "Unassigned",
      available: station?.available ?? false,
      outputDeviceIds: station?.outputDeviceIds ?? [],
    };
  };

  const getActiveOutputDevices = (
    station: {
      id: string;
      outputDeviceIds?: string[];
    }
  ) => {
    const assignedIds =
      station.outputDeviceIds ??
      kitchenStations.find(
        (candidate) => candidate.id === station.id
      )?.outputDeviceIds ??
      [];

    return assignedIds
      .map((deviceId) =>
        outputDevices.find(
          (device) => device.id === deviceId
        )
      )
      .filter(
        (device): device is OutputDevice =>
          Boolean(device?.enabled)
      );
  };

  const addKitchenEvent = (
    eventType: KitchenEventType,
    items: KitchenBatchItem[],
    station: {
      id: string;
      name: string;
      outputDeviceIds?: string[];
    }
  ) => {
    const activeDevices =
      getActiveOutputDevices(station);

    const eventId =
      `kitchen-${eventType.toLowerCase()}-${Date.now()}-${station.id || "unassigned"}`;

    const createdAt =
      new Date().toLocaleString();

    const event: KitchenBatch = {
      id: eventId,
      orderId,
      createdAt,
      eventType,
      stationId: station.id,
      stationName: station.name,
      outputDeviceIds: activeDevices.map(
        (device) => device.id
      ),
      outputDeviceNames: activeDevices.map(
        (device) => device.name
      ),
      items,
    };

    setKitchenBatches((current) => [
      ...current,
      event,
    ]);

    const createdJobs: PrinterJob[] =
      activeDevices.map((device, index) => ({
        id: `output-job-${Date.now()}-${index}-${device.id}`,
        kitchenEventId: eventId,
        orderId,
        createdAt,
        updatedAt: createdAt,
        eventType,
        stationId: station.id,
        stationName: station.name,
        deviceId: device.id,
        deviceName: device.name,
        deviceType: device.type,
        status: "PENDING",
        attempts: 0,
        items: items.map((item) => ({
          ...item,
          modifiers: [...(item.modifiers ?? [])],
          previousModifiers: item.previousModifiers
            ? [...item.previousModifiers]
            : undefined,
        })),
      }));

    if (createdJobs.length > 0) {
      setPrinterJobs((current) => [
        ...current,
        ...createdJobs,
      ]);
    }
  };

  const markPrinterJobSent = (
    jobId: string
  ) => {
    const now = new Date().toLocaleString();

    setPrinterJobs((current) =>
      current.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: "SENT",
              attempts: job.attempts + 1,
              updatedAt: now,
              lastError: undefined,
            }
          : job
      )
    );
  };

  const markPrinterJobFailed = (
    jobId: string
  ) => {
    const now = new Date().toLocaleString();

    setPrinterJobs((current) =>
      current.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: "FAILED",
              attempts: job.attempts + 1,
              updatedAt: now,
              lastError:
                "Simulated connection failure",
            }
          : job
      )
    );
  };

  const retryPrinterJob = (
    jobId: string
  ) => {
    const now = new Date().toLocaleString();

    setPrinterJobs((current) =>
      current.map((job) =>
        job.id === jobId
          ? {
              ...job,
              status: "PENDING",
              updatedAt: now,
              lastError: undefined,
            }
          : job
      )
    );
  };

  const clearSentPrinterJobs = () => {
    setPrinterJobs((current) =>
      current.filter(
        (job) => job.status !== "SENT"
      )
    );
  };

  const refireItem = (item: TicketItem) => {
    if (item.sentQty <= 0) {
      alert(
        "This item has not been sent to Kitchen yet."
      );
      return;
    }

    const rawQty = window.prompt(
      `How many ${item.name} should be REFIRE?`,
      String(item.sentQty)
    );

    if (rawQty === null) return;

    const requestedQty = Number(rawQty);

    if (
      !Number.isInteger(requestedQty) ||
      requestedQty < 1 ||
      requestedQty > item.sentQty
    ) {
      alert(
        `REFIRE quantity must be a whole number from 1 to ${item.sentQty}.`
      );
      return;
    }

    const confirmed = window.confirm(
      `REFIRE ${requestedQty} × ${item.name} to Kitchen?`
    );

    if (!confirmed) return;

    const station = getStationForMenuItem(
      item.menuItemId,
      item.kitchenStationId,
      item.kitchenStationName
    );

    addKitchenEvent(
      "REFIRE",
      [
        {
          lineId: item.lineId,
          name: item.name,
          guest: item.guest,
          qty: requestedQty,
          modifiers: kitchenModifierLines(
            item.selectedModifiers ?? []
          ),
          reason: "Manual refire",
        },
      ],
      station
    );

    alert(
      `${requestedQty} × ${item.name} sent to Kitchen as REFIRE.`
    );
  };

  const addGuest = () => {
    const newGuestCount =
      serviceGuests + 1;

    setServiceGuests(
      newGuestCount
    );

    onGuestsChange(
      newGuestCount
    );

    // Items shared with ALL guests
    // automatically include the newly added guest.
    setTicket((current) =>
      current.map((item) =>
        item.shareMode === "all"
          ? {
              ...item,
              sharedWith: [
                ...Array.from(
                  { length: newGuestCount },
                  (_, index) => index + 1
                ),
              ],
            }
          : item
      )
    );

    setActiveSeat(
      newGuestCount
    );
  };

  const modifierSignature = (
    modifiers: SelectedModifier[]
  ) =>
    modifiers
      .map(
        (modifier) =>
          `${modifier.groupId}:${modifier.optionId}:${modifier.inputValue ?? ""}:${modifier.priceMode}:${modifier.priceDelta}`
      )
      .sort()
      .join("|");

  const calculateModifierPrice = (
    basePrice: number,
    modifiers: SelectedModifier[]
  ) => {
    let replacePrice: number | null = null;
    let additions = 0;

    modifiers.forEach((modifier) => {
      if (modifier.priceMode === "replace") {
        replacePrice = modifier.priceDelta;
      } else {
        additions += modifier.priceDelta;
      }
    });

    return (replacePrice ?? basePrice) + additions;
  };

  const commitItemToTicket = (
    item: MenuItem,
    selectedModifiers: SelectedModifier[]
  ) => {
    const finalPrice = calculateModifierPrice(
      item.price,
      selectedModifiers
    );
    const signature = modifierSignature(selectedModifiers);

    setTicket((current) => {
      const existing =
        current.find(
          (ticketItem) =>
            ticketItem.menuItemId === item.id &&
            ticketItem.guest === activeSeat &&
            ticketItem.notes === "" &&
            ticketItem.discount === 0 &&
            ticketItem.shareMode === "none" &&
            Number(ticketItem.basePrice ?? ticketItem.price) ===
              Number(item.price) &&
            modifierSignature(
              ticketItem.selectedModifiers ?? []
            ) === signature
        );

      if (existing) {
        return current.map(
          (ticketItem) =>
            ticketItem.lineId === existing.lineId
              ? {
                  ...ticketItem,
                  qty: ticketItem.qty + 1,
                }
              : ticketItem
        );
      }

      return [
        ...current,
        {
          lineId: `${orderId}-${item.id}-${String(
            activeSeat
          )}-${Date.now()}`,

          menuItemId: item.id,

          name: item.name,

          // Snapshot both base and final price so later menu edits
          // never change an existing ticket.
          basePrice: item.price,
          price: finalPrice,

          qty: 1,

          guest: activeSeat,

          sentQty: 0,

          voidedQty: 0,

          notes: "",

          discount: 0,

          shareMode: "none",

          sharedWith: [],

          selectedModifiers,

          kitchenStationId: item.kitchenStationId ?? "",
          kitchenStationName:
            kitchenStations.find(
              (station) => station.id === item.kitchenStationId
            )?.name ?? "Unassigned",
        },
      ];
    });
  };

  const closeModifierFlow = () => {
    setPendingModifierItem(null);
    setModifierQueue([]);
    setProcessedModifierGroupIds([]);
    setModifierSelections({});
    setModifierInputValues({});
    setEditingModifierLineId(null);
    setEditingModifierBasePrice(null);
    setEditingSentModifierSnapshot(null);
  };

  const startModifierFlow = (
    item: MenuItem
  ) => {
    const startingGroups =
      item.modifierGroupIds.filter((groupId) => {
        const group = modifierGroups.find(
          (candidate) => candidate.id === groupId
        );

        return Boolean(group?.available);
      });

    if (startingGroups.length === 0) {
      commitItemToTicket(item, []);
      return;
    }

    setEditingModifierLineId(null);
    setEditingModifierBasePrice(null);
    const defaultInputs: Record<string, string> = {};

    startingGroups.forEach((groupId) => {
      const group = modifierGroups.find(
        (candidate) => candidate.id === groupId
      );

      if (group?.inputType === "number") {
        defaultInputs[group.id] = String(group.numberDefault);
      }

      if (group?.inputType === "text" && group.textDefault) {
        defaultInputs[group.id] = group.textDefault;
      }
    });

    setPendingModifierItem(item);
    setModifierQueue(startingGroups);
    setProcessedModifierGroupIds([]);
    setModifierSelections({});
    setModifierInputValues(defaultInputs);
  };

  const openEditModifierFlow = (
    ticketItem: TicketItem
  ) => {
    if (
      ticketItem.sentQty > 0 &&
      ticketItem.qty !== 1
    ) {
      alert(
        "This sent line contains more than one item. Unit-by-unit Kitchen Update will be added before editing multi-quantity sent lines."
      );
      return;
    }

    const menuItem = menuItems.find(
      (item) => item.id === ticketItem.menuItemId
    );

    if (!menuItem) {
      alert("The original menu item could not be found.");
      return;
    }

    const startingGroups =
      menuItem.modifierGroupIds.filter((groupId) => {
        const group = modifierGroups.find(
          (candidate) => candidate.id === groupId
        );

        return Boolean(group?.available);
      });

    if (startingGroups.length === 0) {
      alert("This menu item has no active modifier groups.");
      return;
    }

    const preselected: Record<string, string[]> = {};
    const prefilledInputs: Record<string, string> = {};

    (ticketItem.selectedModifiers ?? []).forEach(
      (modifier) => {
        if (
          modifier.inputType === "number" ||
          modifier.inputType === "text"
        ) {
          prefilledInputs[modifier.groupId] =
            modifier.inputValue ?? modifier.optionName;
          return;
        }

        preselected[modifier.groupId] = [
          ...(preselected[modifier.groupId] ?? []),
          modifier.optionId,
        ];
      }
    );

    startingGroups.forEach((groupId) => {
      const group = modifierGroups.find(
        (candidate) => candidate.id === groupId
      );

      if (
        group?.inputType === "number" &&
        prefilledInputs[group.id] === undefined
      ) {
        prefilledInputs[group.id] = String(group.numberDefault);
      }

      if (
        group?.inputType === "text" &&
        prefilledInputs[group.id] === undefined &&
        group.textDefault
      ) {
        prefilledInputs[group.id] = group.textDefault;
      }
    });

    setEditingSentModifierSnapshot(
      ticketItem.sentQty > 0
        ? {
            lineId: ticketItem.lineId,
            name: ticketItem.name,
            guest: ticketItem.guest,
            qty: ticketItem.sentQty,
            modifiers: kitchenModifierLines(
              ticketItem.selectedModifiers ?? []
            ),
          }
        : null
    );

    setEditingModifierLineId(ticketItem.lineId);
    setEditingModifierBasePrice(
      Number(ticketItem.basePrice ?? menuItem.price)
    );
    setPendingModifierItem(menuItem);
    setModifierQueue(startingGroups);
    setProcessedModifierGroupIds([]);
    setModifierSelections(preselected);
    setModifierInputValues(prefilledInputs);
  };

  const addItem = (
    item: MenuItem
  ) => {
    if (!item.available) {
      alert("This item is currently unavailable.");
      return;
    }

    startModifierFlow(item);
  };

  const currentModifierGroup =
    modifierQueue.length > 0
      ? modifierGroups.find(
          (group) => group.id === modifierQueue[0]
        ) ?? null
      : null;

  const toggleModifierOption = (
    group: ModifierGroup,
    optionId: string
  ) => {
    const current =
      modifierSelections[group.id] ?? [];

    const alreadySelected =
      current.includes(optionId);

    let next: string[];

    if (alreadySelected) {
      next = current.filter(
        (id) => id !== optionId
      );
    } else if (group.maxSelect <= 1) {
      next = [optionId];
    } else if (
      current.length < group.maxSelect
    ) {
      next = [...current, optionId];
    } else {
      return;
    }

    setModifierSelections((all) => ({
      ...all,
      [group.id]: next,
    }));
  };

  const continueModifierFlow = () => {
    if (
      !pendingModifierItem ||
      !currentModifierGroup
    ) {
      return;
    }

    const group = currentModifierGroup;

    if (
      group.inputType === "single" ||
      group.inputType === "multi"
    ) {
      const selectedIds =
        modifierSelections[group.id] ?? [];

      const minimum =
        group.required
          ? Math.max(1, group.minSelect)
          : group.minSelect;

      if (selectedIds.length < minimum) {
        alert(
          `Please select at least ${minimum} option(s) for ${group.name}.`
        );
        return;
      }

      if (selectedIds.length > group.maxSelect) {
        alert(
          `Please select no more than ${group.maxSelect} option(s) for ${group.name}.`
        );
        return;
      }
    }

    if (group.inputType === "number") {
      const raw = modifierInputValues[group.id] ?? "";
      const value = Number(raw);

      if (group.required && raw.trim() === "") {
        alert(`Please enter a value for ${group.name}.`);
        return;
      }

      if (
        raw.trim() !== "" &&
        (!Number.isFinite(value) ||
          value < group.numberMin ||
          value > group.numberMax)
      ) {
        alert(
          `${group.name} must be between ${group.numberMin} and ${group.numberMax}.`
        );
        return;
      }
    }

    if (group.inputType === "text") {
      const value =
        modifierInputValues[group.id] ?? "";

      if (group.required && !value.trim()) {
        alert(`Please enter a value for ${group.name}.`);
        return;
      }

      if (value.length > group.textMaxLength) {
        alert(
          `${group.name} is limited to ${group.textMaxLength} characters.`
        );
        return;
      }
    }

    const selectedIds =
      modifierSelections[group.id] ?? [];

    const selectedOptions =
      group.options.filter(
        (option) =>
          option.available &&
          selectedIds.includes(option.id)
      );

    const nextConditionalIds =
      group.inputType === "single" ||
      group.inputType === "multi"
        ? selectedOptions
            .flatMap((option) => option.nextGroupIds)
            .filter((groupId) => {
              const nextGroup = modifierGroups.find(
                (candidate) => candidate.id === groupId
              );

              return Boolean(nextGroup?.available);
            })
        : [];

    const processed = [
      ...processedModifierGroupIds,
      group.id,
    ];

    const remaining = modifierQueue.slice(1);

    const uniqueNext = nextConditionalIds.filter(
      (groupId) =>
        !processed.includes(groupId) &&
        !remaining.includes(groupId)
    );

    const nextQueue = [
      ...uniqueNext,
      ...remaining,
    ];

    if (nextQueue.length > 0) {
      setProcessedModifierGroupIds(processed);
      setModifierQueue(nextQueue);

      const nextGroup = modifierGroups.find(
        (candidate) => candidate.id === nextQueue[0]
      );

      if (
        nextGroup?.inputType === "number" &&
        modifierInputValues[nextGroup.id] === undefined
      ) {
        setModifierInputValues((all) => ({
          ...all,
          [nextGroup.id]: String(nextGroup.numberDefault),
        }));
      }

      if (
        nextGroup?.inputType === "text" &&
        modifierInputValues[nextGroup.id] === undefined &&
        nextGroup.textDefault
      ) {
        setModifierInputValues((all) => ({
          ...all,
          [nextGroup.id]: nextGroup.textDefault,
        }));
      }

      return;
    }

    const selectedModifiers: SelectedModifier[] = [];
    const completedGroupIds = [...processed];

    completedGroupIds.forEach((groupId) => {
      const completedGroup = modifierGroups.find(
        (candidate) => candidate.id === groupId
      );

      if (!completedGroup) return;

      if (
        completedGroup.inputType === "single" ||
        completedGroup.inputType === "multi"
      ) {
        const ids =
          modifierSelections[groupId] ?? [];

        completedGroup.options
          .filter(
            (option) =>
              option.available &&
              ids.includes(option.id)
          )
          .forEach((option) => {
            selectedModifiers.push({
              groupId: completedGroup.id,
              groupName: completedGroup.name,
              optionId: option.id,
              optionName: option.name,
              priceDelta: option.priceDelta,
              priceMode: option.priceMode,
              inputType: completedGroup.inputType,
            });
          });

        return;
      }

      if (completedGroup.inputType === "number") {
        const raw =
          modifierInputValues[completedGroup.id] ?? "";

        if (!raw.trim() && !completedGroup.required) {
          return;
        }

        const value = Number(raw);
        const displayValue = `${raw}${
          completedGroup.unitLabel
            ? ` ${completedGroup.unitLabel}`
            : ""
        }`;

        selectedModifiers.push({
          groupId: completedGroup.id,
          groupName: completedGroup.name,
          optionId: "__number__",
          optionName: displayValue,
          inputValue: raw,
          priceDelta:
            value * completedGroup.numberPricePerUnit,
          priceMode: completedGroup.numberPriceMode,
          inputType: "number",
        });

        return;
      }

      const text =
        modifierInputValues[completedGroup.id] ?? "";

      if (!text.trim() && !completedGroup.required) {
        return;
      }

      selectedModifiers.push({
        groupId: completedGroup.id,
        groupName: completedGroup.name,
        optionId: "__text__",
        optionName: text,
        inputValue: text,
        priceDelta: 0,
        priceMode: "add",
        inputType: "text",
      });
    });

    if (
      editingModifierLineId &&
      editingModifierBasePrice !== null
    ) {
      const finalPrice = calculateModifierPrice(
        editingModifierBasePrice,
        selectedModifiers
      );

      setTicket((current) =>
        current.map((item) =>
          item.lineId === editingModifierLineId
            ? {
                ...item,
                basePrice: editingModifierBasePrice,
                price: finalPrice,
                selectedModifiers,
              }
            : item
        )
      );

      setSelectedLineId(
        editingModifierLineId
      );

      if (editingSentModifierSnapshot) {
        const editedTicketItem = ticket.find(
          (item) =>
            item.lineId ===
            editingSentModifierSnapshot.lineId
        );

        const station = getStationForMenuItem(
          editedTicketItem?.menuItemId ??
            pendingModifierItem.id,
          editedTicketItem?.kitchenStationId ?? "",
          editedTicketItem?.kitchenStationName ?? ""
        );

        addKitchenEvent(
          "UPDATE",
          [
            {
              lineId:
                editingSentModifierSnapshot.lineId,
              name:
                editingSentModifierSnapshot.name,
              guest:
                editingSentModifierSnapshot.guest,
              qty:
                editingSentModifierSnapshot.qty,
              previousModifiers:
                editingSentModifierSnapshot.modifiers,
              modifiers:
                kitchenModifierLines(
                  selectedModifiers
                ),
              reason:
                "Modifier change after Kitchen send",
            },
          ],
          station
        );
      }
    } else {
      commitItemToTicket(
        pendingModifierItem,
        selectedModifiers
      );
    }

    closeModifierFlow();
  };

  const increaseItem = (
    lineId: string
  ) => {
    setTicket((current) =>
      current.map((item) =>
        item.lineId === lineId
          ? {
              ...item,
              qty: item.qty + 1,
            }
          : item
      )
    );
  };

  const openVoid = (
    item: TicketItem
  ) => {
    setVoidItem(item);
    setVoidQty(1);
    setVoidReason("");
    setCustomVoidReason("");
  };

  const decreaseItem = (
    item: TicketItem
  ) => {
    if (item.qty <= item.sentQty) {
      openVoid(item);
      return;
    }

    setTicket((current) =>
      current
        .map((ticketItem) =>
          ticketItem.lineId ===
          item.lineId
            ? {
                ...ticketItem,
                qty:
                  ticketItem.qty - 1,
              }
            : ticketItem
        )
        .filter(
          (ticketItem) =>
            ticketItem.qty > 0
        )
    );
  };

  const removeItem = (
    item: TicketItem
  ) => {
    if (item.sentQty > 0) {
      openVoid(item);
      return;
    }

    const confirmed =
      window.confirm(
        `Remove ${item.name}?`
      );

    if (!confirmed) return;

    setTicket((current) =>
      current.filter(
        (ticketItem) =>
          ticketItem.lineId !== item.lineId
      )
    );

    setSelectedLineId(null);
  };

  const moveItemToSeat = (
    lineId: string,
    newSeat: SeatSelection
  ) => {
    setTicket((current) =>
      current.map((item) =>
        item.lineId === lineId
          ? {
              ...item,

              guest: newSeat,

              shareMode:
                newSeat === "shared"
                  ? "unassigned"
                  : "none",

              sharedWith: [],
            }
          : item
      )
    );

    setMoveItem(null);
  };

  const openShare = (
    item: TicketItem
  ) => {
    setShareItem(item);

    if (
      item.shareMode === "selected"
    ) {
      setShareSelection(
        item.sharedWith
      );
    } else if (
      item.shareMode === "all"
    ) {
      setShareSelection(
        allGuestNumbers
      );
    } else {
      setShareSelection([]);
    }
  };

  const toggleShareGuest = (
    guestNumber: number
  ) => {
    setShareSelection(
      (current) =>
        current.includes(
          guestNumber
        )
          ? current.filter(
              (guest) =>
                guest !==
                guestNumber
            )
          : [
              ...current,
              guestNumber,
            ]
    );
  };

  const shareWithAll = () => {
    if (!shareItem) return;

    setTicket((current) =>
      current.map((item) =>
        item.lineId ===
        shareItem.lineId
          ? {
              ...item,

              guest: "shared",

              shareMode: "all",

              sharedWith:
                allGuestNumbers,
            }
          : item
      )
    );

    setShareItem(null);
    setShareSelection([]);
    setSelectedLineId(null);
  };

  const shareWithSelected = () => {
    if (!shareItem) return;

    if (
      shareSelection.length < 2
    ) {
      alert(
        "Select at least 2 guests to share this item."
      );

      return;
    }

    setTicket((current) =>
      current.map((item) =>
        item.lineId ===
        shareItem.lineId
          ? {
              ...item,

              guest: "shared",

              shareMode:
                "selected",

              sharedWith: [
                ...shareSelection,
              ].sort(
                (a, b) =>
                  a - b
              ),
            }
          : item
      )
    );

    setShareItem(null);
    setShareSelection([]);
    setSelectedLineId(null);
  };

  const keepAsShared = () => {
    if (!shareItem) return;

    setTicket((current) =>
      current.map((item) =>
        item.lineId ===
        shareItem.lineId
          ? {
              ...item,

              guest: "shared",

              shareMode:
                "unassigned",

              sharedWith: [],
            }
          : item
      )
    );

    setShareItem(null);
    setShareSelection([]);
    setSelectedLineId(null);
  };

  const removeSharing = () => {
    if (!shareItem) return;

    const destination =
      typeof shareItem.guest ===
      "number"
        ? shareItem.guest
        : 1;

    setTicket((current) =>
      current.map((item) =>
        item.lineId ===
        shareItem.lineId
          ? {
              ...item,

              guest:
                destination,

              shareMode: "none",

              sharedWith: [],
            }
          : item
      )
    );

    setShareItem(null);
    setShareSelection([]);
    setSelectedLineId(null);
  };

  const saveNotes = () => {
    if (!notesItem) return;

    setTicket((current) =>
      current.map((item) =>
        item.lineId ===
        notesItem.lineId
          ? {
              ...item,

              notes:
                notesText.trim(),
            }
          : item
      )
    );

    setNotesItem(null);
    setNotesText("");
  };

  const saveDiscount = () => {
    if (!discountItem) return;

    const safeDiscount =
      Math.max(
        0,
        Math.min(
          100,
          discountPercent
        )
      );

    setTicket((current) =>
      current.map((item) =>
        item.lineId ===
        discountItem.lineId
          ? {
              ...item,

              discount:
                safeDiscount,
            }
          : item
      )
    );

    setDiscountItem(null);
  };

  const sendToKitchen = () => {
    const unsentLines = ticket
      .map((item) => {
        const qty = Math.max(
          0,
          item.qty - item.sentQty
        );

        const station = getStationForMenuItem(
          item.menuItemId,
          item.kitchenStationId,
          item.kitchenStationName
        );

        return {
          station,
          kitchenItem: {
            lineId: item.lineId,
            name: item.name,
            guest: item.guest,
            qty,
            modifiers:
              (item.selectedModifiers ?? []).map(
                (modifier) =>
                  `${modifier.groupName}: ${modifier.optionName}`
              ),
          } as KitchenBatchItem,
        };
      })
      .filter(
        (entry) =>
          entry.kitchenItem.qty > 0
      );

    if (unsentLines.length === 0) {
      alert(
        "Nothing new to send to Kitchen."
      );
      return;
    }

    const unassigned = unsentLines.filter(
      (entry) => !entry.station.id
    );

    if (unassigned.length > 0) {
      alert(
        `${unassigned.length} line(s) have no Kitchen Station assigned. Assign a route in Back Office before sending.`
      );
      return;
    }

    const disabled = unsentLines.filter(
      (entry) => !entry.station.available
    );

    if (disabled.length > 0) {
      const names = Array.from(
        new Set(
          disabled.map(
            (entry) => entry.station.name
          )
        )
      ).join(", ");

      alert(
        `Cannot send because these Kitchen Stations are disabled: ${names}`
      );
      return;
    }

    const noOutput = unsentLines.filter(
      (entry) =>
        getActiveOutputDevices(entry.station).length === 0
    );

    if (noOutput.length > 0) {
      const names = Array.from(
        new Set(
          noOutput.map(
            (entry) => entry.station.name
          )
        )
      ).join(", ");

      alert(
        `Cannot send because these Kitchen Stations have no enabled output device: ${names}`
      );
      return;
    }

    const grouped = new Map<
      string,
      {
        station: {
          id: string;
          name: string;
          outputDeviceIds: string[];
        };
        items: KitchenBatchItem[];
      }
    >();

    unsentLines.forEach(
      ({ station, kitchenItem }) => {
        const existing = grouped.get(
          station.id
        );

        if (existing) {
          existing.items.push(kitchenItem);
          return;
        }

        grouped.set(station.id, {
          station: {
            id: station.id,
            name: station.name,
            outputDeviceIds: station.outputDeviceIds ?? [],
          },
          items: [kitchenItem],
        });
      }
    );

    grouped.forEach(
      ({ station, items }) => {
        addKitchenEvent(
          "NEW",
          items,
          station
        );
      }
    );

    setTicket((current) =>
      current.map((item) => ({
        ...item,
        sentQty: item.qty,
      }))
    );

    const stationSummary = Array.from(
      grouped.values()
    )
      .map(
        ({ station, items }) => {
          const devices = getActiveOutputDevices(
            station
          )
            .map((device) => device.name)
            .join(" + ");

          return `${station.name} → ${devices}: ${items.reduce(
            (sum, item) => sum + item.qty,
            0
          )}`;
        }
      )
      .join(" | ");

    alert(
      `${unsentLines.reduce(
        (sum, entry) =>
          sum + entry.kitchenItem.qty,
        0
      )} new item(s) routed. ${stationSummary}`
    );
  };

  const confirmVoid = () => {
    if (!voidItem) return;

    const finalReason =
      voidReason === "Other"
        ? customVoidReason.trim()
        : voidReason;

    if (!finalReason) {
      alert(
        "Please select or enter a Void reason."
      );

      return;
    }

    const maxVoidable =
      Math.min(
        voidItem.sentQty,
        voidItem.qty
      );

    const safeQty =
      Math.max(
        1,
        Math.min(
          voidQty,
          maxVoidable
        )
      );

    const record: VoidRecord = {
      id: `void-${Date.now()}`,

      orderId,

      lineId:
        voidItem.lineId,

      itemName:
        voidItem.name,

      guest:
        voidItem.guest,

      qty: safeQty,

      reason:
        finalReason,

      createdAt:
        new Date().toLocaleString(),
    };

    if (safeQty > 0) {
      const station = getStationForMenuItem(
        voidItem.menuItemId,
        voidItem.kitchenStationId,
        voidItem.kitchenStationName
      );

      addKitchenEvent(
        "CANCEL",
        [
          {
            lineId: voidItem.lineId,
            name: voidItem.name,
            guest: voidItem.guest,
            qty: safeQty,
            modifiers: kitchenModifierLines(
              voidItem.selectedModifiers ?? []
            ),
            reason: finalReason,
          },
        ],
        station
      );
    }

    setVoidRecords(
      (current) => [
        ...current,
        record,
      ]
    );

    setTicket((current) =>
      current
        .map((item) => {
          if (
            item.lineId !==
            voidItem.lineId
          ) {
            return item;
          }

          return {
            ...item,

            qty:
              item.qty -
              safeQty,

            sentQty:
              Math.max(
                0,
                item.sentQty -
                  safeQty
              ),

            voidedQty:
              item.voidedQty +
              safeQty,
          };
        })
        .filter(
          (item) =>
            item.qty > 0
        )
    );

    setVoidItem(null);
    setSelectedLineId(null);
  };

  const guestLabel = (
    guest: SeatSelection
  ) =>
    guest === "shared"
      ? "Shared"
      : `Guest ${guest}`;

  const guestTotal = (
    guest: SeatSelection
  ) =>
    ticket
      .filter(
        (item) =>
          item.guest === guest
      )
      .reduce(
        (sum, item) => {
          const gross =
            item.price *
            item.qty;

          return (
            sum +
            gross -
            gross *
              (item.discount /
                100)
          );
        },
        0
      );

  const shareDescription = (
    item: TicketItem
  ) => {
    if (
      item.shareMode === "all"
    ) {
      return "Shared with all guests";
    }

    if (
      item.shareMode ===
        "selected" &&
      item.sharedWith.length > 0
    ) {
      return `Shared with ${item.sharedWith
        .map(
          (guest) =>
            `Guest ${guest}`
        )
        .join(", ")}`;
    }

    if (
      item.shareMode ===
      "unassigned"
    ) {
      return "Shared — billing not assigned";
    }

    return "";
  };

  const seatOrder: SeatSelection[] = [
    "shared",

    ...Array.from(
      {
        length:
          serviceGuests,
      },
      (_, index) =>
        index + 1
    ),
  ];

  if (showSplitBill) {
    return (
      <SplitBillScreen
        orderId={orderId}
        tableName={tableName}
        ticket={ticket}
        guests={
          serviceGuests
        }
        onTicketChange={(
          newTicket
        ) =>
          setTicket(
            newTicket as TicketItem[]
          )
        }
        onBack={() =>
          setShowSplitBill(
            false
          )
        }
        onOrderComplete={
          onOrderComplete
        }
      />
    );
  }

  return (
    <div
      style={{
        height: "100vh",

        maxHeight: "100vh",

        overflow: "hidden",

        background:
          "#0F172A",

        color: "white",

        fontFamily:
          "Arial, sans-serif",

        display: "flex",

        flexDirection:
          "column",
      }}
    >
      <div
        style={{
          background:
            "#020617",

          padding:
            "8px 14px",

          display: "flex",

          justifyContent:
            "space-between",

          alignItems:
            "center",

          gap: 10,

          flexWrap:
            "nowrap",

          flex: "0 0 auto",
        }}
      >
        <div>
          <strong
            style={{
              fontSize: 20,
            }}
          >
            {tableName}
          </strong>

          <span
            style={{
              marginLeft: 15,

              color:
                "#94A3B8",
            }}
          >
            Guests:{" "}
            {serviceGuests}
          </span>
        </div>

        <div
          style={{
            display: "flex",

            gap: 8,

            flexWrap:
              "wrap",
          }}
        >
          <button
            onClick={() =>
              setShowKitchenHistory(
                true
              )
            }
            style={topButton(
              "#7C3AED"
            )}
          >
            Kitchen History
          </button>

          <button
            onClick={() =>
              setShowPrinterQueue(
                true
              )
            }
            style={topButton(
              "#0F766E"
            )}
          >
            Output Queue
          </button>

          <button
            onClick={() =>
              setShowVoidHistory(
                true
              )
            }
            style={topButton(
              "#B91C1C"
            )}
          >
            Void History
          </button>

          <button
            onClick={onBack}
            style={topButton(
              "#334155"
            )}
          >
            ← Floor Plan
          </button>
        </div>
      </div>

      <div
        style={{
          background:
            "#111827",

          padding:
            "7px 10px",

          display: "flex",

          gap: 8,

          alignItems:
            "center",

          overflowX:
            "auto",

          borderBottom:
            "1px solid #334155",

          flex: "0 0 auto",
        }}
      >
        <strong
          style={{
            marginRight: 8,

            whiteSpace:
              "nowrap",
          }}
        >
          Order For:
        </strong>

        <button
          onClick={() =>
            setActiveSeat(
              "shared"
            )
          }
          style={guestButton(
            activeSeat ===
              "shared"
          )}
        >
          <div>
            Shared
          </div>

          <div
            style={{
              fontSize: 11,

              marginTop: 4,
            }}
          >
            $
            {guestTotal(
              "shared"
            ).toFixed(2)}
          </div>
        </button>

        {allGuestNumbers.map(
          (guestNumber) => (
            <button
              key={
                guestNumber
              }
              onClick={() =>
                setActiveSeat(
                  guestNumber
                )
              }
              style={guestButton(
                activeSeat ===
                  guestNumber
              )}
            >
              <div>
                Guest{" "}
                {guestNumber}
              </div>

              <div
                style={{
                  fontSize: 11,

                  marginTop: 4,
                }}
              >
                $
                {guestTotal(
                  guestNumber
                ).toFixed(2)}
              </div>
            </button>
          )
        )}

        <button
          onClick={
            addGuest
          }
          title="Add Guest"
          style={{
            minWidth: 58,

            height: 46,

            borderRadius: 10,

            border:
              "2px dashed #22C55E",

            background:
              "#052E16",

            color:
              "#86EFAC",

            fontWeight:
              "bold",

            fontSize: 25,

            cursor:
              "pointer",
          }}
        >
          +
        </button>
      </div>

      <div
        style={{
          background:
            "#172554",

          padding: 5,

          fontSize: 12,

          flex: "0 0 auto",

          textAlign:
            "center",

          color:
            "#BFDBFE",
        }}
      >
        New items will be added to{" "}
        <strong>
          {guestLabel(
            activeSeat
          )}
        </strong>
      </div>

      <div
        style={{
          flex: 1,

          display: "grid",

          gridTemplateColumns:
            "165px minmax(300px, 1fr) 390px",

          gap: 8,

          padding: 8,

          minHeight: 0,

          overflow: "hidden",
        }}
      >
        <div
          style={{
            background:
              "#111827",

            borderRadius: 14,

            padding: 10,

            minHeight: 0,

            overflowY:
              "auto",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            Categories
          </h3>

          {sortedMainCategories.map((category) => {
            const selected = selectedMainCategoryId === category.id;
            const subcategories = category.subcategories
              .filter((subcategory) => subcategory.available)
              .slice()
              .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

            return (
              <div key={category.id} style={{ marginBottom: 8 }}>
                <button
                  onClick={() => {
                    setSelectedMainCategoryId(category.id);
                    setSelectedSubcategoryId("");
                  }}
                  style={{
                    width: "100%",
                    minHeight: 55,
                    border: "none",
                    borderRadius: 10,
                    background: selected ? "#2563EB" : "#1E293B",
                    color: "white",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {category.name}
                  {subcategories.length > 0 ? (selected ? " ▾" : " ▸") : ""}
                </button>

                {selected && subcategories.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      paddingTop: 6,
                      paddingLeft: 8,
                    }}
                  >
                    {subcategories.map((subcategory) => (
                      <button
                        key={subcategory.id}
                        onClick={() => setSelectedSubcategoryId(subcategory.id)}
                        style={{
                          width: "100%",
                          minHeight: 42,
                          border: "1px solid #334155",
                          borderRadius: 8,
                          background:
                            selectedSubcategoryId === subcategory.id
                              ? "#0F766E"
                              : "#0F172A",
                          color: "white",
                          fontWeight: 700,
                          cursor: "pointer",
                          textAlign: "left",
                          paddingLeft: 12,
                        }}
                      >
                        ↳ {subcategory.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            background:
              "#111827",

            borderRadius: 14,

            padding: 10,

            minHeight: 0,

            overflowY:
              "auto",
          }}
        >
          <h2
            style={{
              marginTop: 0,

              marginBottom: 5,
            }}
          >
            {selectedSubcategory?.name ??
              selectedMainCategory?.name ??
              "Menu"}
          </h2>

          <div
            style={{
              color:
                "#94A3B8",

              marginBottom: 18,

              fontSize: 13,
            }}
          >
            Ordering for{" "}
            {guestLabel(
              activeSeat
            )}
          </div>

          {selectedMainCategory &&
            visibleSubcategories.length > 0 &&
            !selectedSubcategoryId && (
              <div
                style={{
                  background: "#172554",
                  border: "1px solid #3B82F6",
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 14,
                  color: "#BFDBFE",
                  fontWeight: 700,
                }}
              >
                Select a subcategory under <strong>{selectedMainCategory.name}</strong> from the left.
              </div>
            )}

          {selectedMainCategory && (
            <div
              style={{
                color: "#94A3B8",
                marginBottom: 12,
                fontSize: 12,
              }}
            >
              {selectedMainCategory.name}
              {selectedSubcategory ? ` → ${selectedSubcategory.name}` : ""}
            </div>
          )}

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(auto-fill, minmax(150px, 1fr))",

              gap: 12,
            }}
          >
            {filteredItems.map(
              (item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    addItem(item)
                  }
                  style={{
                    minHeight: 88,

                    borderRadius: 12,

                    border:
                      "2px solid #334155",

                    background:
                      "#1E293B",

                    color: "white",

                    cursor:
                      "pointer",

                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,

                      fontWeight:
                        "bold",
                    }}
                  >
                    {item.name}
                  </div>

                  <div
                    style={{
                      marginTop: 10,

                      color:
                        "#86EFAC",

                      fontWeight:
                        "bold",
                    }}
                  >
                    {item.price === 0 &&
                    item.modifierGroupIds.length > 0
                      ? "Select Options"
                      : `$${item.price.toFixed(2)}`}
                  </div>
                </button>
              )
            )}
          </div>
        </div>

        <div
          style={{
            background:
              "#111827",

            borderRadius: 14,

            padding: 10,

            display: "flex",

            flexDirection:
              "column",

            minHeight: 0,
          }}
        >
          <div
            style={{
              display: "flex",

              justifyContent:
                "space-between",

              alignItems:
                "center",
            }}
          >
            <h2
              style={{
                marginTop: 0,
              }}
            >
              Order Ticket
            </h2>

            {unsentCount >
              0 && (
              <span
                style={{
                  background:
                    "#B45309",

                  borderRadius: 20,

                  padding:
                    "6px 10px",

                  fontSize: 12,

                  fontWeight:
                    "bold",
                }}
              >
                {unsentCount} New
              </span>
            )}
          </div>

          <div
            style={{
              flex: 1,

              overflowY:
                "auto",

              minHeight: 0,
            }}
          >
            {ticket.length ===
              0 && (
              <div
                style={{
                  color:
                    "#64748B",

                  textAlign:
                    "center",

                  marginTop: 50,
                }}
              >
                No items yet
              </div>
            )}

            {seatOrder.map(
              (seat) => {
                const items =
                  ticket.filter(
                    (item) =>
                      item.guest ===
                      seat
                  );

                if (
                  items.length ===
                  0
                ) {
                  return null;
                }

                return (
                  <div
                    key={String(
                      seat
                    )}
                    style={{
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        background:
                          seat ===
                          "shared"
                            ? "#14532D"
                            : "#1E3A8A",

                        borderRadius: 8,

                        padding:
                          "8px 10px",

                        fontWeight:
                          "bold",

                        display: "flex",

                        justifyContent:
                          "space-between",

                        marginBottom: 5,
                      }}
                    >
                      <span>
                        {guestLabel(
                          seat
                        )}
                      </span>

                      <span>
                        $
                        {guestTotal(
                          seat
                        ).toFixed(
                          2
                        )}
                      </span>
                    </div>

                    {items.map(
                      (item) => {
                        const selected =
                          selectedLineId ===
                          item.lineId;

                        const unsentQty =
                          Math.max(
                            0,
                            item.qty -
                              item.sentQty
                          );

                        const gross =
                          item.price *
                          item.qty;

                        const discountValue =
                          gross *
                          (item.discount /
                            100);

                        const lineTotal =
                          gross -
                          discountValue;

                        const shareText =
                          shareDescription(
                            item
                          );

                        return (
                          <div
                            key={
                              item.lineId
                            }
                            style={{
                              borderBottom:
                                "1px solid #334155",

                              padding:
                                "10px 0",
                            }}
                          >
                            <button
                              onClick={() =>
                                setSelectedLineId(
                                  selected
                                    ? null
                                    : item.lineId
                                )
                              }
                              style={{
                                width:
                                  "100%",

                                border:
                                  "none",

                                background:
                                  selected
                                    ? "#1E293B"
                                    : "transparent",

                                color:
                                  "white",

                                textAlign:
                                  "left",

                                borderRadius: 8,

                                padding: 8,

                                cursor:
                                  "pointer",
                              }}
                            >
                              <div
                                style={{
                                  display:
                                    "flex",

                                  justifyContent:
                                    "space-between",

                                  gap: 10,
                                }}
                              >
                                <strong>
                                  {item.qty} ×{" "}
                                  {item.name}
                                </strong>

                                <strong>
                                  $
                                  {lineTotal.toFixed(
                                    2
                                  )}
                                </strong>
                              </div>

                              <div
                                style={{
                                  marginTop: 5,

                                  display:
                                    "flex",

                                  gap: 6,

                                  flexWrap:
                                    "wrap",

                                  fontSize: 11,
                                }}
                              >
                                {item.sentQty >
                                  0 && (
                                  <span
                                    style={{
                                      color:
                                        "#86EFAC",
                                    }}
                                  >
                                    ✓ Sent{" "}
                                    {item.sentQty}
                                  </span>
                                )}

                                {unsentQty >
                                  0 && (
                                  <span
                                    style={{
                                      color:
                                        "#FCD34D",
                                    }}
                                  >
                                    New{" "}
                                    {unsentQty}
                                  </span>
                                )}

                                {item.discount >
                                  0 && (
                                  <span
                                    style={{
                                      color:
                                        "#F0ABFC",
                                    }}
                                  >
                                    Discount{" "}
                                    {item.discount}%
                                  </span>
                                )}

                                {item.notes && (
                                  <span
                                    style={{
                                      color:
                                        "#93C5FD",
                                    }}
                                  >
                                    Note:{" "}
                                    {item.notes}
                                  </span>
                                )}

                                {(item.selectedModifiers ?? []).map(
                                  (modifier) => (
                                    <span
                                      key={`${item.lineId}-${modifier.groupId}-${modifier.optionId}`}
                                      style={{
                                        color: "#C4B5FD",
                                      }}
                                    >
                                      {modifier.groupName}:{" "}
                                      {modifier.optionName}
                                      {modifier.priceMode === "replace"
                                        ? ` — $${modifier.priceDelta.toFixed(2)}`
                                        : modifier.priceDelta !== 0
                                        ? ` (${modifier.priceDelta > 0 ? "+" : ""}$${modifier.priceDelta.toFixed(2)})`
                                        : ""}
                                    </span>
                                  )
                                )}

                                {shareText && (
                                  <span
                                    style={{
                                      color:
                                        "#FDE68A",

                                      fontWeight:
                                        "bold",
                                    }}
                                  >
                                    ↔{" "}
                                    {shareText}
                                  </span>
                                )}
                              </div>
                            </button>

                            {selected && (
                              <div
                                style={{
                                  background:
                                    "#0F172A",

                                  borderRadius: 9,

                                  padding: 10,

                                  marginTop: 7,
                                }}
                              >
                                <div
                                  style={{
                                    display:
                                      "flex",

                                    gap: 7,

                                    flexWrap:
                                      "wrap",
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      setDiscountItem(
                                        item
                                      );

                                      setDiscountPercent(
                                        item.discount ||
                                          10
                                      );
                                    }}
                                    style={
                                      actionButton
                                    }
                                  >
                                    Discount
                                  </button>

                                  <button
                                    onClick={() => {
                                      setNotesItem(
                                        item
                                      );

                                      setNotesText(
                                        item.notes
                                      );
                                    }}
                                    style={
                                      actionButton
                                    }
                                  >
                                    Notes
                                  </button>

                                  {(
                                    menuItems.find(
                                      (menuItem) =>
                                        menuItem.id ===
                                        item.menuItemId
                                    )?.modifierGroupIds
                                      .length ?? 0
                                  ) > 0 && (
                                    <button
                                      onClick={() =>
                                        openEditModifierFlow(
                                          item
                                        )
                                      }
                                      style={{
                                        ...actionButton,

                                        border:
                                          "2px solid #8B5CF6",

                                        color:
                                          "#DDD6FE",

                                        opacity: 1,
                                      }}
                                      title={
                                        item.sentQty > 0
                                          ? "Edit sent modifiers and create a Kitchen UPDATE event."
                                          : "Change modifiers before sending to Kitchen."
                                      }
                                    >
                                      Edit Modifiers
                                    </button>
                                  )}

                                  {item.sentQty > 0 && (
                                    <button
                                      onClick={() =>
                                        refireItem(item)
                                      }
                                      style={{
                                        ...actionButton,
                                        border:
                                          "2px solid #F97316",
                                        color:
                                          "#FDBA74",
                                      }}
                                      title="Send the same sent item to Kitchen again without changing the order."
                                    >
                                      Refire
                                    </button>
                                  )}

                                  <button
                                    onClick={() =>
                                      setMoveItem(
                                        item
                                      )
                                    }
                                    style={
                                      actionButton
                                    }
                                  >
                                    Move
                                  </button>

                                  <button
                                    onClick={() =>
                                      openShare(
                                        item
                                      )
                                    }
                                    style={{
                                      ...actionButton,

                                      border:
                                        "2px solid #F59E0B",

                                      color:
                                        "#FDE68A",
                                    }}
                                  >
                                    Share
                                  </button>

                                  <button
                                    onClick={() =>
                                      removeItem(
                                        item
                                      )
                                    }
                                    style={{
                                      ...actionButton,

                                      border:
                                        "2px solid #DC2626",

                                      color:
                                        "#FCA5A5",
                                    }}
                                  >
                                    {item.sentQty >
                                    0
                                      ? "Void"
                                      : "Remove"}
                                  </button>
                                </div>

                                <div
                                  style={{
                                    display:
                                      "flex",

                                    alignItems:
                                      "center",

                                    gap: 10,

                                    marginTop: 10,
                                  }}
                                >
                                  <span
                                    style={{
                                      color:
                                        "#CBD5E1",
                                    }}
                                  >
                                    Quantity
                                  </span>

                                  <button
                                    onClick={() =>
                                      decreaseItem(
                                        item
                                      )
                                    }
                                    style={
                                      qtyButton
                                    }
                                  >
                                    −
                                  </button>

                                  <strong>
                                    {item.qty}
                                  </strong>

                                  <button
                                    onClick={() =>
                                      increaseItem(
                                        item.lineId
                                      )
                                    }
                                    style={
                                      qtyButton
                                    }
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                );
              }
            )}
          </div>

          <div
            style={{
              borderTop:
                "2px solid #334155",

              paddingTop: 8,

              flex: "0 0 auto",
            }}
          >
            <MoneyRow
              label="Subtotal"
              value={subtotal}
            />

            <MoneyRow
              label="Tax 13%"
              value={tax}
            />

            <div
              style={{
                display: "flex",

                justifyContent:
                  "space-between",

                fontSize: 18,

                marginTop: 5,
              }}
            >
              <strong>
                Total
              </strong>

              <strong>
                ${total.toFixed(2)}
              </strong>
            </div>

            <button
              onClick={
                sendToKitchen
              }
              style={{
                width: "100%",

                height: 46,

                marginTop: 8,

                border: "none",

                borderRadius: 10,

                background:
                  unsentCount > 0
                    ? "#F59E0B"
                    : "#475569",

                color: "white",

                fontWeight:
                  "bold",

                fontSize: 17,

                cursor:
                  "pointer",
              }}
            >
              Send to Kitchen
              {unsentCount > 0
                ? ` (${unsentCount} New)`
                : ""}
            </button>

            <button
              onClick={() => {
                if (
                  ticket.length ===
                  0
                ) {
                  alert(
                    "There are no items on this order."
                  );

                  return;
                }

                setShowSplitBill(
                  true
                );
              }}
              style={{
                width: "100%",

                height: 46,

                marginTop: 6,

                border: "none",

                borderRadius: 10,

                background:
                  "#22C55E",

                color: "white",

                fontWeight:
                  "bold",

                fontSize: 17,

                cursor:
                  "pointer",
              }}
            >
              Checkout / Split Bill
            </button>
          </div>
        </div>
      </div>

      {/* MODIFIERS */}

      {/* MODIFIERS */}

      {pendingModifierItem && currentModifierGroup && (
        <Modal
          title={`${
            editingModifierLineId
              ? "Edit "
              : ""
          }${pendingModifierItem.name} — ${currentModifierGroup.name}`}
          onClose={closeModifierFlow}
        >
          <div
            style={{
              background: "#0F172A",
              border: "1px solid #334155",
              borderRadius: 10,
              padding: 10,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <strong>
                {currentModifierGroup.required
                  ? "Required"
                  : "Optional"}
              </strong>

              <span
                style={{
                  color: "#94A3B8",
                  fontSize: 12,
                }}
              >
                {currentModifierGroup.inputType === "single"
                  ? "Choose one"
                  : currentModifierGroup.inputType === "multi"
                  ? `Choose ${currentModifierGroup.minSelect}–${currentModifierGroup.maxSelect}`
                  : currentModifierGroup.inputType === "number"
                  ? `${currentModifierGroup.numberMin}–${currentModifierGroup.numberMax}${
                      currentModifierGroup.unitLabel
                        ? ` ${currentModifierGroup.unitLabel}`
                        : ""
                    }`
                  : `Up to ${currentModifierGroup.textMaxLength} characters`}
              </span>
            </div>
          </div>

          {(currentModifierGroup.inputType === "single" ||
            currentModifierGroup.inputType === "multi") && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              {currentModifierGroup.options
                .filter((option) => option.available)
                .map((option) => {
                  const selected =
                    (
                      modifierSelections[
                        currentModifierGroup.id
                      ] ?? []
                    ).includes(option.id);

                  return (
                    <button
                      key={option.id}
                      onClick={() =>
                        toggleModifierOption(
                          currentModifierGroup,
                          option.id
                        )
                      }
                      style={{
                        minHeight: 58,
                        borderRadius: 10,
                        border: selected
                          ? "3px solid white"
                          : "1px solid #475569",
                        background: selected
                          ? "#2563EB"
                          : "#1E293B",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: "bold",
                        padding: 9,
                      }}
                    >
                      <div>
                        {selected ? "✓ " : ""}
                        {option.name}
                      </div>

                      {(option.priceDelta !== 0 ||
                        option.priceMode === "replace") && (
                        <div
                          style={{
                            marginTop: 5,
                            color: "#86EFAC",
                            fontSize: 12,
                          }}
                        >
                          {option.priceMode === "replace"
                            ? `Price $${option.priceDelta.toFixed(2)}`
                            : `${option.priceDelta > 0 ? "+" : ""}$${option.priceDelta.toFixed(2)}`}
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>
          )}

          {currentModifierGroup.inputType === "number" && (
            <div>
              <input
                type="number"
                min={currentModifierGroup.numberMin}
                max={currentModifierGroup.numberMax}
                step={currentModifierGroup.numberStep}
                value={
                  modifierInputValues[currentModifierGroup.id] ??
                  String(currentModifierGroup.numberDefault)
                }
                onChange={(event) =>
                  setModifierInputValues((all) => ({
                    ...all,
                    [currentModifierGroup.id]: event.target.value,
                  }))
                }
                style={{
                  width: "100%",
                  minHeight: 62,
                  boxSizing: "border-box",
                  borderRadius: 10,
                  border: "2px solid #475569",
                  background: "#0F172A",
                  color: "white",
                  fontSize: 24,
                  fontWeight: 800,
                  textAlign: "center",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(6, minmax(0, 1fr))",
                  gap: 7,
                  marginTop: 9,
                }}
              >
                {Array.from(
                  {
                    length: Math.min(
                      12,
                      Math.max(
                        0,
                        Math.floor(
                          (currentModifierGroup.numberMax -
                            currentModifierGroup.numberMin) /
                            currentModifierGroup.numberStep
                        ) + 1
                      )
                    ),
                  },
                  (_, index) =>
                    currentModifierGroup.numberMin +
                    index * currentModifierGroup.numberStep
                ).map((value) => (
                  <button
                    key={value}
                    onClick={() =>
                      setModifierInputValues((all) => ({
                        ...all,
                        [currentModifierGroup.id]: String(value),
                      }))
                    }
                    style={{
                      ...modalButton,
                      background: "#1E293B",
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>

              {currentModifierGroup.unitLabel && (
                <div
                  style={{
                    marginTop: 8,
                    color: "#94A3B8",
                    textAlign: "center",
                  }}
                >
                  {currentModifierGroup.unitLabel}
                </div>
              )}
            </div>
          )}

          {currentModifierGroup.inputType === "text" && (
            <textarea
              value={
                modifierInputValues[currentModifierGroup.id] ??
                currentModifierGroup.textDefault
              }
              placeholder={currentModifierGroup.textPlaceholder}
              maxLength={currentModifierGroup.textMaxLength}
              onChange={(event) =>
                setModifierInputValues((all) => ({
                  ...all,
                  [currentModifierGroup.id]: event.target.value,
                }))
              }
              style={{
                width: "100%",
                minHeight: 120,
                boxSizing: "border-box",
                borderRadius: 10,
                border: "1px solid #475569",
                background: "#0F172A",
                color: "white",
                padding: 10,
                resize: "vertical",
              }}
            />
          )}

          <button
            onClick={continueModifierFlow}
            style={{
              ...modalButton,
              background: "#22C55E",
              fontSize: 16,
              marginTop: 14,
            }}
          >
            {modifierQueue.length > 1
              ? "Continue"
              : editingModifierLineId
              ? "Save Changes"
              : "Add to Order"}
          </button>
        </Modal>
      )}

      {/* SHARE */}

      {shareItem && (
        <Modal
          title="Share Item"
          onClose={() => {
            setShareItem(
              null
            );

            setShareSelection(
              []
            );
          }}
        >
          <div
            style={{
              background:
                "#1E293B",

              borderRadius: 10,

              padding: 12,

              marginBottom: 12,
            }}
          >
            <strong>
              {shareItem.qty} ×{" "}
              {shareItem.name}
            </strong>

            <div
              style={{
                marginTop: 6,

                color:
                  "#94A3B8",

                fontSize: 12,
              }}
            >
              Sharing changes only the bill. It does not resend the item to Kitchen.
            </div>
          </div>

          <button
            onClick={
              shareWithAll
            }
            style={{
              ...modalButton,

              background:
                "#16A34A",

              fontSize: 16,
            }}
          >
            Share with All Guests
          </button>

          <div
            style={{
              marginTop: 20,

              marginBottom: 8,

              fontWeight:
                "bold",
            }}
          >
            Or select guests:
          </div>

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(2, 1fr)",

              gap: 8,
            }}
          >
            {allGuestNumbers.map(
              (guestNumber) => {
                const selected =
                  shareSelection.includes(
                    guestNumber
                  );

                return (
                  <button
                    key={
                      guestNumber
                    }
                    onClick={() =>
                      toggleShareGuest(
                        guestNumber
                      )
                    }
                    style={{
                      minHeight: 48,

                      borderRadius: 9,

                      border:
                        selected
                          ? "3px solid white"
                          : "1px solid #475569",

                      background:
                        selected
                          ? "#2563EB"
                          : "#1E293B",

                      color:
                        "white",

                      fontWeight:
                        "bold",

                      cursor:
                        "pointer",
                    }}
                  >
                    {selected
                      ? "✓ "
                      : ""}
                    Guest{" "}
                    {guestNumber}
                  </button>
                );
              }
            )}
          </div>

          <button
            onClick={
              shareWithSelected
            }
            style={{
              ...modalButton,

              background:
                "#2563EB",
            }}
          >
            Share with Selected Guests
          </button>

          <button
            onClick={
              keepAsShared
            }
            style={{
              ...modalButton,

              background:
                "#B45309",
            }}
          >
            Keep as Shared / Decide at Checkout
          </button>

          {shareItem.shareMode !==
            "none" && (
            <button
              onClick={
                removeSharing
              }
              style={{
                ...modalButton,

                background:
                  "#7F1D1D",
              }}
            >
              Remove Sharing
            </button>
          )}
        </Modal>
      )}

      {/* MOVE */}

      {moveItem && (
        <Modal
          title="Move Item"
          onClose={() =>
            setMoveItem(null)
          }
        >
          <p>
            Move{" "}
            <strong>
              {moveItem.name}
            </strong>{" "}
            to:
          </p>

          <button
            onClick={() =>
              moveItemToSeat(
                moveItem.lineId,
                "shared"
              )
            }
            style={modalButton}
          >
            Shared
          </button>

          {allGuestNumbers.map(
            (guestNumber) => (
              <button
                key={
                  guestNumber
                }
                onClick={() =>
                  moveItemToSeat(
                    moveItem.lineId,
                    guestNumber
                  )
                }
                style={modalButton}
              >
                Guest{" "}
                {guestNumber}
              </button>
            )
          )}
        </Modal>
      )}

      {/* NOTES */}

      {notesItem && (
        <Modal
          title="Item Notes"
          onClose={() =>
            setNotesItem(null)
          }
        >
          <textarea
            value={notesText}
            onChange={(event) =>
              setNotesText(
                event.target.value
              )
            }
            placeholder="Example: no onion, extra lemon..."
            style={{
              width: "100%",

              minHeight: 120,

              boxSizing:
                "border-box",

              padding: 12,

              borderRadius: 8,

              background:
                "#020617",

              color: "white",

              border:
                "1px solid #475569",
            }}
          />

          <button
            onClick={
              saveNotes
            }
            style={{
              ...modalButton,

              background:
                "#2563EB",
            }}
          >
            Save Note
          </button>
        </Modal>
      )}

      {/* DISCOUNT */}

      {discountItem && (
        <Modal
          title="Item Discount"
          onClose={() =>
            setDiscountItem(
              null
            )
          }
        >
          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(3, 1fr)",

              gap: 8,
            }}
          >
            {[
              5,
              10,
              15,
              20,
              25,
              50,
            ].map(
              (value) => (
                <button
                  key={value}
                  onClick={() =>
                    setDiscountPercent(
                      value
                    )
                  }
                  style={{
                    ...modalButton,

                    background:
                      discountPercent ===
                      value
                        ? "#2563EB"
                        : "#1E293B",
                  }}
                >
                  {value}%
                </button>
              )
            )}
          </div>

          <input
            type="number"
            min="0"
            max="100"
            value={
              discountPercent
            }
            onChange={(event) =>
              setDiscountPercent(
                Number(
                  event.target
                    .value
                )
              )
            }
            style={inputStyle}
          />

          <button
            onClick={
              saveDiscount
            }
            style={{
              ...modalButton,

              background:
                "#2563EB",
            }}
          >
            Apply Discount
          </button>
        </Modal>
      )}

      {/* VOID */}

      {voidItem && (
        <Modal
          title="Void Item"
          onClose={() =>
            setVoidItem(null)
          }
        >
          <div
            style={{
              background:
                "#7F1D1D",

              padding: 12,

              borderRadius: 9,

              marginBottom: 15,
            }}
          >
            <strong>
              {voidItem.name}
            </strong>

            <div
              style={{
                marginTop: 5,
              }}
            >
              Sent Qty:{" "}
              {voidItem.sentQty}
            </div>
          </div>

          <div
            style={{
              display: "flex",

              alignItems:
                "center",

              gap: 12,

              marginBottom: 15,
            }}
          >
            <span>
              Void Quantity:
            </span>

            <button
              onClick={() =>
                setVoidQty(
                  (current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                )
              }
              style={
                qtyButton
              }
            >
              −
            </button>

            <strong>
              {voidQty}
            </strong>

            <button
              onClick={() =>
                setVoidQty(
                  (current) =>
                    Math.min(
                      voidItem.sentQty,
                      current + 1
                    )
                )
              }
              style={
                qtyButton
              }
            >
              +
            </button>
          </div>

          <select
            value={
              voidReason
            }
            onChange={(event) =>
              setVoidReason(
                event.target
                  .value
              )
            }
            style={inputStyle}
          >
            <option value="">
              Select Void Reason
            </option>

            {voidReasons.map(
              (reason) => (
                <option
                  key={reason}
                  value={reason}
                >
                  {reason}
                </option>
              )
            )}
          </select>

          {voidReason ===
            "Other" && (
            <input
              value={
                customVoidReason
              }
              onChange={(event) =>
                setCustomVoidReason(
                  event.target
                    .value
                )
              }
              placeholder="Enter reason"
              style={inputStyle}
            />
          )}

          <button
            onClick={
              confirmVoid
            }
            style={{
              ...modalButton,

              background:
                "#DC2626",
            }}
          >
            Confirm Void
          </button>
        </Modal>
      )}

      {/* OUTPUT / PRINTER JOB QUEUE */}

      {showPrinterQueue && (
        <Modal
          title="Output Job Queue"
          onClose={() =>
            setShowPrinterQueue(false)
          }
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                color: "#94A3B8",
                fontSize: 12,
              }}
            >
              Pending:{" "}
              {
                printerJobs.filter(
                  (job) =>
                    job.status === "PENDING"
                ).length
              }{" "}
              • Failed:{" "}
              {
                printerJobs.filter(
                  (job) =>
                    job.status === "FAILED"
                ).length
              }{" "}
              • Sent:{" "}
              {
                printerJobs.filter(
                  (job) =>
                    job.status === "SENT"
                ).length
              }
            </div>

            <button
              onClick={
                clearSentPrinterJobs
              }
              style={{
                ...modalButton,
                background: "#334155",
                width: "auto",
                padding: "8px 12px",
              }}
            >
              Clear Sent
            </button>
          </div>

          {printerJobs.length === 0 && (
            <p
              style={{
                color: "#94A3B8",
              }}
            >
              No output jobs yet.
            </p>
          )}

          {[...printerJobs]
            .reverse()
            .map((job) => (
              <div
                key={job.id}
                style={historyCard}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div>
                    <strong>
                      {job.deviceName}
                    </strong>

                    <div
                      style={{
                        color: "#FDE68A",
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      {job.eventType} • Route →{" "}
                      {job.stationName}
                    </div>

                    <div
                      style={{
                        color: "#94A3B8",
                        fontSize: 10,
                        marginTop: 3,
                      }}
                    >
                      Created: {job.createdAt} • Attempts:{" "}
                      {job.attempts}
                    </div>
                  </div>

                  <span
                    style={{
                      borderRadius: 999,
                      padding: "4px 9px",
                      fontSize: 11,
                      fontWeight: 900,
                      background:
                        job.status === "PENDING"
                          ? "#854D0E"
                          : job.status === "SENT"
                          ? "#14532D"
                          : "#7F1D1D",
                      color: "white",
                    }}
                  >
                    {job.status}
                  </span>
                </div>

                {job.items.map(
                  (item, index) => (
                    <div
                      key={`${job.id}-${index}`}
                      style={{
                        marginTop: 8,
                        color: "#E2E8F0",
                      }}
                    >
                      {item.qty} ×{" "}
                      {item.name}
                      {" — "}
                      {guestLabel(
                        item.guest
                      )}

                      {item.modifiers?.map(
                        (
                          modifier,
                          modifierIndex
                        ) => (
                          <div
                            key={`${job.id}-${index}-modifier-${modifierIndex}`}
                            style={{
                              color: "#C4B5FD",
                              fontSize: 11,
                              marginTop: 3,
                              paddingLeft: 12,
                            }}
                          >
                            • {modifier}
                          </div>
                        )
                      )}
                    </div>
                  )
                )}

                {job.lastError && (
                  <div
                    style={{
                      color: "#FCA5A5",
                      marginTop: 8,
                      fontSize: 11,
                    }}
                  >
                    Error: {job.lastError}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: 7,
                    marginTop: 10,
                    flexWrap: "wrap",
                  }}
                >
                  {job.status === "PENDING" && (
                    <>
                      <button
                        onClick={() =>
                          markPrinterJobSent(
                            job.id
                          )
                        }
                        style={{
                          ...modalButton,
                          background: "#15803D",
                          width: "auto",
                          padding: "8px 10px",
                        }}
                      >
                        Simulate Sent
                      </button>

                      <button
                        onClick={() =>
                          markPrinterJobFailed(
                            job.id
                          )
                        }
                        style={{
                          ...modalButton,
                          background: "#B91C1C",
                          width: "auto",
                          padding: "8px 10px",
                        }}
                      >
                        Simulate Failure
                      </button>
                    </>
                  )}

                  {job.status === "FAILED" && (
                    <button
                      onClick={() =>
                        retryPrinterJob(
                          job.id
                        )
                      }
                      style={{
                        ...modalButton,
                        background: "#D97706",
                        width: "auto",
                        padding: "8px 10px",
                      }}
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))}
        </Modal>
      )}

      {/* KITCHEN HISTORY */}

      {showKitchenHistory && (
        <Modal
          title="Kitchen History"
          onClose={() =>
            setShowKitchenHistory(
              false
            )
          }
        >
          {kitchenBatches.length ===
            0 && (
            <p
              style={{
                color:
                  "#94A3B8",
              }}
            >
              Nothing sent yet.
            </p>
          )}

          {[...kitchenBatches]
            .reverse()
            .map((batch) => (
              <div
                key={
                  batch.id
                }
                style={
                  historyCard
                }
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div>
                    <strong>
                      {batch.createdAt}
                    </strong>

                    <div
                      style={{
                        color: "#FDE68A",
                        fontSize: 12,
                        marginTop: 4,
                        fontWeight: 800,
                      }}
                    >
                      Route → {batch.stationName}
                    </div>

                    <div
                      style={{
                        color: "#93C5FD",
                        fontSize: 11,
                        marginTop: 3,
                        fontWeight: 700,
                      }}
                    >
                      Device →{" "}
                      {batch.outputDeviceNames.length > 0
                        ? batch.outputDeviceNames.join(" + ")
                        : "Legacy / No Device Snapshot"}
                    </div>
                  </div>

                  <span
                    style={{
                      borderRadius: 999,
                      padding: "4px 9px",
                      fontSize: 11,
                      fontWeight: 900,
                      background:
                        batch.eventType === "NEW"
                          ? "#14532D"
                          : batch.eventType ===
                            "UPDATE"
                          ? "#1D4ED8"
                          : batch.eventType ===
                            "CANCEL"
                          ? "#7F1D1D"
                          : "#9A3412",
                      color: "white",
                    }}
                  >
                    {batch.eventType}
                  </span>
                </div>

                {batch.items.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={`${batch.id}-${index}`}
                      style={{
                        marginTop: 7,
                      }}
                    >
                      {item.qty} ×{" "}
                      {item.name}
                      {" — "}
                      {guestLabel(
                        item.guest
                      )}

                      {batch.eventType ===
                        "UPDATE" &&
                        item.previousModifiers &&
                        item.previousModifiers.length >
                          0 && (
                          <div
                            style={{
                              color: "#FCA5A5",
                              fontSize: 12,
                              marginTop: 5,
                              paddingLeft: 12,
                            }}
                          >
                            BEFORE:{" "}
                            {item.previousModifiers.join(
                              " | "
                            )}
                          </div>
                        )}

                      {batch.eventType ===
                        "UPDATE" &&
                        item.modifiers.length >
                          0 && (
                          <div
                            style={{
                              color: "#86EFAC",
                              fontSize: 12,
                              marginTop: 3,
                              paddingLeft: 12,
                            }}
                          >
                            AFTER:
                          </div>
                        )}

                      {item.modifiers?.map(
                        (modifier, modifierIndex) => (
                          <div
                            key={`${batch.id}-${index}-modifier-${modifierIndex}`}
                            style={{
                              color: "#C4B5FD",
                              fontSize: 12,
                              marginTop: 3,
                              paddingLeft: 12,
                            }}
                          >
                            • {modifier}
                          </div>
                        )
                      )}

                      {item.reason && (
                        <div
                          style={{
                            color: "#FDE68A",
                            fontSize: 11,
                            marginTop: 4,
                            paddingLeft: 12,
                          }}
                        >
                          Reason: {item.reason}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            ))}
        </Modal>
      )}

      {/* VOID HISTORY */}

      {showVoidHistory && (
        <Modal
          title="Void History"
          onClose={() =>
            setShowVoidHistory(
              false
            )
          }
        >
          {voidRecords.length ===
            0 && (
            <p
              style={{
                color:
                  "#94A3B8",
              }}
            >
              No voids yet.
            </p>
          )}

          {[...voidRecords]
            .reverse()
            .map(
              (record) => (
                <div
                  key={
                    record.id
                  }
                  style={
                    historyCard
                  }
                >
                  <strong>
                    {
                      record.itemName
                    }
                  </strong>

                  <div>
                    Qty:{" "}
                    {
                      record.qty
                    }
                  </div>

                  <div>
                    {guestLabel(
                      record.guest
                    )}
                  </div>

                  <div>
                    Reason:{" "}
                    {
                      record.reason
                    }
                  </div>

                  <div
                    style={{
                      color:
                        "#94A3B8",

                      fontSize: 12,

                      marginTop: 5,
                    }}
                  >
                    {
                      record.createdAt
                    }
                  </div>
                </div>
              )
            )}
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",

        inset: 0,

        background:
          "rgba(0,0,0,.8)",

        display: "flex",

        justifyContent:
          "center",

        alignItems:
          "center",

        zIndex: 9999,

        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",

          maxWidth: 480,

          maxHeight: "85vh",

          overflowY:
            "auto",

          background:
            "#111827",

          color: "white",

          borderRadius: 18,

          padding: 25,
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          {title}
        </h2>

        {children}

        <button
          onClick={
            onClose
          }
          style={{
            ...modalButton,

            background:
              "#475569",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function MoneyRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      style={{
        display: "flex",

        justifyContent:
          "space-between",

        padding:
          "5px 0",

        color:
          "#CBD5E1",
      }}
    >
      <span>
        {label}
      </span>

      <strong>
        ${value.toFixed(2)}
      </strong>
    </div>
  );
}

const topButton = (
  background: string
) => ({
  background,

  color: "white",

  border: "none",

  borderRadius: 8,

  padding:
    "10px 14px",

  cursor:
    "pointer",

  fontWeight:
    "bold" as const,
});

const guestButton = (
  selected: boolean
) => ({
  minWidth: 100,

  height: 55,

  borderRadius: 10,

  border: selected
    ? "3px solid white"
    : "1px solid #475569",

  background: selected
    ? "#2563EB"
    : "#1E293B",

  color: "white",

  fontWeight:
    "bold" as const,

  cursor:
    "pointer",
});

const actionButton = {
  minHeight: 38,

  borderRadius: 8,

  border:
    "2px solid #2563EB",

  background:
    "#111827",

  color:
    "#93C5FD",

  padding:
    "7px 10px",

  fontWeight:
    "bold" as const,

  cursor:
    "pointer",
};

const qtyButton = {
  width: 34,

  height: 34,

  border: "none",

  borderRadius: 7,

  background:
    "#334155",

  color: "white",

  cursor:
    "pointer",

  fontSize: 18,
};

const modalButton = {
  width: "100%",

  minHeight: 46,

  marginTop: 10,

  border: "none",

  borderRadius: 9,

  background:
    "#1E293B",

  color: "white",

  fontWeight:
    "bold" as const,

  cursor:
    "pointer",
};

const inputStyle = {
  width: "100%",

  boxSizing:
    "border-box" as const,

  height: 44,

  marginTop: 10,

  padding:
    "0 10px",

  background:
    "#020617",

  color: "white",

  border:
    "1px solid #475569",

  borderRadius: 8,
};

const historyCard = {
  background:
    "#1E293B",

  borderRadius: 10,

  padding: 12,

  marginBottom: 10,
};