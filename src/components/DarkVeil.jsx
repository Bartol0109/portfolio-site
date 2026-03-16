/**
 * Dark Veil – tamna, atmosferska pozadina u stilu React Bits Dark Veil.
 * Tamna podloga + blagi gradijent + suptilne animirane scan linije.
 * @see https://reactbits.dev/backgrounds/dark-veil
 */
export default function DarkVeil() {
  return (
    <div className="dark-veil" aria-hidden="true">
      <div className="dark-veil__gradient" />
      <div className="dark-veil__scanlines" />
    </div>
  )
}
