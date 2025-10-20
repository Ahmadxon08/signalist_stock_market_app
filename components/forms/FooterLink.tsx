import Link from "next/link";
import React from "react";

const FooterLink = ({ text, linkText, href }: FooterLinkProps) => {
  return (
    <div className="text-center pt-4">
      <p className="text-sm text-gray-500">
        {text}{" "}
        <Link
          href={href}
          className="text-gray-400  hover:text-yellow-400 duration-300 transition-all"
        >
          {linkText}
        </Link>
      </p>
    </div>
  );
};

export default FooterLink;
