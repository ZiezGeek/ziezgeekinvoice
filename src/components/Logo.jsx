import logoIcon from '../assets/logo-icon.png'
import logoFull from '../assets/logo-full.png'

// variant="icon" — compact shield mark, for tight headers
// variant="full" — shield + wordmark, for the invoice top-left and login screen
export default function Logo({ variant = 'full', height = 48 }) {
  const src = variant === 'icon' ? logoIcon : logoFull
  return (
    <img
      src={src}
      alt="ZiezGeek Aldevinc"
      style={{ height, width: 'auto', display: 'block' }}
    />
  )
}
