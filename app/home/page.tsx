// /home is a legacy route — redirect to the main landing page
import { redirect } from 'next/navigation'

export default function HomeLegacyRedirect() {
  redirect('/')
}
