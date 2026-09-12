"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="loading-state" role="alert"><h1>Something went wrong</h1><p>The workspace could not be loaded.</p><button className="primary-button" onClick={() => reset()}>Try again</button></main>;
}