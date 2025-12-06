import { SignIn } from "@clerk/clerk-react"; // or wherever you import Clerk's SignIn
import Aurora from "@/components/ui/aurora";

export default function SignInPage() {
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
            <a href="/" className="flex items-center font-semibold text-xl tracking-tight">
              <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
                VoxelTalk
              </span>
            </a>
        </div>

        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </div>
    </div>
  );
}
