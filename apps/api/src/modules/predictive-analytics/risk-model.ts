import { PredictiveModelInfo } from '@krypton/types';

export interface TrainingSample { features: number[]; outcome: 0 | 1; date: Date }
export const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const sigmoid = (value: number) => 1 / (1 + Math.exp(-clamp(value, -30, 30)));

/** Small, regularized logistic model. All features must be available BEFORE the outcome. */
export function trainRiskModel(samples: TrainingSample[]) {
  const info: PredictiveModelInfo = {
    status: 'INSUFFICIENT_HISTORY', samples: samples.length, validationSamples: 0,
    balancedAccuracy: null, brierScore: null,
  };
  const unavailable = () => ({ info, predict: null });
  if (samples.length < 60) return unavailable();
  const sorted = [...samples].sort((a, b) => a.date.getTime() - b.date.getTime());
  const cutoff = sorted[Math.floor(sorted.length * 0.75)].date.getTime();
  // Entire dates stay together: the same examination cannot straddle the split.
  const training = sorted.filter(s => s.date.getTime() < cutoff);
  const validation = sorted.filter(s => s.date.getTime() >= cutoff);
  info.validationSamples = validation.length;
  const positives = (rows: TrainingSample[]) => rows.filter(s => s.outcome === 1).length;
  if (training.length < 40 || positives(training) < 10 || training.length - positives(training) < 10 ||
      validation.length < 15 || positives(validation) < 5 || validation.length - positives(validation) < 5) return unavailable();
  const weights = new Array(training[0].features.length + 1).fill(0) as number[];
  const predict = (features: number[]) => sigmoid(weights[0] + features.reduce((n, x, i) => n + x * weights[i + 1], 0));
  for (let epoch = 0; epoch < 500; epoch++) {
    const gradient = weights.map(() => 0);
    for (const sample of training) {
      const error = predict(sample.features) - sample.outcome;
      gradient[0] += error;
      sample.features.forEach((x, i) => { gradient[i + 1] += error * x; });
    }
    weights.forEach((w, i) => { weights[i] -= 0.2 * (gradient[i] / training.length + (i ? 0.01 * w : 0)); });
  }
  const baseRate = positives(training) / training.length;
  let tp = 0, tn = 0, brier = 0, baseline = 0;
  for (const sample of validation) {
    const prediction = predict(sample.features);
    if (sample.outcome === 1 && prediction >= 0.5) tp++;
    if (sample.outcome === 0 && prediction < 0.5) tn++;
    brier += (prediction - sample.outcome) ** 2;
    baseline += (baseRate - sample.outcome) ** 2;
  }
  const accuracy = (tp / positives(validation) + tn / (validation.length - positives(validation))) / 2;
  info.balancedAccuracy = Math.round(accuracy * 1000) / 1000;
  info.brierScore = Math.round(brier / validation.length * 1000) / 1000;
  if (accuracy < 0.6 || brier >= baseline) {
    info.status = 'VALIDATION_FAILED';
    return unavailable();
  }
  info.status = 'ACTIVE';
  // Return the temporally validated weights; do not silently retrain on the holdout.
  return { info, predict };
}
