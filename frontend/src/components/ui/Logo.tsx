const Logo = ({ src = "/newlogo.png" }) => {
  return (
    <div className="flex-shrink-0">
        <a href="/" className="flex items-center">
            <img
            src={src}
            alt="VoxelTalk Logo"
            className="h-8 sm:h-10 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/newlogo.png";
            }}
            />
        </a>
    </div>
  )
}

export default Logo
