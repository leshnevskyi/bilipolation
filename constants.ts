import { enumi, type EnumerationValue } from "@unielit/enumi";

export const LOWER_8_BIT_MASK = 0xff;

export const Axis = enumi("x", "y");
export type Axis = EnumerationValue<typeof Axis>;
