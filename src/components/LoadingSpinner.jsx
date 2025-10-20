const LoadingSpinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  return (
    <div className={`${sizeClasses[size]} animate-spin`}>
      <div className="w-full h-full border-2 border-white/30 border-t-white rounded-full"></div>
    </div>
  )
}

export default LoadingSpinner