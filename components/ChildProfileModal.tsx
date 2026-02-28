// components/ChildProfileModal.tsx
import { DonationChildInfo } from "@/types/donation";

interface ChildProfileModalProps {
  open: boolean;
  onClose: () => void;
  child: DonationChildInfo;
}

export default function ChildProfileModal({
  open,
  onClose,
  child,
}: ChildProfileModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">Child Profile</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Photo */}
          <div className="flex justify-center mb-4">
            {child.photoUrl ? (
              <img
                src={child.photoUrl}
                alt={child.childName}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-primary/20">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Name */}
          <h4 className="text-xl font-semibold text-center text-gray-900 mb-4">
            {child.childName}
          </h4>

          {/* Details */}
          <div className="space-y-3">
            {/* Gender */}
            {child.gender && (
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-sm font-medium w-16">
                  Gender:
                </span>
                <span className="text-gray-900">
                  {child.gender.charAt(0).toUpperCase() + child.gender.slice(1)}
                </span>
              </div>
            )}

            {/* Story */}
            {child.story && (
              <div>
                <span className="text-gray-500 text-sm font-medium block mb-1">
                  Story:
                </span>
                <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                  {child.story}
                </p>
              </div>
            )}

            {!child.story && !child.gender && (
              <p className="text-gray-500 text-sm text-center py-2">
                No additional information available.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t">
          <button
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
