import { getStoredManagerToken } from './ManagerAuthService'

const uploadUrl =
  (import.meta.env.VITE_IMAGE_UPLOAD_URL as string | undefined) ??
  'http://images.campushostels.duckdns.org/campus-hostels/properties/upload'

export async function uploadPropertyImage(file: File): Promise<string> {
  const token = getStoredManagerToken()
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error ?? 'Unable to upload image')
  }

  return data.url as string
}
