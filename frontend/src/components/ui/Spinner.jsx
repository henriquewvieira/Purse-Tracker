export default function Spinner({ size = 'md' }) {
  const s = size === 'lg' ? 'w-10 h-10 border-4' : 'w-5 h-5 border-2'
  return (
    <div className={`${s} border-indigo-500 border-t-transparent rounded-full animate-spin`} />
  )
}
