/** Loader plein écran, affiché pendant la restauration de session. */
export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-gray border-t-navy"
        role="status"
        aria-label="Chargement"
      />
    </div>
  );
}
