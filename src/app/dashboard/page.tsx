export default function DashboardPage() {
  return (
    <div className="p-4 pt-8">
      <h1 className="text-2xl font-bold text-[var(--color-primary)] mb-6">Salut, Champ! 💪</h1>
      
      <div className="bg-[var(--color-surface)] p-4 rounded-xl shadow-lg border border-[var(--color-border)] mb-6">
        <h2 className="text-lg font-semibold mb-2">Antrenamentul de Azi</h2>
        <p className="text-[var(--color-muted)] mb-4">Azi e zi de Chest Day. Ești gata?</p>
        <button className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors">
          Începe Antrenamentul
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">3</span>
          <span className="text-xs text-[var(--color-muted)] text-center mt-1">Zile la rând</span>
        </div>
        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">12</span>
          <span className="text-xs text-[var(--color-muted)] text-center mt-1">Exerciții completate</span>
        </div>
      </div>
    </div>
  )
}
