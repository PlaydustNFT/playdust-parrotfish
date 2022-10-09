import { CollectionPrice, Marketplace, OrderStateEntityData } from "../../../shared/src/types";

export const calculateCeilingPriceByMarketplace = (
  activeOrders: OrderStateEntityData[]
): CollectionPrice => {
  return calculatePriceByMarketplace(activeOrders, Math.max, Number.NEGATIVE_INFINITY);
}
export const calculateFloorPriceByMarketplace = (
  activeOrders: OrderStateEntityData[]
): CollectionPrice => {
  return calculatePriceByMarketplace(activeOrders, Math.min, Number.POSITIVE_INFINITY);
}
export const calculatePriceByMarketplace = (
  activeOrders: OrderStateEntityData[],
  comparisonFunction: Function,
  initializationValue: number,
): CollectionPrice => {
  let prices: CollectionPrice = {} as CollectionPrice;
  prices.byMarketplace = new Map<Marketplace, number>();
  for (const order of activeOrders) {
    /** Only initialize global price if some active order(s) exist */
    if (!prices.global) {
      prices.global = initializationValue;
    }

    let current = prices.byMarketplace.get(order.marketplace);
    if (!current) {
      current = initializationValue;
    }
    let update = comparisonFunction(order.price, current);
    if (update != current) {
      prices.byMarketplace.set(order.marketplace, update);
    }
    prices.global = comparisonFunction(update, prices.global);
  }
  return prices;
}
