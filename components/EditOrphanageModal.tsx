import {
  EditableOrphanageField,
  EditOrphanageModalProps,
} from "../types/orphanage";
import { formatInputValue } from "../utils/format";

export default function EditOrphanageModal({
  open,
  onClose,
  orphanage,
  onSave,
}: EditOrphanageModalProps) {
  if (!open) return null;

  const editableFields: EditableOrphanageField[] = [
    "name",
    "contactName",
    "email",
    "phone",
    "address",
    "registrationNumber",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow max-w-lg w-full">
        <h3 className="text-lg font-bold mb-4">Edit Orphanage</h3>
        {editableFields.map((field) => (
          <input
            key={field}
            className="border rounded px-4 py-2 mb-3 w-full"
            placeholder={field}
            value={formatInputValue(orphanage[field])}
            onChange={(e) => onSave({ ...orphanage, [field]: e.target.value })}
          />
        ))}
        <div className="flex justify-end gap-4 mt-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={() => onClose()}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-primary text-white rounded"
            onClick={() => onClose(true)}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
