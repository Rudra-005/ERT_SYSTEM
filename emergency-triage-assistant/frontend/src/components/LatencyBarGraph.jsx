import { motion } from 'framer-motion';

export default function LatencyBarGraph({ performance }) {
  const stages = [
    { name: 'Compression', value: performance.compression_ms || 0, color: 'bg-blue-500' },
    { name: 'Recommendation', value: performance.recommendation_ms || 0, color: 'bg-indigo-500' },
    { name: 'Verification', value: performance.verification_ms || 0, color: 'bg-emerald-500' },
    { name: 'Confidence', value: performance.confidence_ms || 0, color: 'bg-amber-500' }
  ];

  const maxValue = Math.max(1, ...stages.map(s => s.value));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white mb-4">⚡ Latency Breakdown</h3>
      {stages.map((stage, index) => (
        <div key={stage.name} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-slate-400">{stage.name}</span>
            <span className="text-slate-500">{stage.value}ms</span>
          </div>
          <div className="h-7 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${stage.color} flex items-center justify-end pr-3 rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.max((stage.value / maxValue) * 100, 8)}%` }}
              transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
            >
              <span className="text-white text-xs font-bold">{stage.value}ms</span>
            </motion.div>
          </div>
        </div>
      ))}
      <div className="pt-3 border-t border-white/5">
        <div className="flex justify-between">
          <span className="font-bold text-white">Total</span>
          <span className="font-bold text-indigo-400">{performance.total_ms}ms</span>
        </div>
      </div>
    </div>
  );
}
