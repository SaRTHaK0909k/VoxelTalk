const Logo = ({ src = "/newlogo.png" }) => {
  return (
    <div>
        <a href="/">
            <img
            src={src}
            alt="VoxelTalk Logo"
            className="h-10"
            />
        </a>
    </div>
  )
}

export default Logo
