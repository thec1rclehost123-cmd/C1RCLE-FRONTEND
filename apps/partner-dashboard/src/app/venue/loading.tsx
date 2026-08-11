export default function VenueLoading() {
  return (
    <div className="venue-route-loading" aria-label="Loading Venue Studio" role="status">
      <div className="venue-loading-heading" />
      <div className="venue-loading-metrics">{Array.from({ length: 4 }, (_, index) => <div key={index} />)}</div>
      <div className="venue-loading-panel" />
    </div>
  );
}
