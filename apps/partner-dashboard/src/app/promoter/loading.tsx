export default function PromoterLoading() {
  return (
    <div className="promoter-loading" role="status" aria-label="Loading promoter workspace">
      <span />
      <div className="promoter-loading-title" />
      <div className="promoter-loading-metrics">{Array.from({ length: 4 }, (_, index) => <i key={index} />)}</div>
      <div className="promoter-loading-panel" />
    </div>
  );
}
