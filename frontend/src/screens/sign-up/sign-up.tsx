import { SignUp } from "@clerk/clerk-react"
import Aurora from "@/components/ui/aurora";

export default function SignUpPage() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center bg-black justify-center">
      {/* Aurora background */}
      <div className="absolute inset-0 z-0">
        <Aurora
        colorStops={["#3A29FF", "#FF94B4", "#FF3232"]}
        blend={0.5}
        amplitude={1.0}
        speed={0.5}
      />
      </div>

      {/* Sign-in box */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative right-[-5%]">
            <a href="/">
                <img
                src="/logoonly.png"
                alt="VoxelTalk Logo"
                className="h-12"
                />
            </a>
        </div>

        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
      </div>
    </div>
  )
}