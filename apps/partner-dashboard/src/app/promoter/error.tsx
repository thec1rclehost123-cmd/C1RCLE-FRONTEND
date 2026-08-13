'use client';

export default function PromoterError({ reset }: { readonly reset: () => void }) {
  return (
    <section className="pr-state-page" role="alert">
      <span>Something went wrong</span>
      <h1>Promoter Studio could not load.</h1>
      <p>Your data was not changed. Try loading this view again.</p>
      <button className="pr-button pr-button--primary" type="button" onClick={reset}>
        Try again
      </button>
    </section>
  );
}
