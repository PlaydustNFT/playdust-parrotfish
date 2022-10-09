import { calculateCeilingPriceByMarketplace, calculateFloorPriceByMarketplace } from "../../src/calculator/price";
import { Marketplace, OrderStateEntityData } from "../../../shared/src/types";

const createOrder = (
    active: boolean,
    blocktime: number,
    marketplace: Marketplace,
    price: number,
    signature: string,
): OrderStateEntityData => {
    const o = new OrderStateEntityData();
    o.active = active;
    o.blockTime = blocktime;
    o.marketplace = marketplace;
    o.price = price;
    o.signature = signature;
    return o;
}

describe("Verify price calculator", () => {
  /**
   * Steps:
   *  - given a set of active asks
   *  - verify floor price calculation per marketplace
   *  - verify ceiling price calculation per marketplace
   *  - verify total volume calculation per marketplace
   */
  const orders: OrderStateEntityData[] = [];
  orders.push(createOrder(true, 12345, Marketplace.MagicEdenV1, 1.0, 'sig0'));
  orders.push(createOrder(true, 12345, Marketplace.MagicEdenV1, 1.5, 'sig1'));
  orders.push(createOrder(true, 12345, Marketplace.MagicEdenV1, 0.7, 'sig2'));
  orders.push(createOrder(true, 12345, Marketplace.MagicEdenV1, 6.9, 'sig3'));

  orders.push(createOrder(true, 12345, Marketplace.MagicEdenV2, 3.0, 'sig0'));
  orders.push(createOrder(true, 12345, Marketplace.MagicEdenV2, 0.2, 'sig1'));
  orders.push(createOrder(true, 12345, Marketplace.MagicEdenV2, 2.7, 'sig2'));
  orders.push(createOrder(true, 12345, Marketplace.MagicEdenV2, 420.69, 'sig3'));

  const floor = calculateFloorPriceByMarketplace(orders);
  const ceiling  = calculateCeilingPriceByMarketplace(orders);

  it('Verify marketplace floor prices', () => {
      expect(floor.byMarketplace.get(Marketplace.MagicEdenV1)).toStrictEqual(0.7);
      expect(floor.byMarketplace.get(Marketplace.MagicEdenV2)).toStrictEqual(0.2);
      expect(floor.global).toStrictEqual(0.2);
  });
  it('Verify marketplace ceiling prices', () => {
      expect(ceiling.byMarketplace.get(Marketplace.MagicEdenV1)).toStrictEqual(6.9);
      expect(ceiling.byMarketplace.get(Marketplace.MagicEdenV2)).toStrictEqual(420.69);
      expect(ceiling.global).toStrictEqual(420.69);
  });
})