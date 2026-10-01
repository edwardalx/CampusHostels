import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ManagerOwnerOption } from "../type/manager";
import { FunctionType } from "../type/manager";
import {
  fetchManagerOwnerOptions,
} from "../services/ManagerAuthService";
import { uploadPropertyImage } from "../services/ImageService";
import { createProperty } from "../services/PropertyService";

export function CreatePropertyPage() {
  const { manager } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [noOfUnits, setNoOfUnits] = useState("");
  const [noOfFloors, setNoOfFloors] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [owners, setOwners] = useState<ManagerOwnerOption[]>([]);
  const [ownerManagerId, setOwnerManagerId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "saving">("idle");

  useEffect(() => {
    if (!manager) return;
    setOwnerManagerId(manager.managerId);
    if (
      manager.tier !== "Super" &&
      !manager.functions.includes(FunctionType.ManageProperties)
    ) return;

    fetchManagerOwnerOptions()
      .then(setOwners)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Unable to load property owners");
      });
  }, [manager]);

  if (!manager) return <Navigate to="/login" replace />;
  if (
    manager.tier !== "Super" &&
    !manager.functions.includes(FunctionType.ManageProperties)
  ) {
    return <Navigate to="/" replace />;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      let imageUrl: string | undefined;

      if (imageFile) {
        setStatus("uploading");
        imageUrl = await uploadPropertyImage(imageFile, name);
      }

      setStatus("saving");
      await createProperty({
        name,
        location,
        imageUrl,
        noOfUnits: noOfUnits ? Number(noOfUnits) : undefined,
        noOfFloors: noOfFloors ? Number(noOfFloors) : undefined,
        startingPrice: startingPrice ? Number(startingPrice) : undefined,
        ownerManagerId,
      });

      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create property",
      );
    } finally {
      setStatus("idle");
    }
  }

  const isSubmitting = status !== "idle";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-lg flex-col gap-5 rounded-2xl bg-white p-8 shadow-sm"
      >
        <div>
          <p className="text-sm font-medium text-slate-500">Properties</p>
          <h1 className="text-2xl font-semibold text-slate-900">
            Add property
          </h1>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Name
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Location
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </label>

        {(manager.tier === "Super" ||
          manager.functions.includes(FunctionType.ManageProperties)) && (
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Property owner
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
              value={ownerManagerId}
              onChange={(e) => setOwnerManagerId(e.target.value)}
              required
            >
              <option value="">Select a manager</option>
              {owners.map((owner) => (
                <option key={owner.managerId} value={owner.managerId}>
                  {owner.firstName} {owner.lastName} (@{owner.username})
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            No. of units
            <input
              type="number"
              min={0}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
              value={noOfUnits}
              onChange={(e) => setNoOfUnits(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            No. of floors
            <input
              type="number"
              min={0}
              className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
              value={noOfFloors}
              onChange={(e) => setNoOfFloors(e.target.value)}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Starting price GH₵
          <input
            type="number"
            min={0}
            step={0.01}
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Property image
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-slate-500"
            onChange={handleFileChange}
          />
        </label>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Property preview"
            className="h-40 w-full rounded-lg object-cover"
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-row justify-end gap-2">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/")}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="primary-button"
            disabled={isSubmitting || !ownerManagerId}
          >
            {status === "uploading"
              ? "Uploading image…"
              : status === "saving"
                ? "Saving…"
                : "Create property"}
          </button>
        </div>
      </form>
    </div>
  );
}
