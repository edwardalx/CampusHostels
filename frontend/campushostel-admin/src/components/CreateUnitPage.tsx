import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FunctionType } from "../type/manager";
import type { ManagedProperty } from "../type/property";
import { fetchManagedProperties } from "../services/PropertyService";
import { uploadUnitImage } from "../services/ImageService";
import { createUnit } from "../services/UnitService";

const unitTypes = ["Single", "Double", "Triple", "Quad"];

export function CreateUnitPage() {
  const { manager } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [properties, setProperties] = useState<ManagedProperty[]>([]);
  const [propertyId, setPropertyId] = useState(searchParams.get("propertyId") ?? "");
  const [floor, setFloor] = useState("0");
  const [roomNumber, setRoomNumber] = useState("");
  const [cost, setCost] = useState("");
  const [maxNoOfPeople, setMaxNoOfPeople] = useState("");
  const [unitType, setUnitType] = useState("Single");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "saving">("idle");

  const canManage =
    manager?.tier === "Super" || manager?.functions.includes(FunctionType.ManageProperties);

  useEffect(() => {
    if (!canManage) return;
    const controller = new AbortController();
    fetchManagedProperties(controller.signal)
      .then(setProperties)
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Unable to load properties");
        }
      });
    return () => controller.abort();
  }, [canManage]);

  if (!manager) return <Navigate to="/login" replace />;
  if (!canManage) return <Navigate to="/" replace />;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setImageFiles((current) => [...current, ...files]);
    setPreviewUrls((current) => [...current, ...files.map((file) => URL.createObjectURL(file))]);
    e.target.value = "";
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previewUrls[index]);
    setImageFiles((current) => current.filter((_, i) => i !== index));
    setPreviewUrls((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const imageUrls: string[] = [];

      if (imageFiles.length > 0) {
        setStatus("uploading");
        const propertyName = properties.find((p) => String(p.id) === propertyId)?.name ?? "";
        const imageName = `${propertyName} room ${roomNumber}`;
        for (const file of imageFiles) {
          imageUrls.push(await uploadUnitImage(file, imageName));
        }
      }

      setStatus("saving");
      await createUnit({
        propertyId: Number(propertyId),
        floor: Number(floor),
        roomNumber: roomNumber || undefined,
        imageUrl: imageUrls[0],
        imageUrls,
        cost: cost ? Number(cost) : undefined,
        maxNoOfPeople: maxNoOfPeople ? Number(maxNoOfPeople) : undefined,
        unitType,
      });

      navigate("/properties");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create unit");
    } finally {
      setStatus("idle");
    }
  }

  const isSubmitting = status !== "idle";
  const inputClass =
    "rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500";
  const labelClass = "flex flex-col gap-1 text-sm font-medium text-slate-700";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-lg flex-col gap-5 rounded-2xl bg-white p-8 shadow-sm"
      >
        <div>
          <p className="text-sm font-medium text-slate-500">Properties</p>
          <h1 className="text-2xl font-semibold text-slate-900">Add unit</h1>
        </div>

        <label className={labelClass}>
          Property
          <select
            className={inputClass}
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            required
          >
            <option value="">Select a property</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name} — {property.location}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Room number
            <input
              className={inputClass}
              value={roomNumber}
              maxLength={50}
              onChange={(e) => setRoomNumber(e.target.value)}
              required
            />
          </label>

          <label className={labelClass}>
            Floor
            <input
              type="number"
              min={0}
              className={inputClass}
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className={labelClass}>
            Unit type
            <select
              className={inputClass}
              value={unitType}
              onChange={(e) => setUnitType(e.target.value)}
              required
            >
              {unitTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClass}>
            Max no. of people
            <input
              type="number"
              min={1}
              className={inputClass}
              value={maxNoOfPeople}
              onChange={(e) => setMaxNoOfPeople(e.target.value)}
            />
          </label>
        </div>

        <label className={labelClass}>
          Cost GH₵
          <input
            type="number"
            min={0}
            step={0.01}
            className={inputClass}
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </label>

        <label className={labelClass}>
          Unit images
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            className={inputClass}
            onChange={handleFileChange}
          />
        </label>

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, index) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt={`Unit preview ${index + 1}`}
                  className="h-24 w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  aria-label={`Remove image ${index + 1}`}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-2 text-xs text-white"
                  onClick={() => removeImage(index)}
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-row justify-end gap-2">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/properties")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={isSubmitting || !propertyId}>
            {status === "uploading"
              ? "Uploading images…"
              : status === "saving"
                ? "Saving…"
                : "Create unit"}
          </button>
        </div>
      </form>
    </div>
  );
}
