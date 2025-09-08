export default function OCR(){
  return (
    <div className="card p-6">
      <h2 className="text-2xl font-semibold">Scanner un ticket (OCR)</h2>
      <p className="text-white/70 mt-2">Stub OCR : ajoutez votre logique d'upload (image/caméra) et le pipeline OCR ici.</p>
      <div className="mt-4 grid gap-3">
        <input type="file" accept="image/*" className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20" />
        <button className="link-btn w-full sm:w-auto">Analyser</button>
      </div>
    </div>
  )
}
