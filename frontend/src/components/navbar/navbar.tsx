import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/Logo";
import { NavMenu } from "./nav-menu";
import { NavigationSheet } from "./navigation-sheet";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  return (
    <div className="z-50">
      <nav className="fixed top-3 sm:top-6 inset-x-2 sm:inset-x-4 h-14 sm:h-16 border border-white/10 bg-white/10 backdrop-blur-md shadow-md max-w-screen-xl mx-auto rounded-full">
        <div className="h-full flex items-center justify-between mx-auto px-3 sm:px-4">
          <Logo src="/logoonly.png" />

          {/* Desktop Menu */}
          <NavMenu className="hidden md:block text-white" />

          <div className="flex items-center gap-2 sm:gap-3">
            {/* When Signed Out */}
            <SignedOut>
              <Button
                variant="outline"
                className="hidden sm:inline-flex rounded-full text-sm"
                onClick={() => navigate("/sign-in")}
              >
                Sign In
              </Button>
              <Button className="rounded-full text-sm px-3 sm:px-4" onClick={() => navigate("/sign-up")}>
                Get Started
              </Button>
            </SignedOut>

            {/* When Signed In */}
            <SignedIn>
              <Button className="relative inline-flex h-9 sm:h-10 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50" onClick={() => navigate("/canvas")}>
                <span className="absolute inset-[-1000%] animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950/60 px-3 sm:px-5 py-1 text-xs sm:text-sm font-medium text-white backdrop-blur-3xl">
                  Canvas
                </span>
              </Button>
                <UserButton afterSignOutUrl="/" />
            </SignedIn>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <NavigationSheet />
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
