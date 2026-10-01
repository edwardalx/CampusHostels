import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  createMaintenanceRequest,
  getMyMaintenanceRequests,
  getMyMaintenanceTenancies,
} from "../services/MaintenanceService";

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Furniture",
  "Internet",
  "Cleaning",
  "Security",
  "Other",
];

// Matches the enum values the API accepts.
const STATUS_STYLES = {
  Open: "bg-amber-100 text-amber-800",
  InProgress: "bg-blue-100 text-blue-800",
  Resolved: "bg-green-100 text-green-800",
};
const STATUS_LABELS = {
  Open: "Open",
  InProgress: "In progress",
  Resolved: "Resolved",
};

const emptyForm = { tenancyAgreementId: "", category: "Plumbing", title: "", description: "" };

export default function MaintenancePage() {
  const [tenancies, setTenancies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [myTenancies, myRequests] = await Promise.all([
        getMyMaintenanceTenancies(),
        getMyMaintenanceRequests(),
      ]);
      setTenancies(myTenancies);
      setRequests(myRequests);
      // Pre-select when there is only one choice.
      setForm((current) => ({
        ...current,
        tenancyAgreementId:
          current.tenancyAgreementId ||
          (myTenancies.length === 1 ? String(myTenancies[0].tenancyAgreementId) : ""),
      }));
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Unable to load maintenance requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await createMaintenanceRequest({
        tenancyAgreementId: Number(form.tenancyAgreementId),
        category: form.category,
        title: form.title,
        description: form.description,
      });
      toast.success("Your request has been sent to the property manager.");
      setForm((current) => ({ ...emptyForm, tenancyAgreementId: current.tenancyAgreementId }));
      await load();
    } catch (submitError) {
      toast.error(submitError.message || "Unable to submit your request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "field";

  return (
    <div className="flex flex-1 flex-col items-center gap-6 bg-secondary-light-gray px-4 py-8 sm:py-12">
      <h1 className="w-full max-w-2xl text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">Maintenance</h1>

      {isLoading && <p className="text-gray-600">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && (
        <>
          <section className="card w-full max-w-2xl p-5 sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Report a problem</h3>

            {tenancies.length === 0 ? (
              <p className="text-gray-600">
                You need a current, paid tenancy before you can raise a maintenance request.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Room
                  <select
                    className={inputClass}
                    value={form.tenancyAgreementId}
                    onChange={update("tenancyAgreementId")}
                    required
                  >
                    <option value="">Select your room</option>
                    {tenancies.map((tenancy) => (
                      <option key={tenancy.tenancyAgreementId} value={tenancy.tenancyAgreementId}>
                        {tenancy.propertyName} - room {tenancy.roomNumber ?? "n/a"}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  What is it about?
                  <select className={inputClass} value={form.category} onChange={update("category")}>
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Short summary
                  <input
                    className={inputClass}
                    value={form.title}
                    onChange={update("title")}
                    minLength={3}
                    maxLength={120}
                    placeholder="e.g. Leaking tap in the bathroom"
                    required
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                  Details
                  <textarea
                    className={`${inputClass} min-h-32`}
                    value={form.description}
                    onChange={update("description")}
                    minLength={10}
                    maxLength={2000}
                    placeholder="Tell us what is wrong and when it started"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full"
                >
                  {isSubmitting ? "Sending..." : "Send request"}
                </button>
              </form>
            )}
          </section>

          <section className="w-full max-w-2xl">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Your requests</h3>
            {requests.length === 0 ? (
              <p className="text-gray-600">You have not raised any requests yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {requests.map((request) => (
                  <li key={request.id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 break-words">{request.title}</p>
                        <p className="text-sm text-gray-500">
                          {request.category} · {request.propertyName}, room {request.roomNumber ?? "n/a"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[request.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {STATUS_LABELS[request.status] ?? request.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 break-words">{request.description}</p>
                    <p className="mt-2 text-xs text-gray-400">
                      Raised {new Date(request.createdAt).toLocaleDateString("en-GB")}
                      {request.resolvedAt
                        ? ` · Resolved ${new Date(request.resolvedAt).toLocaleDateString("en-GB")}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
