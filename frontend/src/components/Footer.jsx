const Footer = () => {
  return (
    <footer className="bg-black text-gray-300 py-12">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Footer Grid */}
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand Info */}
          <div>
            <h3 className="text-white text-xl font-bold mb-4">SML Cars</h3>
            <p className="text-sm leading-relaxed">
              15+ Years of legacy, thousands of happy customers & the same old
              trust.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Home", href: "/" },
                { label: "Cars", href: "/cars" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="hover:text-green-400 transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-2 text-sm">
              <li>44, 2nd Main Rd, behind DR. KAMAKSHI MEMORIAL HOSPITAL, Ram Nagar South Extension, Ram Nagar South, Extension, Chennai, Tamil Nadu 600100</li>
              <li>
                Phone:{" "}
                <a href="tel:+15551234567" className="hover:text-green-400">
                  +91 63841 84188
                </a>
              </li>
              <li>
                Email:{" "}
                <a
                  href="mailto:info@premiumauto.com"
                  className="hover:text-green-400"
                >
                  info@premiumauto.com
                </a>
              </li>
              <li>Mon–Sun: 9:00 AM – 8:00 PM</li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>Buy Pre-Owned Cars</li>
              <li>Sell Your Car</li>
              <li>Car Financing</li>
              <li>Trade-In Services</li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
          <p>
            © {new Date().getFullYear()} SML Cars. All rights reserved. | 90
            years of trusted automotive excellence
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
