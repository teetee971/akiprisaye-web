import React, { Suspense, lazy } from 'react';
import LoadingSkeleton from './LoadingSkeleton';
import type { PriceChartProps } from './PriceChart';

const PriceChart = lazy(() => import('./PriceChart'));

const LazyPriceChart: React.FC<PriceChartProps> = (props) => (
  <Suspense fallback={<LoadingSkeleton type="chart" />}>
    <PriceChart {...props} />
  </Suspense>
);

export default LazyPriceChart;
