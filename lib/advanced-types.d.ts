export type DeepPartial<T> =
  T extends Record<PropertyKey, unknown>
    ? {[Key in keyof T]?: DeepPartial<T[Key]>}
    : T extends unknown[]
    ? Array<DeepPartial<T[number]>>
    : T;
