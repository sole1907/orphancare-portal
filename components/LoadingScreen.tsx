export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center px-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-50 mb-6" />
      <h2 className="text-xl font-semibold text-gray-700">
        Preparing something meaningful…
      </h2>
      <p className="text-sm text-gray-500 mt-2">
        Just a moment — we’re making sure everything is secure and ready.
      </p>
    </div>
  );
}
