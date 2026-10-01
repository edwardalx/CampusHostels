import { getStoredManagerToken } from './ManagerAuthService'

const propertyUploadUrl =
  (import.meta.env.VITE_IMAGE_UPLOAD_URL as string | undefined) ??
  (import.meta.env.DEV
    ? 'http://localhost:5080/campus-hostels/properties/upload'
    : '/image-service/campus-hostels/properties/upload')

const uploadUrlFor = (category: string) =>
  propertyUploadUrl.replace(/\/properties\/upload$/, `/${category}/upload`)

async function uploadImage(category: string, file: File, name?: string): Promise<string> {
  const token = getStoredManagerToken()
  const formData = new FormData()
  formData.append('file', file)
  if (name) formData.append('name', name)

  const response = await fetch(uploadUrlFor(category), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to upload image')
  }

  // Prefer the environment-independent path so saved records work on every host.
  return (data.path ?? data.url) as string
}

// `name` is turned into the stored file name, e.g. "Chiss Towers" -> chiss-towers-1.jpg
export const uploadPropertyImage = (file: File, name?: string) => uploadImage('properties', file, name)
export const uploadUnitImage = (file: File, name?: string) => uploadImage('rooms', file, name)
