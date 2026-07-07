import { IOrderItem } from "../../models/order";

export const calculateSubtotal = (items: IOrderItem[]): number =>
  items.reduce((sum, item) => sum + item.quantity * item.itemPrice, 0);
