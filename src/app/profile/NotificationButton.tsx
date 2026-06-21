'use client'

export function NotificationButton() {
  const handleClick = () => {
    alert('Pentru a primi notificări, trebuie să instalezi aplicația pe telefon (Add to Home Screen).')
  }

  return (
    <button 
      onClick={handleClick}
      className="text-sm bg-[var(--color-primary)] px-3 py-1.5 rounded-lg font-bold text-white shadow-lg shadow-[#FF4500]/20"
    >
      Activează
    </button>
  )
}
