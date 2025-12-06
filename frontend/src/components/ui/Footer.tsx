import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  GithubIcon,
  Instagram,
  Linkedin,
  TwitterIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const footerLinks = [
  {
    title: "Overview",
    href: "#",
  },
  {
    title: "Features",
    href: "#",
  },
  {
    title: "Pricing",
    href: "#",
  },
  {
    title: "Help",
    href: "#",
  },
  {
    title: "Privacy",
    href: "#",
  },
];

const Footer = () => {
  return (
    <div className="bg-black w-full px-0 z-10 flex flex-col">
      <footer>
        <div className="max-w-screen-xl mx-auto">
          <div className="py-12 flex flex-col sm:flex-row items-start justify-between gap-x-10 gap-y-10 px-6 xl:px-0">
            <div>
              <Logo />
              <p className="text-muted/80">We do the math so you don't have to.</p>
              <ul className="mt-6 flex items-center gap-4 flex-wrap">
                {footerLinks.map(({ title, href }) => (
                  <li key={title}>
                    <Link
                      to={href}
                      className="text-muted/80 hover:text-muted/60"
                    >
                      {title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Subscribe Newsletter */}
            <div className="max-w-xs w-full">
              <h6 className="font-semibold text-muted/80">Stay up to date</h6>
              <form className="mt-6 flex items-center gap-2">
                <Input className="text-muted/80" type="email" placeholder="Enter your email" />
                <Button variant="outline">Subscribe</Button>
              </form>
            </div>
          </div>
          <Separator className="bg-muted/80" />
          <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
            {/* Copyright */}
            <span className="text-muted/80">
              &copy; {new Date().getFullYear()}{" "}
              <Link to="/" target="_blank">
                Shadcn UI Blocks
              </Link>
              . All rights reserved.
            </span>

            <div className="flex items-center gap-5 text-muted/80">
              <Link to="#" target="_blank">
                <TwitterIcon className="h-5 w-5" />
              </Link>
              <Link to="#" target="_blank">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link to="#" target="_blank">
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link to="#" target="_blank">
                <GithubIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
