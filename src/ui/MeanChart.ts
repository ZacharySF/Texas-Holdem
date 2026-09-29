export interface MeanPoint {
  samples: number;
  mean: number;
  interval: readonly [number, number];
  exact: number;
}
