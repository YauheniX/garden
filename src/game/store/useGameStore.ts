import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  FERTILIZER_BUY_AMOUNT,
  FERTILIZER_BUY_PRICE,
  FERTILIZER_UNIT_PRICE,
  PLOT_UNLOCK_COST,
  STARTING_RESOURCES,
  WATER_BUY_AMOUNT,
  WATER_BUY_PRICE,
  WATER_UNIT_PRICE,
  type FlowerQuality,
  type WeatherType,
} from '../config/balance';
import { FLOWERS, getFlower, type FlowerId } from '../config/flowers';
import { SECRET_RECIPES } from '../config/recipes';
import {
  MERCHANT_VISIT_DURATION_SEC,
  type MerchantId,
} from '../config/merchants';
import { getDecor, type DecorId } from '../config/decor';
import {
  decodeGift,
  encodeGift,
  type DecodedGift,
} from '../../telegram/gifts';
import {
  canBuyMerchantOffer,
  generateMerchantOffers,
  getMerchantState,
  type MerchantVisit,
} from '../engine/merchants';
import {
  calculateBouquetPrice,
  isValidBouquetCount,
  type BouquetCraftResult,
} from '../engine/crafting';
import { getPlotGrowthState, rollHarvestQuality } from '../engine/growth';
import {
  calculateOrderReward,
  generateOrder,
  getAvailableFlowerTags,
  validateOrderFulfillment,
  type NpcOrder,
  type OrderRewardResult,
} from '../engine/orders';
import { haptic } from '../../telegram/tma';

export interface LeaderboardEntry {
  id: string;
  name: string;
  title: string;
  avatar: string;
  reputation: number;
  isPlayer?: boolean;
}

export const ANIMAL_RIVALS: Omit<LeaderboardEntry, 'isPlayer'>[] = [
  { id: 'rival_panda', name: 'Master Panda Bao', title: 'Grand Floral Sage', avatar: '🐼', reputation: 320 },
  { id: 'rival_owl', name: 'Professor Hoot', title: 'Ancient Herbalist', avatar: '🦉', reputation: 240 },
  { id: 'rival_fox', name: 'Lord Felix', title: 'Velvet Rose Connoisseur', avatar: '🦊', reputation: 180 },
  { id: 'rival_bear', name: 'Barnaby Honey-Paw', title: 'Sunflower King', avatar: '🐻', reputation: 130 },
  { id: 'rival_capy', name: 'Zen Clement', title: 'Lavender Monk', avatar: '🥔', reputation: 90 },
  { id: 'rival_rabbit', name: 'Rosie Hopscotch', title: 'Speedy Tulip Harvester', avatar: '🐰', reputation: 60 },
  { id: 'rival_hedgehog', name: 'Hattie Quillbaker', title: 'Daisy Weaver', avatar: '🦔', reputation: 35 },
  { id: 'rival_squirrel', name: 'Hazel Nutkin', title: 'Sprout Gatherer', avatar: '🐿️', reputation: 20 },
  { id: 'rival_otter', name: 'Ollie Splash', title: 'Spring Waterer', avatar: '🦦', reputation: 10 },
];

export function getLeaderboard(
  reputation: number,
  playerName: string
): LeaderboardEntry[] {
  const playerTitle =
    reputation >= 300
      ? 'Legendary Florist'
      : reputation >= 150
      ? 'Master Florist'
      : reputation >= 75
      ? 'Journeyman Florist'
      : reputation >= 25
      ? 'Green Thumb Florist'
      : 'Novice Florist';

  const playerEntry: LeaderboardEntry = {
    id: 'player_entry',
    name: playerName || 'Panda Florist (You)',
    title: playerTitle,
    avatar: '🐼',
    reputation,
    isPlayer: true,
  };

  const combined = [...ANIMAL_RIVALS, playerEntry];
  combined.sort((a, b) => b.reputation - a.reputation);
  return combined.slice(0, 10);
}

export interface GardenPlotState {
  id: string;
  unlocked: boolean;
  flowerId: FlowerId | null;
  plantedAt: number | null;
  wateredAt: number | null;
  fertilized: boolean;
}

export interface HarvestedFlower {
  id: string;
  flowerId: FlowerId;
  quality: FlowerQuality;
  harvestedAt: number;
}

export interface MinigameCooldowns {
  wellReadyAt: number;
  compostReadyAt: number;
}

export interface FulfillOrderResult {
  success: boolean;
  reward?: OrderRewardResult;
  bouquet?: BouquetCraftResult;
  reason?: string;
}

export interface GameState {
  coins: number;
  water: number;
  fertilizer: number;
  reputation: number;
  weather: WeatherType;
  weatherUpdatedAt: number;
  plots: GardenPlotState[];
  seeds: Record<FlowerId, number>;
  harvestedFlowers: HarvestedFlower[];
  unlockedRecipes: string[];
  activeOrders: NpcOrder[];
  merchantVisit: MerchantVisit | null;
  nextMerchantAt: number;
  minigameCooldowns: MinigameCooldowns;
  unlockedDecor: DecorId[];
  receivedGifts: string[];
}

export interface GameActions {
  plantSeed: (plotId: string, flowerId: FlowerId) => boolean;
  waterPlot: (plotId: string) => boolean;
  fertilizePlot: (plotId: string) => boolean;
  harvestPlot: (plotId: string, now?: number) => HarvestedFlower | null;
  craftBouquet: (harvestedIds: string[]) => BouquetCraftResult | null;
  sellFreeBouquet: (harvestedIds: string[]) => BouquetCraftResult | null;
  fulfillOrder: (orderId: string, harvestedIds: string[]) => FulfillOrderResult;
  syncMerchant: (now?: number) => void;
  buyMerchantOffer: (offerId: string) => { success: boolean; reason?: string };
  summonMerchant: (merchantId?: MerchantId) => void;
  purchaseDecor: (decorId: DecorId) => boolean;
  claimTelegramGift: (startParam: string) => {
    success: boolean;
    gift?: DecodedGift;
    reason?: string;
  };
  wrapBouquetGift: (harvestedIds: string[]) => {
    success: boolean;
    giftParam?: string;
    bouquet?: BouquetCraftResult;
    reason?: string;
  };
  buySeed: (flowerId: FlowerId, qty?: number) => boolean;
  buyWater: (qty?: number) => boolean;
  buyFertilizer: (qty?: number) => boolean;
  unlockPlot: (plotId: string) => boolean;
  claimMinigameReward: (
    type: 'well' | 'compost',
    amount: number,
    cooldownSec: number
  ) => boolean;
  setWeather: (weather: WeatherType) => void;
  resetGame: () => void;
}

export type GameStore = GameState & GameActions;

export function createDefaultPlots(): GardenPlotState[] {
  return Array.from({ length: 9 }, (_, index) => ({
    id: `plot_${index}`,
    unlocked: index < 6, // first 6 unlocked, 3 locked
    flowerId: null,
    plantedAt: null,
    wateredAt: null,
    fertilized: false,
  }));
}

export function createInitialState(): GameState {
  const seedsRecord: Record<FlowerId, number> = {
    daisy: STARTING_RESOURCES.seeds.daisy ?? 4,
    tulip: STARTING_RESOURCES.seeds.tulip ?? 2,
    lavender: STARTING_RESOURCES.seeds.lavender ?? 0,
    sunflower: STARTING_RESOURCES.seeds.sunflower ?? 0,
    rose: STARTING_RESOURCES.seeds.rose ?? 0,
    orchid: STARTING_RESOURCES.seeds.orchid ?? 0,
  };

  return {
    coins: STARTING_RESOURCES.coins,
    water: STARTING_RESOURCES.water,
    fertilizer: STARTING_RESOURCES.fertilizer,
    reputation: STARTING_RESOURCES.reputation,
    weather: 'sunny',
    weatherUpdatedAt: Date.now(),
    plots: createDefaultPlots(),
    seeds: seedsRecord,
    harvestedFlowers: [],
    unlockedRecipes: [],
    activeOrders: [
      generateOrder([]),
      generateOrder([]),
      generateOrder([]),
    ],
    merchantVisit: null,
    nextMerchantAt: Date.now() + 60 * 1000,
    unlockedDecor: [],
    receivedGifts: [],
    minigameCooldowns: {
      wellReadyAt: 0,
      compostReadyAt: 0,
    },
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      plantSeed: (plotId, flowerId) => {
        const state = get();
        const plot = state.plots.find((p) => p.id === plotId);

        if (!plot || !plot.unlocked || plot.flowerId !== null) {
          return false;
        }

        const availableSeeds = state.seeds[flowerId] ?? 0;
        if (availableSeeds <= 0) {
          return false;
        }

        set({
          seeds: {
            ...state.seeds,
            [flowerId]: availableSeeds - 1,
          },
          plots: state.plots.map((p) =>
            p.id === plotId
              ? {
                  ...p,
                  flowerId,
                  plantedAt: Date.now(),
                  wateredAt: null,
                  fertilized: false,
                }
              : p
          ),
        });

        haptic('medium');
        return true;
      },

      waterPlot: (plotId) => {
        const state = get();
        const plot = state.plots.find((p) => p.id === plotId);

        if (!plot || !plot.unlocked || plot.flowerId === null) {
          return false;
        }

        const isRainy = state.weather === 'rainy';

        // Rainy weather waters crops for free, otherwise requires 1 water
        if (!isRainy && state.water < 1) {
          return false;
        }

        set({
          water: isRainy ? state.water : state.water - 1,
          plots: state.plots.map((p) =>
            p.id === plotId ? { ...p, wateredAt: Date.now() } : p
          ),
        });

        haptic('light');
        return true;
      },

      fertilizePlot: (plotId) => {
        const state = get();
        const plot = state.plots.find((p) => p.id === plotId);

        if (
          !plot ||
          !plot.unlocked ||
          plot.flowerId === null ||
          plot.fertilized ||
          state.fertilizer < 1
        ) {
          return false;
        }

        set({
          fertilizer: state.fertilizer - 1,
          plots: state.plots.map((p) =>
            p.id === plotId ? { ...p, fertilized: true } : p
          ),
        });

        haptic('light');
        return true;
      },

      harvestPlot: (plotId, now) => {
        const state = get();
        const plot = state.plots.find((p) => p.id === plotId);

        if (
          !plot ||
          !plot.unlocked ||
          plot.flowerId === null ||
          plot.plantedAt === null
        ) {
          return null;
        }

        const flowerDef = getFlower(plot.flowerId);
        const currentTime = now ?? Date.now();

        const growth = getPlotGrowthState({
          plantedAt: plot.plantedAt,
          baseGrowthSec: flowerDef.baseGrowthSec,
          isWatered: Boolean(plot.wateredAt),
          wateredAt: plot.wateredAt,
          weather: state.weather,
          now: currentTime,
        });

        if (growth.stage !== 'bloom') {
          return null;
        }

        const quality = rollHarvestQuality({
          isFertilized: plot.fertilized,
          weather: state.weather,
        });

        const harvestedFlower: HarvestedFlower = {
          id: `hf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          flowerId: plot.flowerId,
          quality,
          harvestedAt: currentTime,
        };

        set({
          harvestedFlowers: [...state.harvestedFlowers, harvestedFlower],
          reputation: state.reputation + 1,
          plots: state.plots.map((p) =>
            p.id === plotId
              ? {
                  ...p,
                  flowerId: null,
                  plantedAt: null,
                  wateredAt: null,
                  fertilized: false,
                }
              : p
          ),
        });

        haptic('success');
        return harvestedFlower;
      },

      craftBouquet: (harvestedIds) => {
        const state = get();

        if (!isValidBouquetCount(harvestedIds.length)) {
          return null;
        }

        // Check if all requested harvested IDs exist in inventory
        const selectedFlowers: HarvestedFlower[] = [];
        const remainingInventory = [...state.harvestedFlowers];

        for (const id of harvestedIds) {
          const index = remainingInventory.findIndex((f) => f.id === id);
          if (index === -1) {
            return null; // Missing item from inventory
          }
          selectedFlowers.push(remainingInventory[index]);
          remainingInventory.splice(index, 1);
        }

        // Format for pure crafting engine
        const craftInputs = selectedFlowers.map((f) => ({
          id: f.flowerId,
          quality: f.quality,
        }));

        const result = calculateBouquetPrice(craftInputs);

        const newUnlockedRecipes =
          result.isSecretRecipe &&
          !state.unlockedRecipes.includes(result.recipeKey)
            ? [...state.unlockedRecipes, result.recipeKey]
            : state.unlockedRecipes;

        const reputationGain = result.isSecretRecipe ? 15 : 5;

        set({
          harvestedFlowers: remainingInventory,
          coins: state.coins + result.finalPrice,
          reputation: state.reputation + reputationGain,
          unlockedRecipes: newUnlockedRecipes,
        });

        haptic(result.isSecretRecipe ? 'heavy' : 'success');
        return result;
      },

      sellFreeBouquet: (harvestedIds) => {
        return get().craftBouquet(harvestedIds);
      },

      fulfillOrder: (orderId, harvestedIds) => {
        const state = get();
        const order = state.activeOrders.find((o) => o.id === orderId);

        if (!order) {
          return { success: false, reason: 'Order not found or already fulfilled.' };
        }

        if (!isValidBouquetCount(harvestedIds.length)) {
          return {
            success: false,
            reason: 'Bouquet must contain between 3 and 5 flowers.',
          };
        }

        // Verify flowers are in inventory
        const selectedFlowers: HarvestedFlower[] = [];
        const remainingInventory = [...state.harvestedFlowers];

        for (const id of harvestedIds) {
          const index = remainingInventory.findIndex((f) => f.id === id);
          if (index === -1) {
            return {
              success: false,
              reason: 'Selected flower is no longer in inventory.',
            };
          }
          selectedFlowers.push(remainingInventory[index]);
          remainingInventory.splice(index, 1);
        }

        // Validate fulfillment criteria
        const flowerInputs = selectedFlowers.map((f) => ({
          id: f.flowerId,
          quality: f.quality,
        }));

        const validation = validateOrderFulfillment(order, flowerInputs);
        if (!validation.valid) {
          return { success: false, reason: validation.reason };
        }

        // Craft the bouquet
        const bouquetResult = calculateBouquetPrice(flowerInputs);

        // Calculate rewards
        const reward = calculateOrderReward(order, bouquetResult);

        // Update unlocked recipes if secret recipe was used
        const newUnlockedRecipes =
          bouquetResult.isSecretRecipe &&
          !state.unlockedRecipes.includes(bouquetResult.recipeKey)
            ? [...state.unlockedRecipes, bouquetResult.recipeKey]
            : state.unlockedRecipes;

        // Remove completed order and append a fresh new customer order
        const remainingOrders = state.activeOrders.filter((o) => o.id !== orderId);
        const newOrder = generateOrder(newUnlockedRecipes, Math.random, remainingOrders);
        const updatedOrders = [...remainingOrders, newOrder].slice(0, 3);

        set({
          harvestedFlowers: remainingInventory,
          coins: state.coins + reward.coins,
          reputation: state.reputation + reward.reputation,
          unlockedRecipes: newUnlockedRecipes,
          activeOrders: updatedOrders,
        });

        haptic(bouquetResult.isSecretRecipe ? 'heavy' : 'success');
        return {
          success: true,
          reward,
          bouquet: bouquetResult,
        };
      },

      syncMerchant: (now = Date.now()) => {
        const state = get();
        const result = getMerchantState({
          currentVisit: state.merchantVisit,
          nextMerchantAt: state.nextMerchantAt,
          unlockedRecipes: state.unlockedRecipes,
          now,
        });

        if (
          result.currentVisit !== state.merchantVisit ||
          result.nextMerchantAt !== state.nextMerchantAt
        ) {
          set({
            merchantVisit: result.currentVisit,
            nextMerchantAt: result.nextMerchantAt,
          });
        }
      },

      buyMerchantOffer: (offerId) => {
        const state = get();
        if (!state.merchantVisit) {
          return {
            success: false,
            reason: 'No traveling merchant is currently visiting.',
          };
        }

        const offerIndex = state.merchantVisit.offers.findIndex(
          (o) => o.id === offerId
        );
        if (offerIndex === -1) {
          return { success: false, reason: 'Offer not found.' };
        }

        const offer = state.merchantVisit.offers[offerIndex];
        const validation = canBuyMerchantOffer(offer, state.coins);
        if (!validation.canBuy) {
          return { success: false, reason: validation.reason };
        }

        let nextSeeds = state.seeds;
        let nextUnlockedRecipes = state.unlockedRecipes;

        if (offer.type === 'seed' && offer.flowerId) {
          nextSeeds = {
            ...state.seeds,
            [offer.flowerId]:
              (state.seeds[offer.flowerId] ?? 0) + offer.quantityPerPurchase,
          };
        } else if (offer.type === 'recipe_scroll' && offer.recipeKey) {
          if (!state.unlockedRecipes.includes(offer.recipeKey)) {
            nextUnlockedRecipes = [...state.unlockedRecipes, offer.recipeKey];
          }
        }

        const updatedOffers = state.merchantVisit.offers.map((o) =>
          o.id === offerId ? { ...o, stock: o.stock - 1 } : o
        );

        set({
          coins: state.coins - offer.price,
          seeds: nextSeeds,
          unlockedRecipes: nextUnlockedRecipes,
          merchantVisit: {
            ...state.merchantVisit,
            offers: updatedOffers,
          },
        });

        haptic('success');
        return { success: true };
      },

      summonMerchant: (merchantId) => {
        const state = get();
        const chosenId: MerchantId =
          merchantId ??
          (state.merchantVisit?.merchantId === 'raccoon' ? 'owl' : 'raccoon');
        const now = Date.now();
        const leavesAt = now + MERCHANT_VISIT_DURATION_SEC * 1000;
        const offers = generateMerchantOffers(chosenId, state.unlockedRecipes);

        set({
          merchantVisit: {
            merchantId: chosenId,
            arrivedAt: now,
            leavesAt,
            offers,
          },
          nextMerchantAt: leavesAt + 1800 * 1000,
        });

        haptic('medium');
      },

      purchaseDecor: (decorId) => {
        const state = get();
        if (state.unlockedDecor.includes(decorId)) {
          return false;
        }

        const decor = getDecor(decorId);
        if (state.coins < decor.coinCost) {
          return false;
        }

        set({
          coins: state.coins - decor.coinCost,
          unlockedDecor: [...state.unlockedDecor, decorId],
          reputation: state.reputation + decor.reputationBonus,
        });

        haptic('success');
        return true;
      },

      claimTelegramGift: (startParam) => {
        const state = get();
        if (state.receivedGifts.includes(startParam)) {
          return {
            success: false,
            reason: 'This gift has already been claimed!',
          };
        }

        const gift = decodeGift(startParam);
        if (!gift.isValid) {
          return {
            success: false,
            reason: 'Invalid or corrupted gift link.',
          };
        }

        // Convert gift flowers to HarvestedFlower objects
        const newHarvested: HarvestedFlower[] = gift.flowers.map((f, idx) => ({
          id: `gift_flower_${Date.now()}_${idx}`,
          flowerId: f.id,
          quality: f.quality,
          harvestedAt: Date.now(),
        }));

        const newSeeds = {
          ...state.seeds,
          [gift.bonusSeeds.flowerId]:
            (state.seeds[gift.bonusSeeds.flowerId] ?? 0) +
            gift.bonusSeeds.count,
        };

        set({
          harvestedFlowers: [...state.harvestedFlowers, ...newHarvested],
          seeds: newSeeds,
          coins: state.coins + gift.bonusCoins,
          receivedGifts: [...state.receivedGifts, startParam],
          reputation: state.reputation + 10,
        });

        haptic('heavy');
        return { success: true, gift };
      },

      wrapBouquetGift: (harvestedIds) => {
        const state = get();
        if (!isValidBouquetCount(harvestedIds.length)) {
          return {
            success: false,
            reason: 'Gifts must contain between 3 and 5 flowers.',
          };
        }

        const selectedFlowers: HarvestedFlower[] = [];
        const remainingInventory = [...state.harvestedFlowers];

        for (const id of harvestedIds) {
          const index = remainingInventory.findIndex((f) => f.id === id);
          if (index === -1) {
            return {
              success: false,
              reason: 'Selected flower is no longer in inventory.',
            };
          }
          selectedFlowers.push(remainingInventory[index]);
          remainingInventory.splice(index, 1);
        }

        const flowerItems = selectedFlowers.map((f) => ({
          id: f.flowerId,
          quality: f.quality,
        }));

        const giftParam = encodeGift(flowerItems);
        const bouquet = calculateBouquetPrice(flowerItems);

        const newUnlockedRecipes =
          bouquet.isSecretRecipe &&
          !state.unlockedRecipes.includes(bouquet.recipeKey)
            ? [...state.unlockedRecipes, bouquet.recipeKey]
            : state.unlockedRecipes;

        set({
          harvestedFlowers: remainingInventory,
          unlockedRecipes: newUnlockedRecipes,
          reputation: state.reputation + 5,
        });

        haptic('success');
        return {
          success: true,
          giftParam,
          bouquet,
        };
      },

      buySeed: (flowerId, qty = 1) => {
        if (qty <= 0) return false;
        const state = get();
        const flower = FLOWERS[flowerId];
        if (!flower) return false;

        const totalCost = flower.seedPrice * qty;
        if (state.coins < totalCost) return false;

        set({
          coins: state.coins - totalCost,
          seeds: {
            ...state.seeds,
            [flowerId]: (state.seeds[flowerId] ?? 0) + qty,
          },
        });

        haptic('light');
        return true;
      },

      buyWater: (qty = WATER_BUY_AMOUNT) => {
        if (qty <= 0) return false;
        const state = get();
        const totalCost =
          qty === WATER_BUY_AMOUNT
            ? WATER_BUY_PRICE
            : WATER_UNIT_PRICE * qty;
        if (state.coins < totalCost) return false;

        set({
          coins: state.coins - totalCost,
          water: state.water + qty,
        });

        haptic('light');
        return true;
      },

      buyFertilizer: (qty = FERTILIZER_BUY_AMOUNT) => {
        if (qty <= 0) return false;
        const state = get();
        const totalCost =
          qty === FERTILIZER_BUY_AMOUNT
            ? FERTILIZER_BUY_PRICE
            : FERTILIZER_UNIT_PRICE * qty;
        if (state.coins < totalCost) return false;

        set({
          coins: state.coins - totalCost,
          fertilizer: state.fertilizer + qty,
        });

        haptic('light');
        return true;
      },

      unlockPlot: (plotId) => {
        const state = get();
        const plot = state.plots.find((p) => p.id === plotId);

        if (!plot || plot.unlocked) return false;
        if (state.coins < PLOT_UNLOCK_COST) return false;

        set({
          coins: state.coins - PLOT_UNLOCK_COST,
          plots: state.plots.map((p) =>
            p.id === plotId ? { ...p, unlocked: true } : p
          ),
        });

        haptic('success');
        return true;
      },

      claimMinigameReward: (type, amount, cooldownSec) => {
        const state = get();
        const now = Date.now();
        const cooldownKey =
          type === 'well' ? 'wellReadyAt' : 'compostReadyAt';

        if (now < state.minigameCooldowns[cooldownKey]) {
          return false;
        }

        const nextReadyAt = now + cooldownSec * 1000;

        set({
          water: type === 'well' ? state.water + amount : state.water,
          fertilizer:
            type === 'compost' ? state.fertilizer + amount : state.fertilizer,
          minigameCooldowns: {
            ...state.minigameCooldowns,
            [cooldownKey]: nextReadyAt,
          },
        });

        haptic('success');
        return true;
      },

      setWeather: (weather) => {
        set({
          weather,
          weatherUpdatedAt: Date.now(),
        });
      },

      resetGame: () => {
        set(createInitialState());
      },
    }),
    {
      name: 'panda-florist-save-v1',
      onRehydrateStorage: () => (state) => {
        if (state && (!state.activeOrders || state.activeOrders.length === 0)) {
          const o1 = generateOrder(state.unlockedRecipes ?? []);
          const o2 = generateOrder(state.unlockedRecipes ?? [], Math.random, [o1]);
          const o3 = generateOrder(state.unlockedRecipes ?? [], Math.random, [o1, o2]);
          state.activeOrders = [o1, o2, o3];
        } else if (state && state.activeOrders) {
          const availableTags = getAvailableFlowerTags(state.unlockedRecipes ?? []);
          const seenRecipeKeys = new Set<string>();
          state.activeOrders = state.activeOrders.map((order, idx, arr) => {
            const isInvalidTag =
              order.type === 'tag_constraint' &&
              order.requiredTag &&
              !availableTags.has(order.requiredTag);

            const isDuplicateRecipe =
              order.type === 'recipe' &&
              order.requiredRecipeKey &&
              seenRecipeKeys.has(order.requiredRecipeKey);

            const isUnknownRecipe =
              order.type === 'recipe' &&
              (!order.requiredRecipeKey ||
                !(state.unlockedRecipes ?? []).includes(order.requiredRecipeKey) ||
                !SECRET_RECIPES[order.requiredRecipeKey]);

            const isOversizedStarter =
              (state.unlockedRecipes ?? []).length === 0 && order.flowerCount > 3;

            if (isInvalidTag || isDuplicateRecipe || isUnknownRecipe || isOversizedStarter) {
              const otherOrders = arr.filter((_, i) => i !== idx);
              return generateOrder(state.unlockedRecipes ?? [], Math.random, otherOrders);
            }

            if (order.type === 'recipe' && order.requiredRecipeKey) {
              seenRecipeKeys.add(order.requiredRecipeKey);
            }
            return order;
          });
        }
        if (state && !state.nextMerchantAt) {
          state.nextMerchantAt = Date.now() + 60 * 1000;
        }
        if (state) {
          if (!state.unlockedDecor) state.unlockedDecor = [];
          if (!state.receivedGifts) state.receivedGifts = [];
        }
      },
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage;
        }
        const memoryStore = new Map<string, string>();
        return {
          getItem: (key: string) => memoryStore.get(key) ?? null,
          setItem: (key: string, value: string) => {
            memoryStore.set(key, value);
          },
          removeItem: (key: string) => {
            memoryStore.delete(key);
          },
        };
      }),
    }
  )
);
